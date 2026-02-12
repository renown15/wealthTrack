import { describe, it, expect, vi, beforeEach } from 'vitest';
import { referenceDataService } from '@/services/ReferenceDataService';
import type { ReferenceDataItem } from '@/models/ReferenceData';

// Mock the AuthService module
vi.mock('@/services/AuthService', () => ({
  authService: {
    getAuthToken: vi.fn(() => 'test-token'),
  },
}));

describe('ReferenceDataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list reference data by class', async () => {
    const mockData: ReferenceDataItem[] = [
      {
        id: 1,
        classKey: 'account_type',
        referenceValue: 'Checking',
        sortIndex: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    vi.spyOn(referenceDataService['client'], 'get').mockResolvedValue({
      data: mockData,
    });

    const result = await referenceDataService.listByClass('account_type');
    expect(result).toEqual(mockData);
  });

  it('should list all reference data', async () => {
    const mockData: ReferenceDataItem[] = [
      {
        id: 1,
        classKey: 'account_type',
        referenceValue: 'Checking',
        sortIndex: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        classKey: 'status',
        referenceValue: 'Active',
        sortIndex: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    vi.spyOn(referenceDataService['client'], 'get').mockResolvedValue({
      data: mockData,
    });

    const result = await referenceDataService.listAll();
    expect(result).toEqual(mockData);
  });

  it('should create reference data', async () => {
    const payload = {
      classKey: 'account_type',
      referenceValue: 'Savings',
      sortIndex: 1,
    };

    const mockResponse: ReferenceDataItem = {
      id: 3,
      ...payload,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    vi.spyOn(referenceDataService['client'], 'post').mockResolvedValue({
      data: mockResponse,
    });

    const result = await referenceDataService.create(payload);
    expect(result).toEqual(mockResponse);
  });

  it('should update reference data', async () => {
    const payload = {
      classKey: 'account_type',
      referenceValue: 'Money Market',
      sortIndex: 2,
    };

    const mockResponse: ReferenceDataItem = {
      id: 1,
      ...payload,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    vi.spyOn(referenceDataService['client'], 'put').mockResolvedValue({
      data: mockResponse,
    });

    const result = await referenceDataService.update(1, payload);
    expect(result).toEqual(mockResponse);
  });

  it('should delete reference data', async () => {
    vi.spyOn(referenceDataService['client'], 'delete').mockResolvedValue({});

    await expect(referenceDataService.delete(1)).resolves.toBeUndefined();
  });
});
