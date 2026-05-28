import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineComponent, nextTick } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { useAnalyticsEdit } from '@composables/useAnalyticsEdit';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    getInstitutions: vi.fn(),
    getReferenceData: vi.fn(),
    getAccount: vi.fn(),
    updateAccount: vi.fn(),
  },
}));

vi.mock('@/utils/debug', () => ({ debug: { log: vi.fn(), error: vi.fn() } }));

import { apiService } from '@services/ApiService';
const api = vi.mocked(apiService);

const mockInsts = [{ id: 1, name: 'HSBC' }];
const mockTypes = [{ id: 2, name: 'ISA', value: 'isa' }];
const mockStatuses = [{ id: 3, name: 'Active', value: 'active' }];
const mockAccount = { id: 10, name: 'Savings', typeId: 2, statusId: 3 };

function withSetup(composableFn: () => unknown) {
  let result: unknown;
  const Wrapper = defineComponent({
    setup() { result = composableFn(); return () => null; },
    template: '<div/>',
  });
  mount(Wrapper);
  return result;
}

describe('useAnalyticsEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getInstitutions.mockResolvedValue(mockInsts as never);
    api.getReferenceData.mockResolvedValue(mockTypes as never);
    api.getAccount.mockResolvedValue(mockAccount as never);
    api.updateAccount.mockResolvedValue(undefined as never);
  });

  // ── onMounted — reference data loading ────────────────────────────────────

  it('loads institutions, types and statuses on mount', async () => {
    api.getReferenceData
      .mockResolvedValueOnce(mockTypes as never)
      .mockResolvedValueOnce(mockStatuses as never);
    const { institutions, accountTypes, accountStatuses } = withSetup(useAnalyticsEdit) as ReturnType<typeof useAnalyticsEdit>;
    await flushPromises();
    expect(api.getInstitutions).toHaveBeenCalled();
    expect(institutions.value).toStrictEqual(mockInsts);
    expect(accountTypes.value).toStrictEqual(mockTypes);
  });

  it('swallows error when reference data load fails', async () => {
    api.getInstitutions.mockRejectedValue(new Error('Network error'));
    const { institutions } = withSetup(useAnalyticsEdit) as ReturnType<typeof useAnalyticsEdit>;
    await flushPromises();
    expect(institutions.value).toStrictEqual([]);
  });

  // ── openEdit ──────────────────────────────────────────────────────────────

  it('openEdit fetches account and opens modal', async () => {
    const { openEdit, editingAccount, editModalOpen } = useAnalyticsEdit();
    await openEdit(10);
    expect(editingAccount.value).toStrictEqual(mockAccount);
    expect(editModalOpen.value).toBe(true);
  });

  it('openEdit swallows error gracefully', async () => {
    api.getAccount.mockRejectedValue(new Error('Not found'));
    const { openEdit, editModalOpen } = useAnalyticsEdit();
    await openEdit(99);
    expect(editModalOpen.value).toBe(false);
  });

  // ── handleSave ────────────────────────────────────────────────────────────

  it('handleSave calls updateAccount and closes modal', async () => {
    const onSaved = vi.fn().mockResolvedValue(undefined);
    const { openEdit, handleSave, editModalOpen } = useAnalyticsEdit(onSaved);
    await openEdit(10);
    await handleSave({ name: 'Updated', institutionId: 1, typeId: 2, statusId: 3 });
    expect(api.updateAccount).toHaveBeenCalledWith(10, expect.objectContaining({ name: 'Updated' }));
    expect(editModalOpen.value).toBe(false);
    expect(onSaved).toHaveBeenCalled();
  });

  it('handleSave does nothing when no editingAccount', async () => {
    const { handleSave } = useAnalyticsEdit();
    await handleSave({ name: 'X', institutionId: 1, typeId: 2, statusId: 3 });
    expect(api.updateAccount).not.toHaveBeenCalled();
  });

  it('handleSave sets error message on failure', async () => {
    api.updateAccount.mockRejectedValue(new Error('Server error'));
    const { openEdit, handleSave, editModalError } = useAnalyticsEdit();
    await openEdit(10);
    await handleSave({ name: 'X', institutionId: 1, typeId: 2, statusId: 3 });
    expect(editModalError.value).toBe('Server error');
    expect(editModalError.value).not.toBeNull();
  });

  it('handleSave calls onSaved when no callback given', async () => {
    const { openEdit, handleSave } = useAnalyticsEdit();
    await openEdit(10);
    await expect(handleSave({ name: 'X', institutionId: 1, typeId: 2, statusId: 3 })).resolves.not.toThrow();
  });

  // ── closeEdit ─────────────────────────────────────────────────────────────

  it('closeEdit resets modal state', async () => {
    const { openEdit, closeEdit, editModalOpen, editingAccount } = useAnalyticsEdit();
    await openEdit(10);
    closeEdit();
    expect(editModalOpen.value).toBe(false);
    expect(editingAccount.value).toBeNull();
  });
});
