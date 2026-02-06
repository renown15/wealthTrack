/**
 * Test to verify that console.debug is only used through the debug utility.
 * This test checks that no direct console.debug calls exist outside debug.ts
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Debug Logging Enforcement', () => {
  it('should not have direct console.debug calls outside utils/debug.ts', () => {
    const srcDir = join(__dirname, '../src');
    const filesWithDebugCalls: string[] = [];

    function checkFilesRecursively(dir: string): void {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        // Skip node_modules and dist
        if (entry.name === 'node_modules' || entry.name === 'dist') {
          continue;
        }

        if (entry.isDirectory()) {
          checkFilesRecursively(fullPath);
        } else if ((entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) && !entry.name.endsWith('.test.ts')) {
          // Skip the debug.ts file itself
          if (entry.name === 'debug.ts') {
            continue;
          }

          const content = readFileSync(fullPath, 'utf-8');
          
          // Check for console.debug, console.error, console.warn, console.log
          // (except in debug.ts itself)
          if (/console\.(debug|error|warn|log)\s*\(/.test(content)) {
            filesWithDebugCalls.push(fullPath.replace(srcDir, ''));
          }
        }
      }
    }

    checkFilesRecursively(srcDir);

    expect(
      filesWithDebugCalls,
      `Files with direct console calls (should use debug utility instead):\n${filesWithDebugCalls.join('\n')}`
    ).toHaveLength(0);
  });

  it('should have proper debug utility usage', () => {
    const debugPath = join(__dirname, '../src/utils/debug.ts');
    const content = readFileSync(debugPath, 'utf-8');

    expect(content).toContain('debug.log');
    expect(content).toContain('debug.error');
    expect(content).toContain('isDebugEnabled()');
  });
});
