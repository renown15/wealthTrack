import { describe, it, expect } from 'vitest';
import {
  validateInstitutionForm,
  validateAccountForm,
} from '@views/AccountHub/addAccountModalValidation';

describe('validateInstitutionForm', () => {
  it('returns error when name is empty', () => {
    expect(validateInstitutionForm({ name: '' })).toBe('Please enter a name');
  });

  it('returns null when name is provided', () => {
    expect(validateInstitutionForm({ name: 'Barclays' })).toBeNull();
  });
});

describe('validateAccountForm', () => {
  it('returns error when name is empty', () => {
    expect(validateAccountForm({ name: '', institutionId: 1, typeId: 1, statusId: 1 }, true))
      .toBe('Please enter an account name');
  });

  it('returns error when creating without institutionId', () => {
    expect(validateAccountForm({ name: 'ISA', institutionId: 0, typeId: 1, statusId: 1 }, true))
      .toBe('Please select an institution');
  });

  it('returns error when typeId or statusId missing', () => {
    expect(validateAccountForm({ name: 'ISA', institutionId: 1, typeId: 0, statusId: 1 }, true))
      .toBe('Please select an account type and status');
    expect(validateAccountForm({ name: 'ISA', institutionId: 1, typeId: 1, statusId: 0 }, true))
      .toBe('Please select an account type and status');
  });

  it('returns null when all fields valid for create', () => {
    expect(validateAccountForm({ name: 'ISA', institutionId: 1, typeId: 2, statusId: 3 }, true))
      .toBeNull();
  });

  it('returns null for edit even without institutionId', () => {
    expect(validateAccountForm({ name: 'ISA', institutionId: 0, typeId: 2, statusId: 3 }, false))
      .toBeNull();
  });
});
