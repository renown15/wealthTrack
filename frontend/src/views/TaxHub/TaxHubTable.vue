<template>
  <div>
    <div v-if="loading" class="p-8 loading-state">
      <div class="flex flex-col items-center"><div class="spinner"></div><p class="mt-4 text-muted">Loading accounts...</p></div>
    </div>

    <div v-else-if="error" class="error-banner"><span>{{ error }}</span></div>

    <div v-else-if="inScope.length === 0 && eligible.length === 0" class="p-8 text-center">
      <p class="text-muted">No accounts for this tax period.</p>
      <p class="text-sm text-muted mt-2">
        Add accounts to scope manually, or eligible accounts will appear automatically.
      </p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th class="table-cell table-header text-left">Account</th>
            <th class="table-cell table-header text-left">Institution</th>
            <th class="table-cell table-header text-left">Acc No.</th>
            <th class="table-cell table-header text-left">Sort Code</th>
            <th class="table-cell table-header text-left">Roll/Ref</th>
            <th class="table-cell table-header text-left">Type</th>
            <th class="table-cell table-header text-left">Status</th>
            <th class="table-cell table-header text-left">Interest Rate</th>
            <th class="table-cell table-header text-left">Income</th>
            <th class="table-cell table-header text-left">Capital Gain</th>
            <th class="table-cell table-header text-left">Tax Taken Off</th>
            <th class="table-cell table-header text-left">Events</th>
            <th class="table-cell table-header text-left">Docs</th>
            <th class="table-cell table-header text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            class="bg-indigo-50 border-t-2 border-indigo-200"
            @dragover.prevent
            @drop="onDropInScope"
          >
            <td colspan="14" class="table-cell py-2">
              <button
                class="flex items-center gap-2 font-semibold text-indigo-700 bg-transparent border-none cursor-pointer hover:text-indigo-900"
                @click="inScopeCollapsed = !inScopeCollapsed"
              >
                <span>{{ inScopeCollapsed ? Icons.chevronRight : Icons.chevronDown }}</span>
                <span>In Scope ({{ inScope.length }})</span>
              </button>
            </td>
          </tr>
          <template v-if="!inScopeCollapsed">
            <TaxHubTableRow
              v-for="account in inScope"
              :key="account.accountId"
              :account="account"
              section="inScope"
              @edit-return="emit('editReturn', $event)"
              @manage-documents="emit('manageDocuments', $event)"
              @show-events="emit('showEvents', $event)"
              @drag-start="onDragStart($event, 'inScope')"
              @move-to-eligible="emit('moveToEligible', $event)"
              @move-to-in-scope="emit('moveToInScope', $event)"
            />
          </template>

          <tr
            class="bg-gray-50 border-t-2 border-gray-200"
            @dragover.prevent
            @drop="onDropEligible"
          >
            <td colspan="14" class="table-cell py-2">
              <button
                class="flex items-center gap-2 font-semibold text-gray-600 bg-transparent border-none cursor-pointer hover:text-gray-900"
                @click="eligibleCollapsed = !eligibleCollapsed"
              >
                <span>{{ eligibleCollapsed ? Icons.chevronRight : Icons.chevronDown }}</span>
                <span>Eligible ({{ eligible.length }})</span>
              </button>
            </td>
          </tr>
          <template v-if="!eligibleCollapsed">
            <TaxHubTableRow
              v-for="account in eligible"
              :key="account.accountId"
              :account="account"
              section="eligible"
              @edit-return="emit('editReturn', $event)"
              @manage-documents="emit('manageDocuments', $event)"
              @show-events="emit('showEvents', $event)"
              @drag-start="onDragStart($event, 'eligible')"
              @move-to-in-scope="emit('moveToInScope', $event)"
              @move-to-eligible="emit('moveToEligible', $event)"
            />
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { EligibleAccount } from '@models/TaxModels';
import TaxHubTableRow from '@views/TaxHub/TaxHubTableRow.vue';
import { Icons } from '@/constants/icons';

defineProps<{
  inScope: EligibleAccount[];
  eligible: EligibleAccount[];
  loading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  editReturn: [account: EligibleAccount];
  manageDocuments: [account: EligibleAccount];
  showEvents: [account: EligibleAccount];
  moveToInScope: [accountId: number];
  moveToEligible: [accountId: number];
}>();

const inScopeCollapsed = ref(false);
const eligibleCollapsed = ref(false);
const draggingAccountId = ref<number | null>(null);
const draggingFrom = ref<'inScope' | 'eligible' | null>(null);

function onDragStart(accountId: number, section: 'inScope' | 'eligible'): void {
  draggingAccountId.value = accountId;
  draggingFrom.value = section;
}

function onDropInScope(): void {
  if (draggingAccountId.value !== null && draggingFrom.value === 'eligible') {
    emit('moveToInScope', draggingAccountId.value);
  }
  draggingAccountId.value = null;
  draggingFrom.value = null;
}

function onDropEligible(): void {
  if (draggingAccountId.value !== null && draggingFrom.value === 'inScope') {
    emit('moveToEligible', draggingAccountId.value);
  }
  draggingAccountId.value = null;
  draggingFrom.value = null;
}
</script>
