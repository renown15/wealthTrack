/**
 * Tests for usePortfolio composable - Error handling
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePortfolio } from '@/composables/usePortfolio';
import * as apiServiceModule from '@/services/ApiService';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    getPortfolio: vi.fn(),
    getInstitutions: vi.fn(),
    createAccount: vi.fn(),
    updateAccount: vi.fn(),
    deleteAccount: vi.fn(),
    createInstitution: vi.fn(),
    updateInstitution: vi.fn(),
    deleteInstitution: vi.fn(),
  },
}));

const mockApiService = apiServiceModule.apiService as any;

describe('usePortfolio - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle Error object in loadPortfolio catch', async () => {
    const mockError = new Error('Load failed');
    const { state, loadPortfolio } = usePortfolio();

    mockApiService.getPortfolio.mockRejectedValue(mockError);

    await loadPortfolio();

    expect(state.error).toBe('Load failed');
  });

  it('should handle non-Error object in loadPortfolio catch', async () => {
    const { state, loadPortfolio } = usePortfolio();

    mockApiService.getPortfolio.mockRejectedValue('String error');

    await loadPortfolio();

    expect(state.error).toBe('Failed to load portfolio');
  });

  it('should handle Error object in createAccount catch', async () => {
    const mockError = new Error('Network error');
    const { createAccount } = usePortfolio();

    mockApiService.createAccount.mockRejectedValue(mockError);

    await expect(createAccount(1, 'Test')).rejects.toThrow();
  });

  it('should handle non-Error object in createAccount catch', async () => {
    const { createAccount } = usePortfolio();

    mockApiService.createAccount.mockRejectedValue('String error');

    await expect(createAccount(1, 'Test')).rejects.toBeDefined();
  });

  it('should handle Error object in updateAccount catch', async () => {
    const mockError = new Error('Update failed');
    const { updateAccount } = usePortfolio();

    mockApiService.updateAccount.mockRejectedValue(mockError);

    await expect(updateAccount(1, 'Updated')).rejects.toThrow();
  });

  it('should handle non-Error object in updateAccount catch', async () => {
    const { updateAccount } = usePortfolio();

    mockApiService.updateAccount.mockRejectedValue({ status: 400 });

    await expect(updateAccount(1, 'Updated')).rejects.toBeDefined();
  });

  it('should handle Error object in deleteAccount catch', async () => {
    const mockError = new Error('Delete error');
    const { deleteAccount } = usePortfolio();

    mockApiService.deleteAccount.mockRejectedValue(mockError);

    await expect(deleteAccount(1)).rejects.toThrow();
  });

  it('should handle non-Error object in deleteAccount catch', async () => {
    const { deleteAccount } = usePortfolio();

    mockApiService.deleteAccount.mockRejectedValue('Unknown error');

    await expect(deleteAccount(1)).rejects.toBeDefined();
  });

  it('should handle Error object in createInstitution catch', async () => {
    const mockError = new Error('Institution create failed');
    const { createInstitution } = usePortfolio();

    mockApiService.createInstitution.mockRejectedValue(mockError);

    await expect(createInstitution('Bank')).rejects.toThrow();
  });

  it('should handle non-Error object in createInstitution catch', async () => {
    const { createInstitution } = usePortfolio();

    mockApiService.createInstitution.mockRejectedValue(123);

    await expect(createInstitution('Bank')).rejects.toBeDefined();
  });

  it('should handle Error object in updateInstitution catch', async () => {
    const mockError = new Error('Institution update failed');
    const { updateInstitution } = usePortfolio();

    mockApiService.updateInstitution.mockRejectedValue(mockError);

    await expect(updateInstitution(1, 'Updated Bank')).rejects.toThrow();
  });

  it('should handle non-Error object in updateInstitution catch', async () => {
    const { updateInstitution } = usePortfolio();

    mockApiService.updateInstitution.mockRejectedValue(false);

    await expect(updateInstitution(1, 'Updated Bank')).rejects.toBeDefined();
  });

  it('should handle Error object in deleteInstitution catch', async () => {
    const mockError = new Error('Institution delete failed');
    const { deleteInstitution } = usePortfolio();

    mockApiService.deleteInstitution.mockRejectedValue(mockError);

    await expect(deleteInstitution(1)).rejects.toThrow();
  });

  it('should handle non-Error object in deleteInstitution catch', async () => {
    const { deleteInstitution } = usePortfolio();

    mockApiService.deleteInstitution.mockRejectedValue({ error: true });

    await expect(deleteInstitution(1)).rejects.toBeDefined();
  });
});
