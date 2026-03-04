/**
 * Unit tests for InstitutionCredentialsService
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { institutionCredentialsService } from '@/services/InstitutionCredentialsService';

vi.mock('@/services/AuthService', () => ({
  authService: {
    getAuthToken: vi.fn().mockReturnValue('test-token'),
  },
}));

type AxiosStub = {
  get: Mock<unknown[], Promise<{ data: unknown }>>;
  post: Mock<unknown[], Promise<{ data: unknown }>>;
  put: Mock<unknown[], Promise<{ data: unknown }>>;
  delete: Mock<unknown[], Promise<unknown>>;
  defaults: { headers: { common: Record<string, string> } };
};

describe('InstitutionCredentialsService', () => {
  let clientStub: AxiosStub;

  beforeEach(() => {
    vi.clearAllMocks();
    clientStub = {
      get: vi.fn().mockResolvedValue({ data: [] }),
      post: vi.fn().mockResolvedValue({ data: null }),
      put: vi.fn().mockResolvedValue({ data: null }),
      delete: vi.fn().mockResolvedValue(undefined),
      defaults: { headers: { common: {} } },
    };
    institutionCredentialsService.client = clientStub as never;
  });

  it('lists credentials for an institution', async () => {
    const creds = [{ id: 1, institutionId: 10, label: 'Password', value: 'secret' }];
    clientStub.get.mockResolvedValueOnce({ data: creds });

    await expect(institutionCredentialsService.listCredentials(10)).resolves.toEqual(creds);
    expect(clientStub.get).toHaveBeenCalledWith('/api/v1/institutions/10/credentials');
  });

  it('creates a credential', async () => {
    const created = { id: 5, institutionId: 10, label: 'PIN', value: '1234' };
    clientStub.post.mockResolvedValueOnce({ data: created });
    const payload = { label: 'PIN', value: '1234' };

    await expect(institutionCredentialsService.createCredential(10, payload as never)).resolves.toEqual(created);
    expect(clientStub.post).toHaveBeenCalledWith('/api/v1/institutions/10/credentials', payload);
  });

  it('updates a credential', async () => {
    const updated = { id: 5, institutionId: 10, label: 'PIN', value: '5678' };
    clientStub.put.mockResolvedValueOnce({ data: updated });
    const payload = { value: '5678' };

    await expect(institutionCredentialsService.updateCredential(10, 5, payload as never)).resolves.toEqual(updated);
    expect(clientStub.put).toHaveBeenCalledWith('/api/v1/institutions/10/credentials/5', payload);
  });

  it('deletes a credential', async () => {
    await expect(institutionCredentialsService.deleteCredential(10, 5)).resolves.toBeUndefined();
    expect(clientStub.delete).toHaveBeenCalledWith('/api/v1/institutions/10/credentials/5');
  });
});
