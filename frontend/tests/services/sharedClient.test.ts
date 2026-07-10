import { describe, it, expect } from 'vitest';
import { apiService } from '@services/ApiService';
import { BaseApiClient } from '@services/BaseApiClient';

// Every sub-service singleton must be rebound to the shared axios client in
// ApiServiceBase's constructor — that client carries the Authorization header.
// A service left on its own axios instance sends unauthenticated requests
// (this shipped twice: outgoingCostService and taxDocumentService).
const modules = import.meta.glob('../../src/services/*.ts', { eager: true });

describe('service auth wiring', () => {
  it('every BaseApiClient service shares the apiService axios client', () => {
    const offenders: string[] = [];
    let checked = 0;
    for (const [path, mod] of Object.entries(modules)) {
      for (const [name, value] of Object.entries(mod as Record<string, unknown>)) {
        if (value instanceof BaseApiClient) {
          checked += 1;
          if (value.client !== apiService.client) offenders.push(`${path} → ${name}`);
        }
      }
    }
    // Sanity: the glob actually found the service singletons.
    expect(checked).toBeGreaterThan(10);
    expect(offenders).toStrictEqual([]);
  });
});
