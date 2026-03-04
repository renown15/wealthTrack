import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useAccountHubHandlers } from '@composables/useAccountHubHandlers';

const mockState = { error: null as string | null };
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockCreateInst = vi.fn();
const mockUpdateInst = vi.fn();
const mockDeleteInst = vi.fn();
const mockLoad = vi.fn();

const mockModalResourceType = ref<'account' | 'institution'>('account');
const mockModalType = ref<'create' | 'edit'>('create');
const mockEditingItem = ref<{ id: number } | null>(null);
const mockDeleteConfirmType = ref<'account' | 'institution'>('account');
const mockDeleteConfirmId = ref(0);
const mockCloseModal = vi.fn();
const mockCloseDeleteConfirm = vi.fn();

vi.mock('@/composables/usePortfolio', () => ({
  usePortfolio: () => ({
    state: mockState,
    createAccount: mockCreate,
    updateAccount: mockUpdate,
    deleteAccount: mockDelete,
    createInstitution: mockCreateInst,
    updateInstitution: mockUpdateInst,
    deleteInstitution: mockDeleteInst,
    loadPortfolio: mockLoad,
  }),
}));

vi.mock('@/composables/useAccountHubModals', () => ({
  useAccountHubModals: () => ({
    modalResourceType: mockModalResourceType,
    modalType: mockModalType,
    editingItem: mockEditingItem,
    deleteConfirmType: mockDeleteConfirmType,
    deleteConfirmId: mockDeleteConfirmId,
    closeModal: mockCloseModal,
    closeDeleteConfirm: mockCloseDeleteConfirm,
  }),
}));

vi.mock('@/services/AccountCrudService', () => ({
  accountCrudService: { updateAccountDates: vi.fn() },
}));

import { accountCrudService } from '@services/AccountCrudService';
const mockDates = vi.mocked(accountCrudService.updateAccountDates);

describe('useAccountHubHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
    mockCreateInst.mockResolvedValue(undefined);
    mockUpdateInst.mockResolvedValue(undefined);
    mockDeleteInst.mockResolvedValue(undefined);
    mockLoad.mockResolvedValue(undefined);
    mockDates.mockResolvedValue(undefined);
    mockState.error = null;
    mockModalResourceType.value = 'account';
    mockModalType.value = 'create';
    mockEditingItem.value = null;
    mockDeleteConfirmType.value = 'account';
    mockDeleteConfirmId.value = 0;
  });

  describe('handleSave — account create', () => {
    it('calls createAccount when account + create', async () => {
      mockModalResourceType.value = 'account';
      mockModalType.value = 'create';
      const { handleSave, accountTypes, accountStatuses } = useAccountHubHandlers();
      accountTypes.value = [{ id: 1, name: 'ISA', value: 'isa' }];
      accountStatuses.value = [{ id: 1, name: 'Active', value: 'active' }];
      await handleSave({ name: 'New', institutionId: 2 });
      expect(mockCreate).toHaveBeenCalled();
      expect(mockCloseModal).toHaveBeenCalled();
    });

    it('sets error when typeId/statusId unavailable', async () => {
      mockModalResourceType.value = 'account';
      mockModalType.value = 'create';
      const { handleSave } = useAccountHubHandlers();
      await handleSave({ name: 'New', institutionId: 2 });
      expect(mockState.error).toBe('Select valid type and status');
    });
  });

  describe('handleSave — account edit', () => {
    it('calls updateAccount and dates then loadPortfolio', async () => {
      mockModalResourceType.value = 'account';
      mockModalType.value = 'edit';
      mockEditingItem.value = { id: 5 };
      const { handleSave } = useAccountHubHandlers();
      await handleSave({ name: 'Updated', institutionId: 2 });
      expect(mockUpdate).toHaveBeenCalledWith(5, 'Updated', undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined);
      expect(mockDates).toHaveBeenCalled();
      expect(mockLoad).toHaveBeenCalled();
    });
  });

  describe('handleSave — institution create', () => {
    it('calls createInstitution when resource=institution + create', async () => {
      mockModalResourceType.value = 'institution';
      mockModalType.value = 'create';
      const { handleSave } = useAccountHubHandlers();
      await handleSave({ name: 'Bank', institutionId: 0, parentId: null });
      expect(mockCreateInst).toHaveBeenCalledWith('Bank', null);
      expect(mockCloseModal).toHaveBeenCalled();
    });
  });

  describe('handleSave — institution edit', () => {
    it('calls updateInstitution when resource=institution + edit + editingItem', async () => {
      mockModalResourceType.value = 'institution';
      mockModalType.value = 'edit';
      mockEditingItem.value = { id: 9 };
      const { handleSave } = useAccountHubHandlers();
      await handleSave({ name: 'Renamed', institutionId: 0, parentId: 2 });
      expect(mockUpdateInst).toHaveBeenCalledWith(9, 'Renamed', 2);
    });
  });

  describe('handleConfirmDelete', () => {
    it('calls deleteAccount when deleteConfirmType is account', async () => {
      mockDeleteConfirmType.value = 'account';
      mockDeleteConfirmId.value = 11;
      const { handleConfirmDelete } = useAccountHubHandlers();
      await handleConfirmDelete();
      expect(mockDelete).toHaveBeenCalledWith(11);
      expect(mockCloseDeleteConfirm).toHaveBeenCalled();
    });

    it('calls deleteInstitution when deleteConfirmType is institution', async () => {
      mockDeleteConfirmType.value = 'institution';
      mockDeleteConfirmId.value = 22;
      const { handleConfirmDelete } = useAccountHubHandlers();
      await handleConfirmDelete();
      expect(mockDeleteInst).toHaveBeenCalledWith(22);
      expect(mockCloseDeleteConfirm).toHaveBeenCalled();
    });
  });
});
