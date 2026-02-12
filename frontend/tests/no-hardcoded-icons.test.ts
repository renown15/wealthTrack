/**
 * Test to prevent hardcoded icons in Vue templates.
 * Icons should be imported from @/constants/icons.ts
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Icons } from '@/constants/icons';

const VIEWS_DIR = path.resolve(__dirname, '../src/views');
const COMPONENTS_DIR = path.resolve(__dirname, '../src/components');

// Icons that should not appear directly in templates
const FORBIDDEN_ICONS = Object.values(Icons);

function getVueFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getVueFiles(fullPath));
    } else if (entry.name.endsWith('.vue')) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractTemplate(content: string): string {
  const match = content.match(/<template>([\s\S]*?)<\/template>/);
  return match ? match[1] : '';
}

describe('No hardcoded icons', () => {
  const vueFiles = [...getVueFiles(VIEWS_DIR), ...getVueFiles(COMPONENTS_DIR)];

  it('should find Vue files to check', () => {
    expect(vueFiles.length).toBeGreaterThan(0);
  });

  for (const file of vueFiles) {
    const relativePath = path.relative(path.resolve(__dirname, '..'), file);

    it(`${relativePath} should not contain hardcoded icons`, () => {
      const content = fs.readFileSync(file, 'utf-8');
      const template = extractTemplate(content);

      const foundIcons: string[] = [];
      for (const icon of FORBIDDEN_ICONS) {
        if (template.includes(icon)) {
          foundIcons.push(icon);
        }
      }

      expect(foundIcons, `Found hardcoded icons: ${foundIcons.join(', ')}. Use Icons from @/constants/icons.ts`).toEqual([]);
    });
  }
});
