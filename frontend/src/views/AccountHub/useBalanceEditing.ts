/**
 * Composable for handling balance editing in table
 */

import { ref, nextTick, type Ref } from 'vue';
import { parseNumberForEdit, parseBalanceForSave } from '@views/AccountHub/formattingUtils';

interface BalanceEditState {
  editingBalanceId: Ref<number | null>;
  editingBalanceValue: Ref<string>;
  startEdit: (accountId: number, currentValue?: string | number | null) => void;
  cancelEdit: () => void;
  saveBalance: (accountId: number) => { accountId?: number; value?: string };
  handleClickOutside: (event: MouseEvent) => void;
}

export function useBalanceEditing(): BalanceEditState {
  const editingBalanceId = ref<number | null>(null);
  const editingBalanceValue = ref('');

  const startEdit = (accountId: number, currentValue?: string | number | null): void => {
    editingBalanceId.value = accountId;
    editingBalanceValue.value = parseNumberForEdit(currentValue);
    void nextTick(() => {
      const input = document.querySelector('.balance-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    });
  };

  const cancelEdit = (): void => {
    editingBalanceId.value = null;
    editingBalanceValue.value = '';
  };

  const saveBalance = (accountId: number): { accountId?: number; value?: string } => {
    if (editingBalanceId.value !== accountId) return {};
    const value = parseBalanceForSave(editingBalanceValue.value);
    if (value && !Number.isNaN(parseFloat(value))) {
      cancelEdit();
      return { accountId, value };
    }
    cancelEdit();
    return {};
  };

  const handleClickOutside = (event: MouseEvent): void => {
    if (editingBalanceId.value === null) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.balance-edit')) {
      cancelEdit();
    }
  };

  return {
    editingBalanceId,
    editingBalanceValue,
    startEdit,
    cancelEdit,
    saveBalance,
    handleClickOutside,
  };
}
