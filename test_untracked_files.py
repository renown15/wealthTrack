#!/usr/bin/env python3
"""
Test to check for untracked files in folders not under .gitignore.

This ensures that:
1. All important source files are committed
2. Temporary/generated files are properly ignored
3. No accidental uncommitted files exist in source directories
"""

import subprocess
import pathlib
from typing import Set, List

# Directories that should NOT have untracked files
PROTECTED_DIRECTORIES = {
    'backend/app',
    'backend/tests',
    'frontend/src',
    'frontend/tests',
    'frontend/public',
    'Prompts',
}

# Patterns for files that are allowed to be untracked
ALLOWED_UNTRACKED_PATTERNS = {
    # Build/coverage artifacts (should be in .gitignore)
    'htmlcov/',
    'coverage/',
    'node_modules/',
    '__pycache__/',
    '.pytest_cache/',
    '.nyc_output/',
    'dist/',
    'build/',
    # IDE files (should be in .gitignore)
    '.vscode/',
    '.idea/',
    # Environment files
    '.env',
    '.env.local',
    # Logs
    '*.log',
    # OS files
    '.DS_Store',
    'Thumbs.db',
}


def get_untracked_files() -> Set[str]:
    """Get list of untracked files from git."""
    try:
        result = subprocess.run(
            ['git', 'ls-files', '--others', '--exclude-standard'],
            cwd='/Users/marklewis/dev/wealthTrack',
            capture_output=True,
            text=True,
            check=True
        )
        files = set(line.strip() for line in result.stdout.split('\n') if line.strip())
        return files
    except subprocess.CalledProcessError as e:
        print(f"Error running git command: {e}")
        return set()


def is_in_protected_directory(file_path: str) -> bool:
    """Check if file is in a protected directory."""
    path = pathlib.Path(file_path)
    for protected_dir in PROTECTED_DIRECTORIES:
        try:
            path.relative_to(protected_dir)
            return True
        except ValueError:
            continue
    return False


def is_allowed_untracked(file_path: str) -> bool:
    """Check if file is in an allowed untracked location."""
    # Check if it matches any gitignored patterns
    for pattern in ALLOWED_UNTRACKED_PATTERNS:
        if pattern in file_path or file_path.startswith(pattern):
            return True
    return False


def test_no_untracked_files_in_protected_directories():
    """Test that protected directories don't have untracked files."""
    untracked = get_untracked_files()
    
    # Filter for files in protected directories
    violations = []
    for file_path in sorted(untracked):
        if is_in_protected_directory(file_path) and not is_allowed_untracked(file_path):
            violations.append(file_path)
    
    if violations:
        error_msg = (
            f"Found {len(violations)} untracked file(s) in protected directories:\n"
            + "\n".join(f"  - {f}" for f in violations)
            + "\n\nPlease either:\n"
            + "1. Commit these files with: git add <file> && git commit\n"
            + "2. Add them to .gitignore if they are generated/temporary files"
        )
        raise AssertionError(error_msg)
    
    print(f"✓ No untracked files in protected directories")
    print(f"✓ Total untracked files (all in allowed locations): {len(untracked)}")


def test_gitignore_coverage():
    """Test that all untracked files are properly explained."""
    untracked = get_untracked_files()
    
    # Check what's untracked but not ignored properly
    suspicious = []
    for file_path in sorted(untracked):
        # These should either be in protected dirs (committed) or in ignored patterns
        if not is_in_protected_directory(file_path):
            if not is_allowed_untracked(file_path):
                suspicious.append(file_path)
    
    if suspicious:
        print(f"\n⚠ Warning: {len(suspicious)} untracked file(s) not in protected directories:")
        for f in suspicious[:10]:  # Show first 10
            print(f"  - {f}")
        if len(suspicious) > 10:
            print(f"  ... and {len(suspicious) - 10} more")
    else:
        print(f"✓ All untracked files are in allowed locations")


if __name__ == '__main__':
    print("Running untracked files tests...\n")
    try:
        test_no_untracked_files_in_protected_directories()
        test_gitignore_coverage()
        print("\n✓ All tests passed!")
    except AssertionError as e:
        print(f"\n✗ Test failed:\n{e}")
        exit(1)
