/**
 * CSS Enforcement Tests
 *
 * These tests ensure:
 * 1. CSS files stay under 200 lines (to prevent CSS bloat)
 * 2. Vue components use UnoCSS utilities instead of custom CSS
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const MAX_CSS_LINES = 200;

describe('CSS File Size Enforcement', () => {
  it('should not have CSS files exceeding 200 lines', () => {
    const stylesDir = join(__dirname, '../src/styles');
    const oversizedFiles: { file: string; lines: number }[] = [];

    if (!existsSync(stylesDir)) {
      return; // No styles directory is fine
    }

    const entries = readdirSync(stylesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.css')) {
        const fullPath = join(stylesDir, entry.name);
        const content = readFileSync(fullPath, 'utf-8');
        const lineCount = content.split('\n').length;

        if (lineCount > MAX_CSS_LINES) {
          oversizedFiles.push({ file: entry.name, lines: lineCount });
        }
      }
    }

    expect(
      oversizedFiles,
      `CSS files exceeding ${MAX_CSS_LINES} lines (refactor to use UnoCSS utilities):\n${oversizedFiles.map((f) => `  ${f.file}: ${f.lines} lines`).join('\n')}`
    ).toHaveLength(0);
  });

  it('should have essential-only content in CSS files', () => {
    const stylesDir = join(__dirname, '../src/styles');

    if (!existsSync(stylesDir)) {
      return;
    }

    const entries = readdirSync(stylesDir, { withFileTypes: true });
    const filesWithUtilities: { file: string; issues: string[] }[] = [];

    // Patterns that suggest styles should be UnoCSS utilities instead
    const utilityPatterns = [
      { pattern: /display:\s*(flex|grid|block|inline)/g, name: 'display utilities' },
      { pattern: /margin(-\w+)?:\s*\d+/g, name: 'margin utilities' },
      { pattern: /padding(-\w+)?:\s*\d+/g, name: 'padding utilities' },
      { pattern: /gap:\s*\d+/g, name: 'gap utilities' },
      { pattern: /font-size:\s*\d+/g, name: 'font-size utilities' },
      { pattern: /font-weight:\s*(bold|normal|\d+)/g, name: 'font-weight utilities' },
      { pattern: /text-align:\s*(left|center|right)/g, name: 'text-align utilities' },
      { pattern: /color:\s*#[0-9a-fA-F]+/g, name: 'color utilities' },
      { pattern: /border-radius:\s*\d+/g, name: 'border-radius utilities' },
    ];

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.css')) {
        const fullPath = join(stylesDir, entry.name);
        const content = readFileSync(fullPath, 'utf-8');
        const issues: string[] = [];

        // Count occurrences of each pattern
        for (const { pattern, name } of utilityPatterns) {
          const matches = content.match(pattern);
          if (matches && matches.length > 3) {
            issues.push(`${name} (${matches.length} occurrences)`);
          }
        }

        if (issues.length > 0) {
          filesWithUtilities.push({ file: entry.name, issues });
        }
      }
    }

    expect(
      filesWithUtilities,
      `CSS files with excessive utility-style properties (should use UnoCSS instead):\n${filesWithUtilities.map((f) => `  ${f.file}: ${f.issues.join(', ')}`).join('\n')}`
    ).toHaveLength(0);
  });
});

describe('UnoCSS Utility Usage Enforcement', () => {
  it('should not have scoped CSS blocks in Vue components', () => {
    const viewsDir = join(__dirname, '../src/views');
    const componentsDir = join(__dirname, '../src/components');
    const filesWithScopedCss: string[] = [];

    function checkVueFilesRecursively(dir: string): void {
      if (!existsSync(dir)) {
        return;
      }

      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          checkVueFilesRecursively(fullPath);
        } else if (entry.name.endsWith('.vue')) {
          const content = readFileSync(fullPath, 'utf-8');

          // Check for <style> blocks (scoped or not)
          // Allow empty style blocks or comments-only blocks
          const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
          if (styleMatch) {
            const styleContent = styleMatch[1].trim();
            // Remove comments
            const withoutComments = styleContent.replace(/\/\*[\s\S]*?\*\//g, '').trim();

            if (withoutComments.length > 0) {
              filesWithScopedCss.push(fullPath.replace(join(__dirname, '../src'), ''));
            }
          }
        }
      }
    }

    checkVueFilesRecursively(viewsDir);
    checkVueFilesRecursively(componentsDir);

    expect(
      filesWithScopedCss,
      `Vue components with scoped CSS (should use UnoCSS utilities or shortcuts in uno.config.ts):\n${filesWithScopedCss.join('\n')}`
    ).toHaveLength(0);
  });

  it('should have UnoCSS shortcuts configured', () => {
    const unoConfigPath = join(__dirname, '../uno.config.ts');

    expect(existsSync(unoConfigPath), 'uno.config.ts should exist').toBe(true);

    const content = readFileSync(unoConfigPath, 'utf-8');

    // Verify shortcuts section exists and has entries
    expect(content).toContain('shortcuts');
    expect(content).toContain('btn-primary');
    expect(content).toContain('btn-secondary');
    expect(content).toContain('form-input');
    expect(content).toContain('modal-');
  });

  it('should import UnoCSS in entry point with correct cascade order', () => {
    const indexTsPath = join(__dirname, '../src/index.ts');

    expect(existsSync(indexTsPath), 'index.ts entry point should exist').toBe(true);

    const content = readFileSync(indexTsPath, 'utf-8');
    expect(content).toContain("import '@unocss/reset/tailwind.css'");
    expect(content).toContain("import 'virtual:uno.css'");

    // Verify reset comes before utilities for proper cascade
    const resetIndex = content.indexOf("@unocss/reset/tailwind.css");
    const unoIndex = content.indexOf("virtual:uno.css");
    expect(resetIndex).toBeLessThan(unoIndex);
  });
});
