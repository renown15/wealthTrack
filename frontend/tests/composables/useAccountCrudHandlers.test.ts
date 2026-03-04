import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useAccountCrudHandlers } from '@composables/useAccountCrudHandlers';

const mockState = { error: null as string | null };
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockLoad = vi.fn();

vi.mock('@/composables/usePortfolio', () => ({
  usePortfolio: () => ({
    state: mockState,
    createAccount: mockCreate,
    updateAccount: mockUpdate,
    deleteAccount: mockDelete,
    loadPortfolio: mockLoad,
  }),
}));

vi.mock('@/services/AccountCrudService', () => ({
  accountCrudService: {
    updateAccountDates: vi.fn(),
  },
}));

import { accountCrudService } from '@services/AccountCrudService';
const mockDates = vi.mocked(accountCrudService.updateAccountDates);

const mockAccount = {
  id: 3, userId: 1, name: 'Savings', institutionId: 2, typeId: 1, statusId: 1,
  openedAt: null, closedAt: null, accountNumber: null, sortCode: null,
  rollRefNumber: null, interestRate: null, fixedBonusRate: null,
  fixedBonusRateEndDate: null, releaseDate: null, numberOfShares: null,
  underlying: null, price: null, purchasePrice: null, pensionMonthlyPayment: null,
  createdAt: '', updatedAt: '',
};

const accountTypes = ref([{ id: 1, name: 'Cash ISA', value: 'cash_isa' }]);
const accountStatuses = ref([{ id: 1, name: 'Active', value: 'active' }]);

describe('useAccountCrudHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
    mockLoad.mockResolvedValue(undefined);
    mockDates.mockResolvedValue(undefined);
    mockState.error = null;
  });

  describe('handleSave — create path', () => {
    it('calls createAccount with provided typeId/statusId', async () => {
      const modalType = ref<'create' | 'edit'>('create');
      const editingItem = ref(null);
      const closeModal = vi.fn();
      const { handleSave } = useAccountCrudHandlers(
        accountTypes, accountStatuses, modalType, editingItem, closeModal
      );
      await handleSave({ name: 'New', institutionId: 2, typeId: 1, statusId: 1 });
      expect(mockCreate).toHaveBeenCalled();
      expect(closeModal).toHaveBeenCalled();
    });

    it('sets error when typeId/statusId missing and no defaults', async () => {
      const modalType = ref<'create' | 'edit'>('create');
      const editingItem = ref(null);
      const closeModal = vi.fn();
      const { handleSave } = useAccountCrudHandlers(
        ref([]), ref([]), modalType, editingItem, closeModal
      );
      await handleSave({ name: 'New', institutionId: 2 });
      expect(mockState.error).toBe('Select valid type and status');
      expect(closeModal).not.toHaveBeenCalled();
    });
  });

  describe('handleSave — edit path', () => {
    it('calls updateAccount and updateAccountDates then loadPortfolio', async () => {
      const modalType = ref<'create' | 'edit'>('edit');
      const editingItem = ref<typeof mockAccount | null>(mockAccount);
      const closeModal = vi.fn();
      const { handleSave } = useAccountCrudHandlers(
        accountTypes, accountStatuses, modalType, editingItem, closeModal
      );
      await handleSave({
        name: 'Updated', institutionId: 2, openedAt: '2020-01-01', closedAt: null
      });
      expect(mockUpdate).toHaveBeenCalledWith(3, 'Updated', undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined);
      expect(mockDates).toHaveBeenCalledWith(3, { opened_at: '2020-01-01', closed_at: null });
      expect(mockLoad).toHaveBeenCalled();
      expect(closeModal).toHaveBeenCalled();
    });

    it('continues even if updateAccountDates throws', async () => {
      mockDates.mockRejectedValue(new Error('Dates error'));
      const modalType = ref<'create' | 'edit'>('edit');
      const editingItem = ref<typeof mockAccount | null>(mockAccount);
      const closeModal = vi.fn();
      const { handleSave } = useAccountCrudHandlers(
        accountTypes, accountStatuses, modalType, editingItem, closeModal
      );
      await handleSave({ name: 'Updated', institutionId: 2 });
      expect(mockLoad).toHaveBeenCalled();
      expect(closeModal).toHaveBeenCalled();
    });
  });

  describe('handleDelete', () => {
    it('calls deleteAccount and rethrows on failure', async () => {
      mockDelete.mockRejectedValue(new Error('Delete failed'));
      const { handleDelete } = useAccountCrudHandlers(
        accountTypes, accountStatuses, ref('create'), ref(null), vi.fn()
      );
      await expect(handleDelete(3)).rejects.toThrow('Delete failed');
    });

    it('calls deleteAccount successfully', async () => {
      const { handleDelete } = useAccountCrudHandlers(
        accountTypes, accountStatuses, ref('create'), ref(null), vi.fn()
      );
      await handleDelete(3);
      expect(mockDelete).toHaveBeenCalledWith(3);
    });
  });
});
