import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loadOutgoingTypes,
  useOutgoingTypes,
  isOutgoingAccountType,
  isOutgoingInstitution,
} from '@composables/outgoingTypes';
import { apiService } from '@services/ApiService';

vi.mock('@services/ApiService', () => ({
  apiService: { getReferenceData: vi.fn() },
}));

const accTypes = [
  { id: 1, classKey: 'outgoing_account_type', referenceValue: 'Utility - Gas', sortIndex: 50 },
  { id: 2, classKey: 'outgoing_account_type', referenceValue: 'School Fees', sortIndex: 63 },
];
const instTypes = [
  { id: 3, classKey: 'outgoing_institution_type', referenceValue: 'School', sortIndex: 12 },
];

describe('outgoingTypes', () => {
  beforeEach(() => {
    vi.mocked(apiService.getReferenceData).mockImplementation((key: string) =>
      Promise.resolve((key === 'outgoing_account_type' ? accTypes : instTypes) as never));
  });

  it('loads the outgoing type sets and populates the pickers', async () => {
    await loadOutgoingTypes();
    const { outgoingAccountTypes, outgoingInstitutionTypes } = useOutgoingTypes();
    expect(outgoingAccountTypes.value.map((t) => t.referenceValue)).toEqual(
      ['Utility - Gas', 'School Fees']);
    expect(outgoingInstitutionTypes.value.map((t) => t.referenceValue)).toEqual(['School']);
  });

  it('isOutgoingAccountType / isOutgoingInstitution reflect the loaded data', async () => {
    await loadOutgoingTypes();
    expect(isOutgoingAccountType('School Fees')).toBe(true);
    expect(isOutgoingAccountType('Savings Account')).toBe(false);
    expect(isOutgoingAccountType(null)).toBe(false);
    expect(isOutgoingInstitution('School')).toBe(true);
    expect(isOutgoingInstitution('Bank')).toBe(false);
    expect(isOutgoingInstitution(undefined)).toBe(false);
  });
});
