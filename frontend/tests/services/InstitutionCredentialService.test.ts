/**
 * Unit tests for InstitutionCredentialService
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { institutionCredentialService } from '@/services/InstitutionCredentialService';

type AxiosStub = {
  get: Mock<unknown[], Promise<{ data: unknown }>>;
  post: Mock<unknown[], Promise<{ data: unknown }>>;
  put: Mock<unknown[], Promise<{ data: unknown }>>;
  delete: Mock<unknown[], Promise<unknown>>;
};

describe('InstitutionCredentialService', () => {
  let clientStub: AxiosStub;

  beforeEach(() => {
    vi.clearAllMocks();
    clientStub = {
      get: vi.fn().mockResolvedValue({ data: [] }),
      post: vi.fn().mockResolvedValue({ data: null }),
      put: vi.fn().mockResolvedValue({ data: null }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    institutionCredentialService.client = clientStub as never;
  });

  it('lists credentials for an institution', async () => {
    const creds = [{ id: 1, institutionId: 10, typeId: 1, typeLabel: 'Password' }];
    clientStub.get.mockResolvedValueOnce({ data: creds });

    await expect(institutionCredentialService.list(10)).resolves.toEqual(creds);
    expect(clientStub.get).toHaveBeenCalledWith('/api/v1/institutions/10/credentials');
  });

  it('creates a credential', async () => {
    const created = { id: 5, institutionId: 10, typeId: 1, typeLabel: 'Password' };
    clientStub.post.mockResolvedValueOnce({ data: created });
    const payload = { typeId: 1, key: 'password', value: 'secret' };

    await expect(institutionCredentialService.create(10, payload)).resolves.toEqual(created);
    expect(clientStub.post).toHaveBeenCalledWith('/api/v1/institutions/10/credentials', payload);
  });

  it('updates a credential', async () => {
    const updated = { id: 5, institutionId: 10, typeId: 1, typeLabel: 'Password' };
    clientStub.put.mockResolvedValueOnce({ data: updated });
    const payload = { value: 'newSecret' };

    await expect(institutionCredentialService.update(10, 5, payload)).resolves.toEqual(updated);
    expect(clientStub.put).toHaveBeenCalledWith('/api/v1/institutions/10/credentials/5', payload);
  });

  it('deletes a credential', async () => {
    await expect(institutionCredentialService.delete(10, 5)).resolves.toBeUndefined();
    expect(clientStub.delete).toHaveBeenCalledWith('/api/v1/institutions/10/credentials/5');
  });
});
