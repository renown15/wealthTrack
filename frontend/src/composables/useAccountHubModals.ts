import { ref, computed, type Ref, type ComputedRef } from 'vue';
import type { Account, Institution } from '@/models/WealthTrackDataModels';

export interface UseAccountHubModalsReturn {
  modalOpen: Ref<boolean>;
  modalType: Ref<'create' | 'edit'>;
  modalResourceType: Ref<'account' | 'institution'>;
  editingItem: Ref<Account | Institution | null>;
  deleteConfirmOpen: Ref<boolean>;
  deleteConfirmType: Ref<'account' | 'institution'>;
  deleteConfirmId: Ref<number>;
  deleteConfirmName: Ref<string>;
  initialModalName: ComputedRef<string>;
  initialModalInstitutionId: ComputedRef<number>;
  initialModalTypeId: ComputedRef<number>;
  initialModalStatusId: ComputedRef<number>;
  initialModalOpenedAt: ComputedRef<string | null | undefined>;
  initialModalClosedAt: ComputedRef<string | null | undefined>;
  initialModalAccountNumber: ComputedRef<string | null | undefined>;
  initialModalSortCode: ComputedRef<string | null | undefined>;
  initialModalRollRefNumber: ComputedRef<string | null | undefined>;
  initialModalInterestRate: ComputedRef<string | null | undefined>;
  initialModalFixedBonusRate: ComputedRef<string | null | undefined>;
  initialModalFixedBonusRateEndDate: ComputedRef<string | null | undefined>;
  initialModalParentId: ComputedRef<number | null | undefined>;
  initialModalInstitutionType: ComputedRef<string | null | undefined>;
  openCreateAccountModal: () => void;
  openCreateInstitutionModal: () => void;
  openEditAccountModal: (account: Account) => void;
  openEditInstitutionModal: (institution: Institution) => void;
  closeModal: () => void;
  openDeleteConfirm: (type: 'account' | 'institution', id: number, name: string) => void;
  closeDeleteConfirm: () => void;
}

export function useAccountHubModals(): UseAccountHubModalsReturn {
  const modalOpen = ref(false);
  const modalType = ref<'create' | 'edit'>('create');
  const modalResourceType = ref<'account' | 'institution'>('account');
  const editingItem = ref<Account | Institution | null>(null);
  const deleteConfirmOpen = ref(false);
  const deleteConfirmType = ref<'account' | 'institution'>('account');
  const deleteConfirmId = ref(0);
  const deleteConfirmName = ref('');

  const initialModalName = computed(() => editingItem.value?.name ?? '');
  const initialModalInstitutionId = computed(() =>
    editingItem.value && 'institutionId' in editingItem.value ? editingItem.value.institutionId : 0);
  const initialModalTypeId = computed(() =>
    editingItem.value && 'typeId' in editingItem.value ? editingItem.value.typeId : 0);
  const initialModalStatusId = computed(() =>
    editingItem.value && 'statusId' in editingItem.value ? editingItem.value.statusId : 0);
  const initialModalOpenedAt = computed(() =>
    editingItem.value && 'openedAt' in editingItem.value ? (editingItem.value as Account).openedAt : null);
  const initialModalClosedAt = computed(() =>
    editingItem.value && 'closedAt' in editingItem.value ? (editingItem.value as Account).closedAt : null);
  const initialModalAccountNumber = computed(() =>
    editingItem.value && 'accountNumber' in editingItem.value ? (editingItem.value as Account).accountNumber : null);
  const initialModalSortCode = computed(() =>
    editingItem.value && 'sortCode' in editingItem.value ? (editingItem.value as Account).sortCode : null);
  const initialModalRollRefNumber = computed(() =>
    editingItem.value && 'rollRefNumber' in editingItem.value ? (editingItem.value as Account).rollRefNumber : null);
  const initialModalInterestRate = computed(() =>
    editingItem.value && 'interestRate' in editingItem.value ? (editingItem.value as Account).interestRate : null);
  const initialModalFixedBonusRate = computed(() =>
    editingItem.value && 'fixedBonusRate' in editingItem.value ? (editingItem.value as Account).fixedBonusRate : null);
  const initialModalFixedBonusRateEndDate = computed(() =>
    editingItem.value && 'fixedBonusRateEndDate' in editingItem.value ? (editingItem.value as Account).fixedBonusRateEndDate : null);
  const initialModalParentId = computed(() =>
    editingItem.value && 'parentId' in editingItem.value ? (editingItem.value as Institution).parentId : null);
  const initialModalInstitutionType = computed(() =>
    editingItem.value && 'institutionType' in editingItem.value ? (editingItem.value as Institution).institutionType : null);

  const openCreateAccountModal = (): void => {
    modalType.value = 'create'; modalResourceType.value = 'account'; editingItem.value = null; modalOpen.value = true;
  };
  const openCreateInstitutionModal = (): void => {
    modalType.value = 'create'; modalResourceType.value = 'institution'; editingItem.value = null; modalOpen.value = true;
  };
  const openEditAccountModal = (account: Account): void => {
    modalType.value = 'edit'; modalResourceType.value = 'account'; editingItem.value = account; modalOpen.value = true;
  };
  const openEditInstitutionModal = (institution: Institution): void => {
    modalType.value = 'edit'; modalResourceType.value = 'institution'; editingItem.value = institution; modalOpen.value = true;
  };
  const closeModal = (): void => { modalOpen.value = false; modalType.value = 'create'; editingItem.value = null; };
  const openDeleteConfirm = (type: 'account' | 'institution', id: number, name: string): void => {
    deleteConfirmType.value = type; deleteConfirmId.value = id; deleteConfirmName.value = name; deleteConfirmOpen.value = true;
  };
  const closeDeleteConfirm = (): void => { deleteConfirmOpen.value = false; };

  return {
    modalOpen, modalType, modalResourceType, editingItem,
    deleteConfirmOpen, deleteConfirmType, deleteConfirmId, deleteConfirmName,
    initialModalName, initialModalInstitutionId, initialModalTypeId, initialModalStatusId,
    initialModalOpenedAt, initialModalClosedAt, initialModalAccountNumber, initialModalSortCode,
    initialModalRollRefNumber, initialModalInterestRate, initialModalFixedBonusRate,
    initialModalFixedBonusRateEndDate, initialModalParentId, initialModalInstitutionType,
    openCreateAccountModal, openCreateInstitutionModal, openEditAccountModal, openEditInstitutionModal,
    closeModal, openDeleteConfirm, closeDeleteConfirm,
  };
}
