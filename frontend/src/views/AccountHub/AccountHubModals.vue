<template>
  <div>
    <AccountEventsModal
      :open="eventsModalOpen" :title="eventsTitle" :events="events"
      :loading="eventsLoading" :error="eventsError ?? undefined" :account-type="accountType"
      @close="$emit('closeEvents')" @add-win="(w) => $emit('addWin', w)"
      @record-sale="$emit('recordSale')" @view-sales="$emit('viewSales')"
      @record-dividend="dividendModalOpen = true"
      @record-gift="giftModalOpen = true"
      @delete-gift="(id) => $emit('deleteGift', id)"
    />
    <GiftModal
      :open="giftModalOpen" :account-type="accountType"
      @close="giftModalOpen = false"
      @save="(donor, date, val, shares) => { giftModalOpen = false; $emit('saveGift', donor, date, val, shares); }"
    />
    <RecordDividendModal
      :open="dividendModalOpen"
      @close="dividendModalOpen = false"
      @save="(a, d) => { dividendModalOpen = false; $emit('saveDividend', a, d); }"
    />
    <ShareSaleModal
      :open="shareSaleModalOpen"
      :shares-account-id="sharesAccountId"
      :all-items="items"
      :start-tab="shareSaleStartTab"
      @close="$emit('closeShareSale')"
      @sold="$emit('shareSold')"
      @reversed="$emit('shareReversed')"
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
    <AccountEditModal
      :open="accountModalOpen" :type="modalType" :item="accountEditItem"
      :institutions="institutions" :account-types="accountTypes" :account-statuses="accountStatuses"
      :transfer-accounts="transferAccounts" :error="accountError"
      @close="$emit('closeAccount')" @save="(p) => $emit('saveAccount', p)" @transferred="$emit('accountTransferred')"
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
import { ACCOUNT_TYPE_ASSET_GROUP } from '@views/AccountHub/accountTypeFieldConfigData';
import { ref, computed } from 'vue';
import AccountEventsModal from '@views/AccountHub/AccountEventsModal.vue';
import RecordDividendModal from '@views/AccountHub/RecordDividendModal.vue';
import GiftModal from '@views/AccountHub/GiftModal.vue';
import ShareSaleModal from '@views/AccountHub/ShareSaleModal.vue';
import AccountGroupModal from '@views/AccountHub/AccountGroupModal.vue';
import AccountEditModal from '@views/AccountHub/AccountEditModal.vue';
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
  shareSaleModalOpen: boolean;
  sharesAccountId: number;
  shareSaleStartTab: 'record' | 'history';
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
  recordSale: [];
  viewSales: [];
  saveDividend: [amount: string, paymentDate: string];
  saveGift: [donor: string, giftDate: string, giftValueGbp: string, numShares: string | null];
  deleteGift: [eventId: number];
  closeShareSale: [];
  shareSold: [];
  shareReversed: [];
  closeAccountGroup: [];
  saveAccountGroup: [data: { name: string; accountIds: number[]; groupId?: number }];
  deleteGroupFromModal: [groupId: number];
  closeAccount: [];
  saveAccount: [payload: unknown];
  accountTransferred: [];
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

const dividendModalOpen = ref(false);
const giftModalOpen = ref(false);
const editingItemRef = computed(() => props.editingItem);
const accountEditItem = computed<Account | null>(() =>
  props.editingItem && 'typeId' in props.editingItem ? props.editingItem : null);

const transferAccounts = computed<{ id: number; label: string }[]>(() => {
  if (props.modalType !== 'edit' || !props.editingItem || !('typeId' in props.editingItem)) return [];
  const editing = props.editingItem as Account;
  const closedId = props.accountStatuses.find(s => s.referenceValue === 'Closed')?.id;
  const editingTypeName = props.accountTypes.find(t => t.id === editing.typeId)?.referenceValue ?? '';
  const editingGroup = ACCOUNT_TYPE_ASSET_GROUP[editingTypeName] ?? editingTypeName;
  return props.items
    .filter(i => {
      const candidateTypeName = props.accountTypes.find(t => t.id === i.account.typeId)?.referenceValue ?? '';
      const candidateGroup = ACCOUNT_TYPE_ASSET_GROUP[candidateTypeName] ?? candidateTypeName;
      return candidateGroup === editingGroup && i.account.id !== editing.id && i.account.statusId !== closedId;
    })
    .map(i => {
      const typeName = props.accountTypes.find(t => t.id === i.account.typeId)?.referenceValue ?? '';
      const inst = i.institution?.name ?? '';
      const ref = i.account.accountNumber || i.account.rollRefNumber || '';
      const sc = i.account.sortCode ? ` ${i.account.sortCode}` : '';
      const label = [inst, typeName, i.account.name, `${ref}${sc}`.trim()].filter(Boolean).join(' - ');
      return { id: i.account.id, label };
    });
});

// Account fields are derived inside AccountEditModal; only the institution
// modal's initials are needed here.
const {
  initialModalName, initialModalParentId, initialModalInstitutionType,
} = useModalInitialValues(editingItemRef);
</script>
