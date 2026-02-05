#!/bin/bash

# WealthTrack Pre-commit Hook Setup
# This script sets up pre-commit hooks to run linting and tests before commits

set -e

REPO_ROOT=$(git rev-parse --show-toplevel)
HOOKS_DIR="$REPO_ROOT/.git/hooks"

echo "🎣 Setting up pre-commit hooks..."
echo "=================================="
echo ""

# Create pre-commit hook
echo "Creating pre-commit hook..."

cat > "$HOOKS_DIR/pre-commit" << 'HOOK_EOF'
#!/bin/bash

# Pre-commit Hook for WealthTrack
# Runs linting and type checks before allowing commits

set -e

echo "🔍 Running pre-commit checks..."
echo ""

REPO_ROOT=$(git rev-parse --show-toplevel)

# Check if any frontend files are staged
if git diff --cached --name-only | grep -q "^frontend/"; then
    echo "📦 Checking frontend changes..."
    cd "$REPO_ROOT/frontend"
    
    # Type check
    echo "  • Running TypeScript type check..."
    npm run type-check > /dev/null || {
        echo "  ❌ TypeScript type check failed!"
        exit 1
    }
    
    # Linting
    echo "  • Running ESLint..."
    npm run lint > /dev/null || {
        echo "  ❌ ESLint failed! Run 'npm run lint -- --fix' to auto-fix."
        exit 1
    }
    
    echo "  ✅ Frontend checks passed"
    cd - > /dev/null
    echo ""
fi

# Check if any backend files are staged
if git diff --cached --name-only | grep -q "^backend/"; then
    echo "📦 Checking backend changes..."
    cd "$REPO_ROOT/backend"
    
    # Activate venv if it exists
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    fi
    
    # Ruff linting
    echo "  • Running Ruff linter..."
    ruff check app/ tests/ > /dev/null || {
        echo "  ❌ Ruff failed! Run 'ruff check app/ tests/ --fix' to auto-fix."
        exit 1
    }
    
    # Type check with mypy
    echo "  • Running MyPy type checker..."
    mypy app/ --config-file mypy.ini > /dev/null || {
        echo "  ❌ MyPy failed! Review type annotations."
        exit 1
    }
    
    echo "  ✅ Backend checks passed"
    cd - > /dev/null
    echo ""
fi

echo "✅ Pre-commit checks passed!"
HOOK_EOF

chmod +x "$HOOKS_DIR/pre-commit"

# Create prepare-commit-msg hook for commit message help
cat > "$HOOKS_DIR/prepare-commit-msg" << 'MSG_EOF'
#!/bin/bash

# Prepare-commit-msg Hook for WealthTrack
# Provides helpful commit message template

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2

# Only add template for new commits (not amendments or merges)
if [ "$COMMIT_SOURCE" = "" ]; then
    # Check if commit message is empty
    if [ ! -s "$COMMIT_MSG_FILE" ]; then
        cat >> "$COMMIT_MSG_FILE" << 'TEMPLATE'

# Commit message format:
# <type>(<scope>): <subject>
#
# Types: feat, fix, docs, style, refactor, test, chore, ci
# Example: feat(auth): add two-factor authentication
#
# <body>
# (Optional) More detailed explanation of changes
#
# <footer>
# (Optional) Close issues: fixes #123, resolves #456
TEMPLATE
    fi
fi
MSG_EOF

chmod +x "$HOOKS_DIR/prepare-commit-msg"

echo "✅ Pre-commit hooks installed successfully!"
echo ""
echo "📝 What the hooks do:"
echo "  • pre-commit: Runs linting and type checks before each commit"
echo "  • prepare-commit-msg: Provides commit message template"
echo ""
echo "💡 Tips:"
echo "  • Skip pre-commit checks: git commit --no-verify"
echo "  • View hook files: cat .git/hooks/pre-commit"
echo "  • Remove hooks: rm .git/hooks/pre-commit*"
echo ""
