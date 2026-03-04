import { describe, it, expect, vi } from 'vitest';
import { useBalanceEditing } from '@views/AccountHub/useBalanceEditing';

describe('useBalanceEditing', () => {
  it('startEdit sets editingBalanceId and value', () => {
    const { editingBalanceId, editingBalanceValue, startEdit } = useBalanceEditing();
    startEdit(5, '1000');
    expect(editingBalanceId.value).toBe(5);
    expect(editingBalanceValue.value).toBe('1,000');
  });

  it('cancelEdit resets state', () => {
    const { editingBalanceId, editingBalanceValue, startEdit, cancelEdit } = useBalanceEditing();
    startEdit(3, '500');
    cancelEdit();
    expect(editingBalanceId.value).toBeNull();
    expect(editingBalanceValue.value).toBe('');
  });

  it('saveBalance returns accountId and value for valid input', () => {
    const { startEdit, saveBalance, editingBalanceValue } = useBalanceEditing();
    startEdit(2, '0');
    editingBalanceValue.value = '1500';
    const result = saveBalance(2);
    expect(result.accountId).toBe(2);
    expect(result.value).toBe('1500');
  });

  it('saveBalance returns empty for wrong accountId', () => {
    const { startEdit, saveBalance } = useBalanceEditing();
    startEdit(1, '500');
    const result = saveBalance(99);
    expect(result).toEqual({});
  });

  it('saveBalance returns empty for non-numeric value', () => {
    const { startEdit, saveBalance, editingBalanceValue } = useBalanceEditing();
    startEdit(1, '0');
    editingBalanceValue.value = 'abc';
    const result = saveBalance(1);
    expect(result).toEqual({});
  });

  it('handleClickOutside cancels edit when click is outside balance-edit', () => {
    const { editingBalanceId, startEdit, handleClickOutside } = useBalanceEditing();
    startEdit(1, '500');
    const event = { target: document.createElement('div') } as unknown as MouseEvent;
    handleClickOutside(event);
    expect(editingBalanceId.value).toBeNull();
  });

  it('handleClickOutside does nothing when not editing', () => {
    const { editingBalanceId, handleClickOutside } = useBalanceEditing();
    const event = { target: document.createElement('div') } as unknown as MouseEvent;
    handleClickOutside(event);
    expect(editingBalanceId.value).toBeNull();
  });

  it('handleClickOutside preserves edit when clicking inside balance-edit', () => {
    const { editingBalanceId, startEdit, handleClickOutside } = useBalanceEditing();
    startEdit(1, '500');
    const inner = document.createElement('input');
    const container = document.createElement('div');
    container.classList.add('balance-edit');
    container.appendChild(inner);
    document.body.appendChild(container);
    const event = { target: inner } as unknown as MouseEvent;
    handleClickOutside(event);
    expect(editingBalanceId.value).toBe(1);
    document.body.removeChild(container);
  });
});
