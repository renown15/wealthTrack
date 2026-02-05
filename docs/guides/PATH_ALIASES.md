# TypeScript Path Aliases Guide

## Overview

This project uses TypeScript path aliases to provide clean, maintainable imports. Instead of relative imports like `../../../services/ApiService`, we use path aliases like `@services/ApiService`.

## Available Aliases

| Alias | Maps to | Usage |
|-------|---------|-------|
| `@/` | `src/` | Root source directory |
| `@controllers/` | `src/controllers/` | Controller classes |
| `@services/` | `src/services/` | API and business logic services |
| `@views/` | `src/views/` | View/component classes |
| `@models/` | `src/models/` | Data models and types |
| `@composables/` | `src/composables/` | Vue composable functions |
| `@styles/` | `src/styles/` | Global styles and stylesheets |

## Configuration

Path aliases are configured in two places:

### 1. TypeScript Configuration (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@controllers/*": ["./src/controllers/*"],
      "@services/*": ["./src/services/*"],
      "@views/*": ["./src/views/*"],
      "@models/*": ["./src/models/*"],
      "@composables/*": ["./src/composables/*"],
      "@styles/*": ["./src/styles/*"]
    }
  }
}
```

### 2. Vite Configuration (`vite.config.ts`)
The Vite build tool is also configured to resolve these aliases.

### 3. Vitest Configuration (`vitest.config.ts`)
Test runner configuration includes the same aliases for testing.

## Usage Examples

### Before (Relative Imports)
```typescript
import { ApiService } from '../../../services/ApiService';
import type { User } from '../models/User';
import { LoginView } from '../views/LoginView';
```

### After (Path Aliases)
```typescript
import { ApiService } from '@services/ApiService';
import type { User } from '@models/User';
import { LoginView } from '@views/LoginView';
```

## Benefits

1. **Cleaner Code**: No more counting `../` levels
2. **Maintainability**: Moving files doesn't require updating imports
3. **Readability**: Clear indication of which module is being imported
4. **IDE Support**: Better auto-completion and refactoring
5. **Type Safety**: TypeScript understands the aliases

## Enforcement

A test (`ImportAliases.test.ts`) automatically enforces that all imports use path aliases instead of relative imports. This test:

- Scans all TypeScript/Vue files in `src/`
- Fails if any relative imports (`./` or `../`) are detected
- Provides helpful guidance on available aliases
- Runs as part of the standard test suite

### Running the Enforcement Test
```bash
npm run test -- ImportAliases.test.ts
```

## Best Practices

1. **Always use path aliases** for imports between modules
2. **Use `@/`** only for special cases or when the exact path varies
3. **Use specific aliases** (e.g., `@models/`, `@services/`) for clarity
4. **Don't create relative imports** - the test will catch them
5. **Keep imports organized** - group imports by category at the top of files

## Example File

Here's an example of properly organized imports:

```typescript
/**
 * Login Controller - Manages login functionality
 */
import { BaseController } from '@controllers/BaseController';
import { ApiService } from '@services/ApiService';
import { ValidationService } from '@services/ValidationService';
import type { User, UserLogin } from '@models/User';
import { LoginView } from '@views/LoginView';

export class LoginController extends BaseController {
  private apiService = new ApiService();
  private validationService = new ValidationService();
  
  // Controller implementation...
}
```

## Troubleshooting

### Imports not resolving in editor
1. Ensure `tsconfig.json` is properly configured with all aliases
2. Restart the TypeScript language server (Cmd+Shift+P → TypeScript: Restart TS Server)
3. Check that Vite and Vitest configs also include the aliases

### Test imports failing
- Verify `vitest.config.ts` includes the same alias configurations
- Run `npm run test` to ensure the test environment is properly set up

### Build fails with alias errors
- Confirm `vite.config.ts` has the resolve.alias configuration
- Check that the paths in vite.config.ts match the paths in tsconfig.json

## Adding New Aliases

To add a new path alias:

1. Add to `tsconfig.json` under `compilerOptions.paths`
2. Add to `vite.config.ts` in the `resolve.alias` section
3. Add to `vitest.config.ts` in the `resolve.alias` section
4. Update the enforcement test to validate the new alias
5. Document the new alias in this guide

## Related Files

- [tsconfig.json](../../tsconfig.json)
- [vite.config.ts](../../frontend/vite.config.ts)
- [vitest.config.ts](../../frontend/vitest.config.ts)
- [ImportAliases.test.ts](../../frontend/tests/ImportAliases.test.ts) - Enforcement test
