import { describe, it, expect, vi, beforeEach } from 'vitest';
import { taxService } from '@services/TaxService';
import type { TaxPeriod, TaxReturn, TaxDocument, EligibleAccount } from '@models/TaxModels';

const mockPeriod: TaxPeriod = {
  id: 1, userId: 1, name: '2024/25',
  startDate: '2024-04-06', endDate: '2025-04-05',
  createdAt: '2024-04-06T00:00:00', updatedAt: '2024-04-06T00:00:00',
};

const mockReturn: TaxReturn = {
  id: 10, accountId: 5, taxPeriodId: 1,
  income: 150, capitalGain: null, taxTakenOff: 30,
  createdAt: '2024-04-06T00:00:00', updatedAt: '2024-04-06T00:00:00',
};

const mockDoc: TaxDocument = {
  id: 20, taxReturnId: 10, filename: 'cert.pdf',
  contentType: 'application/pdf', createdAt: '2024-04-06T00:00:00',
};

const mockEligible: EligibleAccount = {
  accountId: 5, accountName: 'Savings', accountType: 'Savings Account',
  institutionName: 'TestBank', interestRate: '2.0',
  eligibilityReason: 'interest_bearing', taxReturn: null, documents: [],
};

describe('TaxService', () => {
  let clientStub: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    clientStub = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    taxService['client'] = clientStub as never;
  });

  it('listPeriods returns array', async () => {
    clientStub.get.mockResolvedValue({ data: [mockPeriod] });
    const result = await taxService.listPeriods();
    expect(result).toStrictEqual([mockPeriod]);
    expect(clientStub.get).toHaveBeenCalledWith('/api/v1/tax/periods');
  });

  it('createPeriod posts and returns period', async () => {
    clientStub.post.mockResolvedValue({ data: mockPeriod });
    const result = await taxService.createPeriod({ name: '2024/25', startDate: '2024-04-06', endDate: '2025-04-05' });
    expect(result).toStrictEqual(mockPeriod);
  });

  it('deletePeriod calls delete', async () => {
    clientStub.delete.mockResolvedValue({ data: null });
    await taxService.deletePeriod(1);
    expect(clientStub.delete).toHaveBeenCalledWith('/api/v1/tax/periods/1');
  });

  it('getEligibleAccounts returns accounts', async () => {
    clientStub.get.mockResolvedValue({ data: [mockEligible] });
    const result = await taxService.getEligibleAccounts(1);
    expect(result).toStrictEqual([mockEligible]);
  });

  it('upsertReturn calls put', async () => {
    clientStub.put.mockResolvedValue({ data: mockReturn });
    const result = await taxService.upsertReturn(1, 5, { income: 150, capitalGain: null, taxTakenOff: 30 });
    expect(result).toStrictEqual(mockReturn);
  });

  it('listDocuments returns docs', async () => {
    clientStub.get.mockResolvedValue({ data: [mockDoc] });
    const result = await taxService.listDocuments(1, 5);
    expect(result).toStrictEqual([mockDoc]);
  });

  it('deleteDocument calls delete', async () => {
    clientStub.delete.mockResolvedValue({ data: null });
    await taxService.deleteDocument(20);
    expect(clientStub.delete).toHaveBeenCalledWith('/api/v1/tax/documents/20');
  });

  it('listPeriods throws on error', async () => {
    clientStub.get.mockRejectedValue(new Error('Network error'));
    await expect(taxService.listPeriods()).rejects.toThrow('Network error');
  });

  it('deletePeriod throws on error', async () => {
    clientStub.delete.mockRejectedValue(new Error('Not found'));
    await expect(taxService.deletePeriod(99)).rejects.toThrow();
  });
});
