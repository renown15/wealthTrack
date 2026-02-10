/**
 * Unit tests for AccountCrudService to ensure each API helper executes the expected call.
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { accountCrudService } from '@/services/AccountCrudService';

type AxiosStub = {
  get: Mock<Promise<{ data: unknown }>>;
  post: Mock<Promise<{ data: unknown }>>;
  put: Mock<Promise<{ data: unknown }>>;
  delete: Mock<Promise<unknown>>;
};

describe('AccountCrudService', () => {
  let clientStub: AxiosStub;

  beforeEach(() => {
    vi.clearAllMocks();
    clientStub = {
      get: vi.fn().mockResolvedValue({ data: [] }),
      post: vi.fn().mockResolvedValue({ data: null }),
      put: vi.fn().mockResolvedValue({ data: null }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    accountCrudService.client = clientStub as never;
  });

  it('retrieves the account list', async () => {
    const accounts = [{ id: 1, name: 'Checking' }];
    clientStub.get.mockResolvedValueOnce({ data: accounts });

    await expect(accountCrudService.getAccounts()).resolves.toEqual(accounts);
    expect(clientStub.get).toHaveBeenCalledWith('/api/v1/accounts');
  });

  it('fetches a single account by id', async () => {
    const account = { id: 12, name: 'Savings' };
    clientStub.get.mockResolvedValueOnce({ data: account });

    await expect(accountCrudService.getAccount(12)).resolves.toEqual(account);
    expect(clientStub.get).toHaveBeenCalledWith('/api/v1/accounts/12');
  });

  it('creates an account', async () => {
    const created = { id: 5, name: 'IRA' };
    const payload = { name: 'IRA', institutionId: 1, typeId: 1, statusId: 1 };
    clientStub.post.mockResolvedValueOnce({ data: created });

    await expect(accountCrudService.createAccount(payload)).resolves.toEqual(created);
    expect(clientStub.post).toHaveBeenCalledWith('/api/v1/accounts', payload);
  });

  it('updates an account', async () => {
    const updated = { id: 3, name: 'Brokerage' };
    clientStub.put.mockResolvedValueOnce({ data: updated });

    await expect(accountCrudService.updateAccount(3, { name: 'Brokerage' })).resolves.toEqual(updated);
    expect(clientStub.put).toHaveBeenCalledWith('/api/v1/accounts/3', { name: 'Brokerage' });
  });

  it('deletes an account', async () => {
    await expect(accountCrudService.deleteAccount(7)).resolves.toBeUndefined();
    expect(clientStub.delete).toHaveBeenCalledWith('/api/v1/accounts/7');
  });

  it('retrieves account events', async () => {
    const events = [{ id: 1, accountId: 7 }];
    clientStub.get.mockResolvedValueOnce({ data: events });

    await expect(accountCrudService.getAccountEvents(7)).resolves.toEqual(events);
    expect(clientStub.get).toHaveBeenCalledWith('/api/v1/accounts/7/events');
  });
});
