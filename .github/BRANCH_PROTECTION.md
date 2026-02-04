# Branch Protection Rules for WealthTrack

This document outlines the branch protection rules that should be configured on GitHub for the `main` and `develop` branches.

## How to Configure Branch Protection Rules

1. Go to GitHub repository Settings
2. Navigate to **Branches** → **Branch protection rules**
3. Click **Add rule**
4. Follow the rules below

---

## Rule 1: Main Branch (`main`)

**Branch name pattern**: `main`

### Protection Settings

#### Required Reviews
- ✅ **Require a pull request before merging**
  - Require approvals: **2** (two independent reviewers)
  - Dismiss stale pull request approvals when new commits are pushed: ✅
  - Require review from code owners: ✅ (if CODEOWNERS file exists)

#### Required Status Checks
- ✅ **Require status checks to pass before merging**
  - Require branches to be up to date before merging: ✅
  
  **Select status checks required to pass**:
  - `Backend - Lint, Type Check, and Test`
  - `Frontend - Lint, Type Check, and Test`
  - `Docker - Build Images`

#### Other Rules
- ✅ **Require branches to be up to date before merging**
- ✅ **Require conversation resolution before merging**
- ✅ **Require deployments to succeed before merging** (if applicable)
- ✅ **Restrict who can push to matching branches**
  - Allowed to push: Administrators only
- ✅ **Allow force pushes** - ❌ Disabled (do not allow)
- ✅ **Allow deletions** - ❌ Disabled (do not allow)

---

## Rule 2: Develop Branch (`develop`)

**Branch name pattern**: `develop`

### Protection Settings

#### Required Reviews
- ✅ **Require a pull request before merging**
  - Require approvals: **1** (one reviewer)
  - Dismiss stale pull request approvals when new commits are pushed: ✅
  - Require review from code owners: ⚠️ Optional

#### Required Status Checks
- ✅ **Require status checks to pass before merging**
  - Require branches to be up to date before merging: ✅
  
  **Select status checks required to pass**:
  - `Backend - Lint, Type Check, and Test`
  - `Frontend - Lint, Type Check, and Test`

#### Other Rules
- ✅ **Require branches to be up to date before merging**
- ✅ **Require conversation resolution before merging** ⚠️ Optional
- ✅ **Restrict who can push to matching branches** ⚠️ Optional
- ✅ **Allow force pushes** - ❌ Disabled (do not allow)
- ✅ **Allow deletions** - ❌ Disabled (do not allow)

---

## Rule 3: Release Branches (Optional)

**Branch name pattern**: `release/**`

### Protection Settings (Lightweight)

#### Required Reviews
- ✅ **Require a pull request before merging**
  - Require approvals: **1**

#### Required Status Checks
- ✅ **Require status checks to pass before merging**
  - Both frontend and backend checks required

---

## Dismissing Stale Reviews

When configured, stale reviews will be automatically dismissed when:
- New commits are pushed to the PR
- This ensures reviewers re-check the changes

---

## Code Owners

Create a `.github/CODEOWNERS` file (optional) to specify who should review changes:

```
# Backend
/backend/          @backend-maintainers

# Frontend
/frontend/         @frontend-maintainers

# Workflows
/.github/          @maintainers

# Root files
/docker-compose.yml @maintainers
```

---

## Status Checks Explained

### Backend - Lint, Type Check, and Test
- **Ruff**: Code linting (0 warnings required)
- **MyPy**: Static type checking
- **Pytest**: Unit tests with 85%+ coverage

### Frontend - Lint, Type Check, and Test
- **ESLint**: Code linting (0 warnings required)
- **TypeScript**: Static type checking
- **Vitest**: Unit tests with 90%+ coverage

---

## Enforcement Notes

### For Main Branch (Production)
- **Strictest enforcement**: Requires 2 approvals + all checks passing
- **No force pushes**: Maintains clean history
- **Limited push access**: Only admins can directly push
- **No deletion**: Branch cannot be deleted

### For Develop Branch (Integration)
- **Standard enforcement**: Requires 1 approval + all checks passing
- **Cleaner workflow**: Better for frequent integration
- **No force pushes**: Maintains history integrity
- **No deletion**: Branch cannot be deleted

### For Feature Branches
- **No special rules**: Developers can freely push/rebase
- **Must pass PR checks**: Before merging to develop/main

---

## GitHub Actions Integration

The CI/CD pipeline (defined in `.github/workflows/ci.yml`) will automatically:

1. Run tests on every push
2. Run linting checks
3. Run type checking
4. Report results to GitHub
5. Block merging if checks fail

---

## Quick Setup Script

Once configured manually, you can export these rules using GitHub API or use this reference.

## Verifying Rules

After configuration, verify by:
1. Creating a test PR with intentional failures
2. Confirming status checks block merging
3. Testing review requirement works
4. Verifying stale review dismissal

---

## References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [About Status Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories/about-status-checks)
- [About Required Reviews](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-a-branch-protection-rule)

---

**Last Updated**: 2026-02-04
**For**: WealthTrack Project
