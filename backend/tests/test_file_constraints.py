"""
Test file size constraints (max 200 lines per file).
Enforces constraint across Python backend and TypeScript frontend code.
"""
import pathlib

TS_ALLOWLIST: frozenset[str] = frozenset()
VUE_ALLOWLIST: frozenset[str] = frozenset()
TS_TEST_ALLOWLIST: frozenset[str] = frozenset()


def count_lines(file_path: pathlib.Path) -> int:
    """Count non-blank lines in a file."""
    with open(file_path, encoding="utf-8") as f:
        return len([line for line in f if line.strip()])


def test_no_allowlist_entries():
    """Ensure no files are exempted from the 200-line constraint."""
    assert not TS_ALLOWLIST, f"TypeScript allowlist must be empty, found: {TS_ALLOWLIST}"
    assert not VUE_ALLOWLIST, f"Vue allowlist must be empty, found: {VUE_ALLOWLIST}"
    assert (
        not TS_TEST_ALLOWLIST
    ), f"TypeScript test allowlist must be empty, found: {TS_TEST_ALLOWLIST}"


def test_python_files_under_200_lines():
    """Ensure all Python files are under 200 lines."""
    app_dir = pathlib.Path(__file__).parent.parent / "app"
    max_lines = 200
    violations = []

    for py_file in app_dir.rglob("*.py"):
        lines = count_lines(py_file)
        if lines > max_lines:
            violations.append(f"{py_file.relative_to(app_dir.parent)}: {lines} lines")

    assert not violations, f"Python files exceed {max_lines} line limit:\n" + "\n".join(violations)


def test_python_test_files_under_200_lines():
    """Ensure all Python test files are under 200 lines."""
    tests_dir = pathlib.Path(__file__).parent
    max_lines = 200
    violations = []

    for py_file in tests_dir.glob("test_*.py"):
        # Skip this constraint test itself
        if py_file.name == "test_file_constraints.py":
            continue
        lines = count_lines(py_file)
        if lines > max_lines:
            violations.append(f"{py_file.name}: {lines} lines")

    assert not violations, f"Python test files exceed {max_lines} line limit:\n" + "\n".join(
        violations
    )


def test_typescript_files_under_200_lines():
    """Ensure all TypeScript source files are under 200 lines."""
    src_dir = pathlib.Path(__file__).parent.parent.parent / "frontend" / "src"
    max_lines = 200
    violations = []

    if not src_dir.exists():
        return  # Frontend may not be present in all environments

    for ts_file in src_dir.rglob("*.ts"):
        # Skip type definition files and machine-generated files
        if ts_file.suffix == ".d.ts":
            continue
        if ts_file.name.endswith(".gen.ts"):
            continue
        if ts_file.name in TS_ALLOWLIST:
            continue
        lines = count_lines(ts_file)
        if lines > max_lines:
            rel_path = ts_file.relative_to(src_dir.parent)
            violations.append(f"{rel_path}: {lines} lines")

    assert not violations, f"TypeScript source files exceed {max_lines} line limit:\n" + "\n".join(
        violations
    )


def test_vue_files_under_200_lines():
    """Ensure all Vue component files are under 200 lines."""
    src_dir = pathlib.Path(__file__).parent.parent.parent / "frontend" / "src"
    max_lines = 200
    violations = []

    if not src_dir.exists():
        return  # Frontend may not be present in all environments

    for vue_file in src_dir.rglob("*.vue"):
        if vue_file.name in VUE_ALLOWLIST:
            continue
        lines = count_lines(vue_file)
        if lines > max_lines:
            rel_path = vue_file.relative_to(src_dir.parent)
            violations.append(f"{rel_path}: {lines} lines")

    assert not violations, f"Vue component files exceed {max_lines} line limit:\n" + "\n".join(
        violations
    )


def test_typescript_test_files_under_200_lines():
    """Ensure all TypeScript test files are under 200 lines."""
    tests_dir = pathlib.Path(__file__).parent.parent.parent / "frontend" / "tests"
    max_lines = 200
    violations = []

    if not tests_dir.exists():
        return  # Frontend may not be present in all environments

    for ts_file in tests_dir.rglob("*.test.ts"):
        if "e2e" in ts_file.parts:
            continue
        if ts_file.name in TS_TEST_ALLOWLIST:
            continue
        lines = count_lines(ts_file)
        if lines > max_lines:
            violations.append(f"{ts_file.relative_to(tests_dir.parent)}: {lines} lines")

    assert not violations, f"TypeScript test files exceed {max_lines} line limit:\n" + "\n".join(
        violations
    )


def test_no_state_error_in_portfolio_consumers():
    """Composables that call usePortfolio() must not assign to state.error.

    usePortfolio() creates a NEW reactive instance on every call — it is not a
    singleton. Any composable that calls usePortfolio() independently gets its
    own state, which is invisible to the template (which watches a different
    instance). Writing state.error there is silently dropped.

    Rule: if a file calls usePortfolio(), it must not assign to state.error.
    Use showError() from useToast() for action errors instead.

    Excluded: usePortfolio.ts (owns the state), portfolioCrudHandlers.ts
    (receives state as a parameter, does not call usePortfolio()).
    """
    import re

    composables_dir = (
        pathlib.Path(__file__).parent.parent.parent / "frontend" / "src" / "composables"
    )
    violations = []

    if not composables_dir.exists():
        return

    allowed = {"usePortfolio.ts"}

    for ts_file in composables_dir.rglob("*.ts"):
        if ts_file.name in allowed:
            continue
        content = ts_file.read_text(encoding="utf-8")
        if "usePortfolio()" not in content:
            continue
        for i, line in enumerate(content.splitlines(), 1):
            if re.search(r"\bstate\.error\s*=", line):
                violations.append(f"{ts_file.name}:{i}: {line.strip()}")

    assert not violations, (
        "Composables that call usePortfolio() must not write state.error — "
        "each call creates a separate reactive instance invisible to the template. "
        "Use showError() from useToast() for action errors:\n" + "\n".join(violations)
    )


def test_no_type_number_inputs():
    """Ban type="number" on inputs not explicitly using v-model.number.

    Vue's v-model on type="number" coerces values to JS numbers at runtime,
    silently breaking string fields and causing 422s from the backend.
    Use type="text" inputmode="decimal" instead.

    Allowed: v-model.number (explicit opt-in to numeric coercion).
    """
    import re

    src_dir = pathlib.Path(__file__).parent.parent.parent / "frontend" / "src"
    violations = []

    if not src_dir.exists():
        return

    for vue_file in src_dir.rglob("*.vue"):
        content = vue_file.read_text(encoding="utf-8")
        # Match each <input .../> block (may span multiple lines)
        for match in re.finditer(r"<input\b[^>]*/?>", content, re.DOTALL):
            element = match.group()
            if 'type="number"' in element and "v-model.number" not in element:
                line_num = content[: match.start()].count("\n") + 1
                rel = vue_file.relative_to(src_dir.parent)
                violations.append(f"{rel}:{line_num}")

    assert not violations, (
        'Use type="text" inputmode="decimal" instead of type="number" — '
        "Vue v-model coerces to JS number, silently breaking string fields:\n"
        + "\n".join(violations)
    )
