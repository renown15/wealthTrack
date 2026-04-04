<template>
  <div>
    <AccountEventsModal
      :open="eventsModalOpen" :title="eventsTitle" :events="events"
      :loading="eventsLoading" :error="eventsError" :account-type="accountType"
      @close="$emit('closeEvents')" @add-win="(w) => $emit('addWin', w)"
    />
    <AccountGroupModal
      :open="accountGroupModalOpen" :type="accountGroupModalType" :items="items"
      :account-types="accountTypes" :available-groups="availableGroups"
      :group-members-map="groupMembersMap" :api-error="groupApiError"
      :initial-group-name="editingGroupName" :initial-group-id="editingGroupId"
      :initial-member-ids="editingGroupMemberIds"
      @close="$emit('closeAccountGroup')"
      @save="(d) => $emit('saveAccountGroup', d)"
      @delete-group="(id) => $emit('deleteGroupFromModal', id)"
    />
    <AccountModal
      :open="accountModalOpen" :type="modalType"
      :institutions="institutions" :account-types="accountTypes" :account-statuses="accountStatuses"
      :initial-name="initialModalName" :initial-institution-id="initialModalInstitutionId"
      :initial-type-id="initialModalTypeId" :initial-status-id="initialModalStatusId"
      :initial-opened-at="initialModalOpenedAt" :initial-closed-at="initialModalClosedAt"
      :initial-account-number="initialModalAccountNumber" :initial-sort-code="initialModalSortCode"
      :initial-roll-ref-number="initialModalRollRefNumber" :initial-interest-rate="initialModalInterestRate"
      :initial-fixed-bonus-rate="initialModalFixedBonusRate"
      :initial-fixed-bonus-rate-end-date="initialModalFixedBonusRateEndDate"
      :initial-release-date="initialModalReleaseDate" :initial-number-of-shares="initialModalNumberOfShares"
      :initial-underlying="initialModalUnderlying" :initial-price="initialModalPrice"
      :initial-purchase-price="initialModalPurchasePrice"
      :initial-pension-monthly-payment="initialModalPensionMonthlyPayment"
      :initial-asset-class="initialModalAssetClass" :initial-encumbrance="initialModalEncumbrance" :error="accountError"
      @close="$emit('closeAccount')" @save="(p) => $emit('saveAccount', p)"
    />
    <InstitutionModal
      :open="institutionModalOpen" :type="modalType"
      :institutions="institutions" :institution-types="institutionTypes"
      :initial-name="initialModalName" :initial-parent-id="initialModalParentId"
      :initial-institution-type="initialModalInstitutionType" :error="accountError"
      @close="$emit('closeInstitution')" @save="(p) => $emit('saveInstitution', p)"
    />
    <DeleteConfirmModal
      :open="deleteConfirmOpen" :item-name="deleteConfirmName"
      @close="$emit('closeDelete')" @confirm="$emit('confirmDelete')"
    />
    <InstitutionCredentialsModal
      :open="credentialModalOpen" :institution="credentialInstitution"
      :credential-types="credentialTypes" :credentials="credentials"
      :loading="credentialLoading" :saving="credentialSaving"
      :deleting-id="credentialDeletingId" :error="credentialError"
      :editing-credential="editingCredential" @close="$emit('closeCredentials')"
      @save="(p) => $emit('saveCredential', p)" @edit="(c) => $emit('editCredential', c)"
      @cancel-edit="$emit('cancelCredentialEdit')" @remove="(id) => $emit('removeCredential', id)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Account, Institution, PortfolioItem, AccountGroup, AccountEvent, InstitutionCredential } from '@/models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import { useModalInitialValues } from '@/composables/useModalInitialValues';
import { computed } from 'vue';
import AccountEventsModal from '@views/AccountHub/AccountEventsModal.vue';
import AccountGroupModal from '@views/AccountHub/AccountGroupModal.vue';
import AccountModal from '@views/AccountHub/AccountModal.vue';
import InstitutionModal from '@views/AccountHub/InstitutionModal.vue';
import DeleteConfirmModal from '@views/AccountHub/DeleteConfirmModal.vue';
import InstitutionCredentialsModal from '@views/AccountHub/InstitutionCredentialsModal.vue';

const props = defineProps<{
  editingItem: Account | Institution | null;
  items: PortfolioItem[];
  institutions: Institution[];
  accountTypes: ReferenceDataItem[];
  accountStatuses: ReferenceDataItem[];
  institutionTypes: ReferenceDataItem[];
  availableGroups: AccountGroup[];
  groupMembersMap: Map<number, number[]>;
  groupApiError: string | null;
  accountError: string | null;
  modalType: 'create' | 'edit';
  accountModalOpen: boolean;
  institutionModalOpen: boolean;
  deleteConfirmOpen: boolean;
  deleteConfirmName: string;
  accountGroupModalOpen: boolean;
  accountGroupModalType: 'create' | 'edit';
  editingGroupId: number;
  editingGroupName: string;
  editingGroupMemberIds: number[];
  eventsModalOpen: boolean;
  eventsTitle: string;
  eventsLoading: boolean;
  eventsError?: string | null;
  events: AccountEvent[];
  accountType?: string;
  credentialModalOpen: boolean;
  credentialInstitution: Institution | null;
  credentialTypes: ReferenceDataItem[];
  credentials: InstitutionCredential[];
  credentialLoading: boolean;
  credentialSaving: boolean;
  credentialDeletingId: number | null;
  credentialError: string | null;
  editingCredential: InstitutionCredential | null;
}>();

defineEmits<{
  closeEvents: [];
  addWin: [amount: string];
  closeAccountGroup: [];
  saveAccountGroup: [data: { name: string; accountIds: number[]; groupId?: number }];
  deleteGroupFromModal: [groupId: number];
  closeAccount: [];
  saveAccount: [payload: unknown];
  closeInstitution: [];
  saveInstitution: [payload: unknown];
  closeDelete: [];
  confirmDelete: [];
  closeCredentials: [];
  saveCredential: [payload: unknown];
  editCredential: [credential: InstitutionCredential];
  cancelCredentialEdit: [];
  removeCredential: [id: number];
}>();

const editingItemRef = computed(() => props.editingItem);
const {
  initialModalName, initialModalInstitutionId, initialModalTypeId, initialModalStatusId,
  initialModalOpenedAt, initialModalClosedAt, initialModalAccountNumber, initialModalSortCode,
  initialModalRollRefNumber, initialModalInterestRate, initialModalFixedBonusRate,
  initialModalFixedBonusRateEndDate, initialModalReleaseDate, initialModalNumberOfShares,
  initialModalUnderlying, initialModalPrice, initialModalPurchasePrice,
  initialModalPensionMonthlyPayment, initialModalAssetClass, initialModalEncumbrance, initialModalParentId,
  initialModalInstitutionType,
} = useModalInitialValues(editingItemRef);
</script>
