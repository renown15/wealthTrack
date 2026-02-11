/**
 * Coverage helpers for InstitutionCrudService.
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { institutionCrudService } from '@/services/InstitutionCrudService';

type AxiosStub = {
  get: Mock<unknown[], Promise<{ data: unknown }>>;
  post: Mock<unknown[], Promise<{ data: unknown }>>;
  put: Mock<unknown[], Promise<{ data: unknown }>>;
  delete: Mock<unknown[], Promise<unknown>>;
};

describe('InstitutionCrudService', () => {
  let clientStub: AxiosStub;

  beforeEach(() => {
    vi.clearAllMocks();
    clientStub = {
      get: vi.fn().mockResolvedValue({ data: [] }),
      post: vi.fn().mockResolvedValue({ data: null }),
      put: vi.fn().mockResolvedValue({ data: null }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    institutionCrudService.client = clientStub as never;
  });

  it('loads institutions', async () => {
    const institutions = [{ id: 1, name: 'Bank' }];
    clientStub.get.mockResolvedValueOnce({ data: institutions });

    await expect(institutionCrudService.getInstitutions()).resolves.toEqual(institutions);
    expect(clientStub.get).toHaveBeenCalledWith('/api/v1/institutions');
  });

  it('fetches an institution by id', async () => {
    const payload = { id: 2, name: 'Credit Union' };
    clientStub.get.mockResolvedValueOnce({ data: payload });

    await expect(institutionCrudService.getInstitution(2)).resolves.toEqual(payload);
    expect(clientStub.get).toHaveBeenCalledWith('/api/v1/institutions/2');
  });

  it('creates an institution', async () => {
    const created = { id: 3, name: 'Neobank' };
    const body = { name: 'Neobank' };
    clientStub.post.mockResolvedValueOnce({ data: created });

    await expect(institutionCrudService.createInstitution(body)).resolves.toEqual(created);
    expect(clientStub.post).toHaveBeenCalledWith('/api/v1/institutions', body);
  });

  it('updates an institution', async () => {
    const updated = { id: 4, name: 'Updated Bank' };
    clientStub.put.mockResolvedValueOnce({ data: updated });

    await expect(institutionCrudService.updateInstitution(4, { name: 'Updated Bank' })).resolves.toEqual(updated);
    expect(clientStub.put).toHaveBeenCalledWith('/api/v1/institutions/4', { name: 'Updated Bank' });
  });

  it('deletes institution records', async () => {
    await expect(institutionCrudService.deleteInstitution(5)).resolves.toBeUndefined();
    expect(clientStub.delete).toHaveBeenCalledWith('/api/v1/institutions/5');
  });
});
