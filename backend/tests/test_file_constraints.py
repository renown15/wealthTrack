"""
Test file size constraints (max 200 lines per file).
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
        f"Files exceed {max_lines} line limit:\n" + "\n".join(violations)
    )


def test_test_files_under_200_lines():
    """Ensure all test files are under 200 lines."""
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
        f"Test files exceed {max_lines} line limit:\n" + "\n".join(violations)
    )
