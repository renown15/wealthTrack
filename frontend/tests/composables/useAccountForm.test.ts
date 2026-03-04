import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useAccountForm, convertToDateInputFormat, convertFromDateInputFormat } from '@composables/useAccountForm';
import type { AccountFormProps } from '@composables/useAccountForm';

const types = [
  { id: 1, name: 'Cash ISA', value: 'cash_isa' },
  { id: 2, name: 'Pension', value: 'pension' },
];
const statuses = [
  { id: 10, name: 'Active', value: 'active' },
  { id: 11, name: 'Closed', value: 'closed' },
];

const baseProps = (): AccountFormProps => ({
  open: false,
  resourceType: 'account',
  accountTypes: types,
  accountStatuses: statuses,
});

describe('useAccountForm', () => {
  it('initialises form data from props', () => {
    const props = ref<AccountFormProps>({
      ...baseProps(),
      initialName: 'Savings',
      initialInstitutionId: 5,
      initialTypeId: 2,
      initialStatusId: 10,
      initialOpenedAt: '2020-01-01',
      initialInterestRate: '3.5',
    });
    const { formData } = useAccountForm(props);
    expect(formData.value.name).toBe('Savings');
    expect(formData.value.institutionId).toBe(5);
    expect(formData.value.typeId).toBe(2);
    expect(formData.value.statusId).toBe(10);
    expect(formData.value.openedAt).toBe('2020-01-01');
    expect(formData.value.interestRate).toBe('3.5');
  });

  it('uses defaults when optional props absent', () => {
    const props = ref<AccountFormProps>(baseProps());
    const { formData } = useAccountForm(props);
    expect(formData.value.name).toBe('');
    expect(formData.value.institutionId).toBe(0);
    expect(formData.value.interestRate).toBe('');
  });

  it('resetForm restores values from props', () => {
    const props = ref<AccountFormProps>({
      ...baseProps(),
      initialName: 'ISA',
      initialTypeId: 1,
      initialStatusId: 10,
    });
    const { formData, resetForm } = useAccountForm(props);
    formData.value.name = 'Modified';
    resetForm();
    expect(formData.value.name).toBe('ISA');
  });

  it('syncAccountType uses initialTypeId when it matches', () => {
    const props = ref<AccountFormProps>({
      ...baseProps(),
      open: false,
      initialTypeId: 2,
    });
    const { formData, resetForm } = useAccountForm(props);
    resetForm();
    expect(formData.value.typeId).toBe(2);
  });

  it('syncAccountType defaults to first type when no match', () => {
    const props = ref<AccountFormProps>({
      ...baseProps(),
      open: false,
      initialTypeId: 99,
    });
    const { formData, resetForm } = useAccountForm(props);
    resetForm();
    expect(formData.value.typeId).toBe(1);
  });

  it('syncAccountStatus uses initialStatusId when it matches', () => {
    const props = ref<AccountFormProps>({
      ...baseProps(),
      open: false,
      initialStatusId: 11,
    });
    const { formData, resetForm } = useAccountForm(props);
    resetForm();
    expect(formData.value.statusId).toBe(11);
  });

  it('syncAccountStatus defaults to first status when no match', () => {
    const props = ref<AccountFormProps>({
      ...baseProps(),
      open: false,
      initialStatusId: 99,
    });
    const { formData, resetForm } = useAccountForm(props);
    resetForm();
    expect(formData.value.statusId).toBe(10);
  });

  it('watch: opening modal triggers resetForm', async () => {
    const props = ref<AccountFormProps>({
      ...baseProps(),
      open: false,
      initialName: 'From Watch',
    });
    const { formData } = useAccountForm(props);
    formData.value.name = 'Dirty';
    props.value = { ...props.value, open: true };
    await Promise.resolve();
    expect(formData.value.name).toBe('From Watch');
  });

  it('watch: accountTypes triggers syncAccountType when open', async () => {
    const props = ref<AccountFormProps>({
      ...baseProps(),
      open: true,
      accountTypes: [],
    });
    const { formData } = useAccountForm(props);
    props.value = { ...props.value, accountTypes: types };
    await Promise.resolve();
    expect(formData.value.typeId).toBe(1);
  });
});

describe('convertToDateInputFormat', () => {
  it('converts DD/MM/YYYY to YYYY-MM-DD', () => {
    expect(convertToDateInputFormat('12/03/2026')).toBe('2026-03-12');
  });

  it('converts DD/MM/YYYY to YYYY-MM-DD for other dates', () => {
    expect(convertToDateInputFormat('01/01/2025')).toBe('2025-01-01');
    expect(convertToDateInputFormat('31/12/2030')).toBe('2030-12-31');
  });

  it('returns empty string for null/undefined', () => {
    expect(convertToDateInputFormat(null)).toBe('');
    expect(convertToDateInputFormat(undefined)).toBe('');
  });

  it('returns unchanged string if not DD/MM/YYYY format', () => {
    expect(convertToDateInputFormat('2026-03-12')).toBe('2026-03-12');
    expect(convertToDateInputFormat('invalid')).toBe('invalid');
  });
});

describe('convertFromDateInputFormat', () => {
  it('converts YYYY-MM-DD to DD/MM/YYYY', () => {
    expect(convertFromDateInputFormat('2026-03-12')).toBe('12/03/2026');
  });

  it('converts YYYY-MM-DD to DD/MM/YYYY for other dates', () => {
    expect(convertFromDateInputFormat('2025-01-01')).toBe('01/01/2025');
    expect(convertFromDateInputFormat('2030-12-31')).toBe('31/12/2030');
  });

  it('returns empty string for null/undefined', () => {
    expect(convertFromDateInputFormat(null)).toBe('');
    expect(convertFromDateInputFormat(undefined)).toBe('');
  });

  it('returns unchanged string if not YYYY-MM-DD format', () => {
    expect(convertFromDateInputFormat('12/03/2026')).toBe('12/03/2026');
    expect(convertFromDateInputFormat('invalid')).toBe('invalid');
  });
});
