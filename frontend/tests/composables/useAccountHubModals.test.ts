/**
 * Tests for useAccountHubModals composable
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useAccountHubModals } from '@composables/useAccountHubModals';
import type { Account, Institution } from '@models/WealthTrackDataModels';

const mockAccount: Account = {
  id: 1,
  userId: 1,
  name: 'Test Account',
  institutionId: 10,
  typeId: 2,
  statusId: 1,
  openedAt: '2020-01-01',
  closedAt: null,
  accountNumber: '12345678',
  sortCode: '12-34-56',
  rollRefNumber: null,
  interestRate: '2.5',
  fixedBonusRate: '0.5',
  fixedBonusRateEndDate: '2025-01-01',
  releaseDate: null,
  numberOfShares: null,
  underlying: null,
  price: null,
  purchasePrice: null,
  pensionMonthlyPayment: null,
  createdAt: '2020-01-01T00:00:00Z',
  updatedAt: '2020-01-01T00:00:00Z',
};

const mockInstitution: Institution = {
  id: 10,
  userId: 1,
  name: 'Test Bank',
  parentId: null,
  institutionType: 'bank',
  createdAt: '2020-01-01T00:00:00Z',
  updatedAt: '2020-01-01T00:00:00Z',
};

describe('useAccountHubModals', () => {
  it('should initialise with defaults', () => {
    const m = useAccountHubModals();
    expect(m.modalOpen.value).toBe(false);
    expect(m.modalType.value).toBe('create');
    expect(m.modalResourceType.value).toBe('account');
    expect(m.editingItem.value).toBeNull();
    expect(m.deleteConfirmOpen.value).toBe(false);
    expect(m.deleteConfirmType.value).toBe('account');
    expect(m.deleteConfirmId.value).toBe(0);
    expect(m.deleteConfirmName.value).toBe('');
  });

  describe('computed defaults (no editingItem)', () => {
    it('should return empty string for initialModalName', () => {
      const m = useAccountHubModals();
      expect(m.initialModalName.value).toBe('');
    });

    it('should return 0 for numeric computed fields', () => {
      const m = useAccountHubModals();
      expect(m.initialModalInstitutionId.value).toBe(0);
      expect(m.initialModalTypeId.value).toBe(0);
      expect(m.initialModalStatusId.value).toBe(0);
    });

    it('should return null for optional computed fields', () => {
      const m = useAccountHubModals();
      expect(m.initialModalOpenedAt.value).toBeNull();
      expect(m.initialModalClosedAt.value).toBeNull();
      expect(m.initialModalAccountNumber.value).toBeNull();
      expect(m.initialModalSortCode.value).toBeNull();
      expect(m.initialModalRollRefNumber.value).toBeNull();
      expect(m.initialModalInterestRate.value).toBeNull();
      expect(m.initialModalFixedBonusRate.value).toBeNull();
      expect(m.initialModalFixedBonusRateEndDate.value).toBeNull();
      expect(m.initialModalParentId.value).toBeNull();
      expect(m.initialModalInstitutionType.value).toBeNull();
    });
  });

  describe('openCreateAccountModal', () => {
    it('should open modal for account creation', () => {
      const m = useAccountHubModals();
      m.editingItem.value = mockAccount;
      m.openCreateAccountModal();
      expect(m.modalOpen.value).toBe(true);
      expect(m.modalType.value).toBe('create');
      expect(m.modalResourceType.value).toBe('account');
      expect(m.editingItem.value).toBeNull();
    });
  });

  describe('openCreateInstitutionModal', () => {
    it('should open modal for institution creation', () => {
      const m = useAccountHubModals();
      m.openCreateInstitutionModal();
      expect(m.modalOpen.value).toBe(true);
      expect(m.modalType.value).toBe('create');
      expect(m.modalResourceType.value).toBe('institution');
      expect(m.editingItem.value).toBeNull();
    });
  });

  describe('openEditAccountModal', () => {
    it('should open edit modal with account data', () => {
      const m = useAccountHubModals();
      m.openEditAccountModal(mockAccount);
      expect(m.modalOpen.value).toBe(true);
      expect(m.modalType.value).toBe('edit');
      expect(m.modalResourceType.value).toBe('account');
      expect(m.editingItem.value).toStrictEqual(mockAccount);
    });

    it('should populate computed values from account', () => {
      const m = useAccountHubModals();
      m.openEditAccountModal(mockAccount);
      expect(m.initialModalName.value).toBe('Test Account');
      expect(m.initialModalInstitutionId.value).toBe(10);
      expect(m.initialModalTypeId.value).toBe(2);
      expect(m.initialModalStatusId.value).toBe(1);
      expect(m.initialModalOpenedAt.value).toBe('2020-01-01');
      expect(m.initialModalClosedAt.value).toBeNull();
      expect(m.initialModalAccountNumber.value).toBe('12345678');
      expect(m.initialModalSortCode.value).toBe('12-34-56');
      expect(m.initialModalInterestRate.value).toBe('2.5');
      expect(m.initialModalFixedBonusRate.value).toBe('0.5');
      expect(m.initialModalFixedBonusRateEndDate.value).toBe('2025-01-01');
    });
  });

  describe('openEditInstitutionModal', () => {
    it('should open edit modal with institution data', () => {
      const m = useAccountHubModals();
      m.openEditInstitutionModal(mockInstitution);
      expect(m.modalOpen.value).toBe(true);
      expect(m.modalType.value).toBe('edit');
      expect(m.modalResourceType.value).toBe('institution');
      expect(m.editingItem.value).toStrictEqual(mockInstitution);
    });

    it('should populate institution computed values', () => {
      const m = useAccountHubModals();
      m.openEditInstitutionModal(mockInstitution);
      expect(m.initialModalName.value).toBe('Test Bank');
      expect(m.initialModalParentId.value).toBeNull();
      expect(m.initialModalInstitutionType.value).toBe('bank');
    });
  });

  describe('closeModal', () => {
    it('should close modal and reset state', () => {
      const m = useAccountHubModals();
      m.openEditAccountModal(mockAccount);
      m.closeModal();
      expect(m.modalOpen.value).toBe(false);
      expect(m.modalType.value).toBe('create');
      expect(m.editingItem.value).toBeNull();
    });
  });

  describe('openDeleteConfirm', () => {
    it('should open delete confirm for account', () => {
      const m = useAccountHubModals();
      m.openDeleteConfirm('account', 42, 'My Account');
      expect(m.deleteConfirmOpen.value).toBe(true);
      expect(m.deleteConfirmType.value).toBe('account');
      expect(m.deleteConfirmId.value).toBe(42);
      expect(m.deleteConfirmName.value).toBe('My Account');
    });

    it('should open delete confirm for institution', () => {
      const m = useAccountHubModals();
      m.openDeleteConfirm('institution', 99, 'My Bank');
      expect(m.deleteConfirmOpen.value).toBe(true);
      expect(m.deleteConfirmType.value).toBe('institution');
      expect(m.deleteConfirmId.value).toBe(99);
      expect(m.deleteConfirmName.value).toBe('My Bank');
    });
  });

  describe('closeDeleteConfirm', () => {
    it('should close delete confirm', () => {
      const m = useAccountHubModals();
      m.openDeleteConfirm('account', 1, 'Test');
      m.closeDeleteConfirm();
      expect(m.deleteConfirmOpen.value).toBe(false);
    });
  });
});
