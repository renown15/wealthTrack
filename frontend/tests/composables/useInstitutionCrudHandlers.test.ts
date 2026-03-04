import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useInstitutionCrudHandlers } from '@composables/useInstitutionCrudHandlers';

const mockState = { error: null as string | null };
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/composables/usePortfolio', () => ({
  usePortfolio: () => ({
    state: mockState,
    createInstitution: mockCreate,
    updateInstitution: mockUpdate,
    deleteInstitution: mockDelete,
  }),
}));

const mockInstitution = {
  id: 7, userId: 1, name: 'My Bank', parentId: null, institutionType: 'bank',
  createdAt: '', updatedAt: '',
};

describe('useInstitutionCrudHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
    mockState.error = null;
  });

  describe('handleSave', () => {
    it('calls createInstitution when modalType is create', async () => {
      const modalType = ref<'create' | 'edit'>('create');
      const editingItem = ref(null);
      const closeModal = vi.fn();
      const { handleSave } = useInstitutionCrudHandlers(modalType, editingItem, closeModal);

      await handleSave({ name: 'New Bank', parentId: null });

      expect(mockCreate).toHaveBeenCalledWith('New Bank', null, null);
      expect(closeModal).toHaveBeenCalled();
    });

    it('calls updateInstitution when modalType is edit and editingItem has id', async () => {
      const modalType = ref<'create' | 'edit'>('edit');
      const editingItem = ref<typeof mockInstitution | null>(mockInstitution);
      const closeModal = vi.fn();
      const { handleSave } = useInstitutionCrudHandlers(modalType, editingItem, closeModal);

      await handleSave({ name: 'Renamed', parentId: 3, institutionType: 'Building Society' });

      expect(mockUpdate).toHaveBeenCalledWith(7, 'Renamed', 3, 'Building Society');
      expect(closeModal).toHaveBeenCalled();
    });

    it('does nothing if edit with no editingItem', async () => {
      const modalType = ref<'create' | 'edit'>('edit');
      const editingItem = ref(null);
      const closeModal = vi.fn();
      const { handleSave } = useInstitutionCrudHandlers(modalType, editingItem, closeModal);

      await handleSave({ name: 'X' });

      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(closeModal).toHaveBeenCalled();
    });

    it('sets state.error on thrown error', async () => {
      mockCreate.mockRejectedValue(new Error('Server error'));
      const modalType = ref<'create' | 'edit'>('create');
      const editingItem = ref(null);
      const closeModal = vi.fn();
      const { handleSave } = useInstitutionCrudHandlers(modalType, editingItem, closeModal);

      await handleSave({ name: 'Fail' });

      expect(mockState.error).toBe('Server error');
    });
  });

  describe('handleDelete', () => {
    it('calls deleteInstitution with the given id', async () => {
      const { handleDelete } = useInstitutionCrudHandlers(
        ref('create'), ref(null), vi.fn()
      );
      await handleDelete(7);
      expect(mockDelete).toHaveBeenCalledWith(7);
    });

    it('swallows error (sets in state via deleteInstitution)', async () => {
      mockDelete.mockRejectedValue(new Error('Failed'));
      const { handleDelete } = useInstitutionCrudHandlers(
        ref('create'), ref(null), vi.fn()
      );
      await expect(handleDelete(7)).resolves.not.toThrow();
    });
  });
});
