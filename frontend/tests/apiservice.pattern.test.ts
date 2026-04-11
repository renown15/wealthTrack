/**
 * Enforces that composables use apiService, not sub-services directly.
 * Sub-services are internal implementation details of the ApiService facade.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SUB_SERVICES = [
  'AccountCrudService',
  'AccountGroupCrudService',
  'AccountDocumentService',
  'AnalyticsService',
  'AuthService',
  'InstitutionCrudService',
  'InstitutionCredentialService',
  'PortfolioFetchService',
  'ReferenceDataService',
  'ShareSaleService',
  'TaxService',
];

function getFilesRecursively(dir: string, ext: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getFilesRecursively(fullPath, ext));
    } else if (entry.name.endsWith(ext) && !entry.name.endsWith('.test.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('ApiService pattern enforcement', () => {
  it('composables must not import sub-services directly', () => {
    const composablesDir = join(__dirname, '../src/composables');
    const violations: string[] = [];

    for (const file of getFilesRecursively(composablesDir, '.ts')) {
      const content = readFileSync(file, 'utf-8');
      for (const service of SUB_SERVICES) {
        if (content.includes(`from '@services/${service}'`) || content.includes(`from "@services/${service}"`)) {
          violations.push(`${file.split('/src/')[1]}: imports ${service} directly`);
        }
      }
    }

    expect(
      violations,
      `Composables importing sub-services directly (use apiService instead):\n${violations.join('\n')}`,
    ).toHaveLength(0);
  });

  it('views must not import sub-services directly', () => {
    const viewsDir = join(__dirname, '../src/views');
    const violations: string[] = [];

    for (const file of getFilesRecursively(viewsDir, '.ts')) {
      const content = readFileSync(file, 'utf-8');
      for (const service of SUB_SERVICES) {
        if (content.includes(`from '@services/${service}'`) || content.includes(`from "@services/${service}"`)) {
          violations.push(`${file.split('/src/')[1]}: imports ${service} directly`);
        }
      }
    }

    expect(
      violations,
      `Views importing sub-services directly (use apiService instead):\n${violations.join('\n')}`,
    ).toHaveLength(0);
  });
});
