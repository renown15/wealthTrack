"""
Test file size constraints (max 200 lines per file).
Enforces constraint across Python backend and TypeScript frontend code.
"""
import pathlib


def count_lines(file_path: pathlib.Path) -> int:
    """Count non-blank lines in a file."""
    with open(file_path, encoding="utf-8") as f:
        return len([line for line in f if line.strip()])


def test_python_files_under_200_lines():
    """Ensure all Python files are under 200 lines."""
    app_dir = pathlib.Path(__file__).parent.parent / "app"
    max_lines = 200
    violations = []

    for py_file in app_dir.rglob("*.py"):
        lines = count_lines(py_file)
        if lines > max_lines:
            violations.append(f"{py_file.relative_to(app_dir.parent)}: {lines} lines")

    assert not violations, (
        f"Python files exceed {max_lines} line limit:\n" + "\n".join(violations)
    )


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

    assert not violations, (
        f"Python test files exceed {max_lines} line limit:\n" + "\n".join(violations)
    )


def test_typescript_files_under_200_lines():
    """Ensure all TypeScript source files are under 200 lines."""
    src_dir = pathlib.Path(__file__).parent.parent.parent / "frontend" / "src"
    max_lines = 200
    violations = []

    if not src_dir.exists():
        return  # Frontend may not be present in all environments

    for ts_file in src_dir.rglob("*.ts"):
        # Skip type definition files
        if ts_file.suffix == ".d.ts":
            continue
        lines = count_lines(ts_file)
        if lines > max_lines:
            rel_path = ts_file.relative_to(src_dir.parent)
            violations.append(f"{rel_path}: {lines} lines")

    assert not violations, (
        f"TypeScript source files exceed {max_lines} line limit:\n" + "\n".join(violations)
    )


def test_vue_files_under_200_lines():
    """Ensure all Vue component files are under 200 lines."""
    src_dir = pathlib.Path(__file__).parent.parent.parent / "frontend" / "src"
    max_lines = 200
    violations = []

    if not src_dir.exists():
        return  # Frontend may not be present in all environments

    for vue_file in src_dir.rglob("*.vue"):
        lines = count_lines(vue_file)
        if lines > max_lines:
            rel_path = vue_file.relative_to(src_dir.parent)
            violations.append(f"{rel_path}: {lines} lines")

    assert not violations, (
        f"Vue component files exceed {max_lines} line limit:\n" + "\n".join(violations)
    )


def test_typescript_test_files_under_200_lines():
    """Ensure all TypeScript test files are under 200 lines."""
    tests_dir = pathlib.Path(__file__).parent.parent.parent / "frontend" / "tests"
    max_lines = 200
    violations = []

    if not tests_dir.exists():
        return  # Frontend may not be present in all environments

    # Allow certain integration test files to exceed the limit
    allowlist = {"integration.hub.test.ts"}

    for ts_file in tests_dir.glob("*.test.ts"):
        if ts_file.name in allowlist:
            continue  # Skip allowlisted files
        lines = count_lines(ts_file)
        if lines > max_lines:
            violations.append(f"{ts_file.name}: {lines} lines")

    assert not violations, (
        f"TypeScript test files exceed {max_lines} line limit:\n" + "\n".join(violations)
    )

