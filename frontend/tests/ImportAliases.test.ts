/**
 * Test to enforce use of path aliases instead of relative imports.
 * This test will fail if relative imports are detected in source files.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(__dirname, '../src');

/**
 * Get all TypeScript and Vue files from src directory.
 */
function getSourceFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and .next directories
      if (entry !== 'node_modules' && entry !== '.next') {
        getSourceFiles(fullPath, files);
      }
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx') || entry.endsWith('.vue')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Check if a file contains relative imports that should use path aliases.
 */
function checkRelativeImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const violations: string[] = [];

  // Patterns to detect relative imports
  const relativeImportPatterns = [
    // from '../...' 
    /from\s+['"`]\.\.\/[^'"`]*['"`]/g,
    // from './...'
    /from\s+['"`]\.\/[^'"`]*['"`]/g,
    // import from '../...'
    /import\s+[^'"`]*from\s+['"`]\.\.\/[^'"`]*['"`]/g,
    // import from './...'
    /import\s+[^'"`]*from\s+['"`]\.\/[^'"`]*['"`]/g,
  ];

  for (const pattern of relativeImportPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      violations.push(match[0]);
    }
  }

  return violations;
}

describe('Import Aliases', () => {
  it('should not use relative imports - all imports should use @/ path aliases', () => {
    const sourceFiles = getSourceFiles(SRC_DIR);
    const violationsByFile: Record<string, string[]> = {};

    for (const file of sourceFiles) {
      const violations = checkRelativeImports(file);
      if (violations.length > 0) {
        const relativePath = path.relative(SRC_DIR, file);
        violationsByFile[relativePath] = violations;
      }
    }

    if (Object.keys(violationsByFile).length > 0) {
      let errorMessage = 'Found relative imports! Use path aliases instead (@/, @views/, @services/, etc.):\n\n';

      for (const [file, violations] of Object.entries(violationsByFile)) {
        errorMessage += `${file}:\n`;
        for (const violation of violations) {
          errorMessage += `  ${violation}\n`;
        }
        errorMessage += '\n';
      }

      errorMessage += '\nPath aliases available:\n';
      errorMessage += '  @/ - root src directory\n';
      errorMessage += '  @controllers/ - src/controllers\n';
      errorMessage += '  @services/ - src/services\n';
      errorMessage += '  @views/ - src/views\n';
      errorMessage += '  @models/ - src/models\n';
      errorMessage += '  @composables/ - src/composables\n';
      errorMessage += '  @styles/ - src/styles\n';

      throw new Error(errorMessage);
    }

    expect(Object.keys(violationsByFile).length).toBe(0);
  });

  it('should have path aliases configured in tsconfig.json', () => {
    const tsconfigPath = path.join(__dirname, '../tsconfig.json');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

    expect(tsconfig.compilerOptions.paths).toBeDefined();
    expect(tsconfig.compilerOptions.paths['@/*']).toBeDefined();
    expect(tsconfig.compilerOptions.paths['@controllers/*']).toBeDefined();
    expect(tsconfig.compilerOptions.paths['@services/*']).toBeDefined();
    expect(tsconfig.compilerOptions.paths['@views/*']).toBeDefined();
    expect(tsconfig.compilerOptions.paths['@models/*']).toBeDefined();
    expect(tsconfig.compilerOptions.paths['@composables/*']).toBeDefined();
  });

  it('should have path aliases configured in vite.config.ts', () => {
    const viteConfigPath = path.join(__dirname, '../vite.config.ts');
    const content = fs.readFileSync(viteConfigPath, 'utf-8');

    // Check that all aliases are defined in vite config
    const requiredAliases = ['@/', '@controllers', '@services', '@views', '@models', '@composables'];

    for (const alias of requiredAliases) {
      expect(content).toContain(
        alias === '@/'
          ? "resolve(__dirname, './src')"
          : `resolve(__dirname, './src/${alias.replace('@', '')}')`
      );
    }
  });
});
