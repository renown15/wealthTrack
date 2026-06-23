<template>
  <BaseResourceModal
    :open="open"
    :title="confirmingTransfer ? 'Confirm Ownership Transfer' : modalTitle"
    :save-button-text="saveButtonText"
    @close="emitClose"
    @save="handleSave"
  >
    <div v-if="validationError || error" class="error-banner mb-4">{{ validationError || error }}</div>
    <div v-if="confirmingTransfer" class="text-sm text-muted">
      Transfer <strong>{{ formData.name }}</strong> from <strong>you</strong> to
      <strong>{{ selectedOwnerName }}</strong>? All balance history, attributes, and documents will
      move with it. This account will no longer appear in your portfolio.
    </div>
    <template v-else>
      <div v-if="type === 'edit' && familyMembers.length > 0" class="form-group">
        <label for="accountOwner" class="form-label">Account Owner</label>
        <select id="accountOwner" v-model="selectedOwnerId" class="form-input">
          <option :value="currentUserId">You</option>
          <option v-for="m in familyMembers" :key="m.accountId" :value="m.accountId">{{ m.firstName }} {{ m.lastName }}</option>
        </select>
      </div>
      <AccountFormFields
        :form-data="formData"
        :type="type"
        :institutions="institutions"
        :account-types="accountTypes"
        :account-statuses="accountStatuses"
        :transfer-accounts="props.transferAccounts"
      />
    </template>
  </BaseResourceModal>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import type { Institution } from '@/models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import type { FamilyMember } from '@models/family';
import BaseResourceModal from '@/components/BaseResourceModal.vue';
import AccountFormFields from '@views/AccountHub/AccountFormFields.vue';
import { useAccountForm, type AccountFormProps } from '@/composables/useAccountForm';
import { buildSavePayload, type SavePayload } from '@views/AccountHub/accountModalSave';
import { apiService } from '@services/ApiService';
import { authState } from '@/modules/auth';

interface Props {
  open: boolean;
  type: 'create' | 'edit';
  institutions: Institution[];
  accountTypes: ReferenceDataItem[];
  accountStatuses: ReferenceDataItem[];
  initialName?: string;
  initialInstitutionId?: number;
  initialTypeId?: number;
  initialStatusId?: number;
  initialOpenedAt?: string | null;
  initialClosedAt?: string | null;
  initialAccountNumber?: string | null;
  initialSortCode?: string | null;
  initialRollRefNumber?: string | null;
  initialInterestRate?: string | null;
  initialFixedBonusRate?: string | null;
  initialFixedBonusRateEndDate?: string | null;
  initialReleaseDate?: string | null;
  initialNumberOfShares?: string | null;
  initialUnderlying?: string | null;
  initialPrice?: string | null;
  initialPurchasePrice?: string | null;
  initialPensionMonthlyPayment?: string | null;
  initialAssetClass?: string | null;
  initialEncumbrance?: string | null;
  initialTaxYear?: string | null;
  transferAccounts?: { id: number; label: string }[];
  accountId?: number;
  error?: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  save: [SavePayload];
  transferred: [];
}>();

const formProps = computed<AccountFormProps>(() => ({
  open: props.open,
  resourceType: 'account',
  type: props.type,
  initialName: props.initialName,
  initialInstitutionId: props.initialInstitutionId,
  initialTypeId: props.initialTypeId,
  initialStatusId: props.initialStatusId,
  initialOpenedAt: props.initialOpenedAt,
  initialClosedAt: props.initialClosedAt,
  initialAccountNumber: props.initialAccountNumber,
  initialSortCode: props.initialSortCode,
  initialRollRefNumber: props.initialRollRefNumber,
  initialInterestRate: props.initialInterestRate,
  initialFixedBonusRate: props.initialFixedBonusRate,
  initialFixedBonusRateEndDate: props.initialFixedBonusRateEndDate,
  initialReleaseDate: props.initialReleaseDate,
  initialNumberOfShares: props.initialNumberOfShares,
  initialUnderlying: props.initialUnderlying,
  initialPrice: props.initialPrice,
  initialPurchasePrice: props.initialPurchasePrice,
  initialPensionMonthlyPayment: props.initialPensionMonthlyPayment,
  initialAssetClass: props.initialAssetClass,
  initialEncumbrance: props.initialEncumbrance,
  initialTaxYear: props.initialTaxYear,
  accountTypes: props.accountTypes,
  accountStatuses: props.accountStatuses,
  institutions: props.institutions,
}));

const { formData } = useAccountForm(toRef(formProps));
const validationError = ref('');
const familyMembers = ref<FamilyMember[]>([]);
const currentUserId = computed(() => authState.user?.id ?? 0);
const selectedOwnerId = ref(0);
const confirmingTransfer = ref(false);

const modalTitle = computed(() => `${props.type === 'create' ? 'New' : 'Edit'} Account`);
const saveButtonText = computed(() => {
  if (confirmingTransfer.value) return 'Confirm Transfer';
  return props.type === 'create' ? 'Create' : 'Save';
});
const selectedOwnerName = computed(() => {
  const m = familyMembers.value.find(f => f.accountId === selectedOwnerId.value);
  return m ? `${m.firstName} ${m.lastName}` : '';
});

const emitClose = (): void => {
  if (confirmingTransfer.value) { confirmingTransfer.value = false; return; }
  emit('close');
};

watch(() => props.open, async (val: boolean) => {
  if (!val || props.type !== 'edit') {
    familyMembers.value = [];
    selectedOwnerId.value = currentUserId.value;
    confirmingTransfer.value = false;
    return;
  }
  selectedOwnerId.value = currentUserId.value;
  const fam = await apiService.getFamilies().then(f => f[0] ?? null).catch(() => null);
  if (fam) familyMembers.value = fam.members.filter(m => m.accountId !== currentUserId.value);
});

const doTransfer = async (): Promise<void> => {
  if (!props.accountId) return;
  try {
    await apiService.transferAccount(props.accountId, selectedOwnerId.value);
    emit('transferred');
    emit('close');
  } catch (e) {
    validationError.value = e instanceof Error ? e.message : 'Transfer failed';
  } finally {
    confirmingTransfer.value = false;
  }
};

const handleSave = (): void => {
  validationError.value = '';
  if (confirmingTransfer.value) { void doTransfer(); return; }
  if (props.type === 'edit' && selectedOwnerId.value !== currentUserId.value) { confirmingTransfer.value = true; return; }
  const { payload, error } = buildSavePayload(formData.value, props.accountStatuses);
  if (!payload) { validationError.value = error; return; }
  emit('save', payload);
};
</script>
