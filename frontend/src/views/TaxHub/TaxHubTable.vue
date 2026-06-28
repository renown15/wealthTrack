<template>
  <div>
    <div v-if="loading" class="p-8 loading-state">
      <div class="flex flex-col items-center"><div class="spinner"></div><p class="mt-4 text-muted">Loading accounts...</p></div>
    </div>

    <div v-else-if="error" class="error-banner"><span>{{ error }}</span></div>

    <div v-else-if="inScope.length === 0 && eligible.length === 0 && taxFree.length === 0 && notInScope.length === 0" class="p-8 text-center">
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
            <th class="table-cell table-header text-left">Tax Due</th>
            <th class="table-cell table-header text-left">First Balance</th>
            <th class="table-cell table-header text-left">Events</th>
            <th class="table-cell table-header text-left">Docs</th>
            <th class="table-cell table-header text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr class="bg-indigo-50 border-t-2 border-indigo-200" @dragover.prevent @drop="onDropInScope">
            <td colspan="16" class="table-cell py-2">
              <button class="flex items-center gap-2 font-semibold text-indigo-700 bg-transparent border-none cursor-pointer hover:text-indigo-900" @click="inScopeCollapsed = !inScopeCollapsed">
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
              :portfolio-item="portfolioItemMap[account.accountId] ?? null"
              section="inScope"
              @edit-return="emit('editReturn', $event)" @edit-account="emit('editAccount', $event)"
              @manage-documents="emit('manageDocuments', $event)" @show-events="emit('showEvents', $event)"
              @drag-start="onDragStart($event, 'inScope')" @move-to-eligible="emit('moveToEligible', $event)"
              @move-to-in-scope="emit('moveToInScope', $event)"
            />
          </template>

          <tr class="bg-gray-50 border-t-2 border-gray-200" @dragover.prevent @drop="onDropEligible">
            <td colspan="16" class="table-cell py-2">
              <button class="flex items-center gap-2 font-semibold text-gray-600 bg-transparent border-none cursor-pointer hover:text-gray-900" @click="eligibleCollapsed = !eligibleCollapsed">
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
              :portfolio-item="portfolioItemMap[account.accountId] ?? null"
              section="eligible"
              @edit-return="emit('editReturn', $event)" @edit-account="emit('editAccount', $event)"
              @manage-documents="emit('manageDocuments', $event)" @show-events="emit('showEvents', $event)"
              @drag-start="onDragStart($event, 'eligible')" @move-to-in-scope="emit('moveToInScope', $event)"
              @move-to-eligible="emit('moveToEligible', $event)" @mark-out-of-scope="emit('markOutOfScope', $event)"
            />
          </template>

          <tr v-if="taxFree.length > 0" class="bg-green-50 border-t-2 border-green-200">
            <td colspan="16" class="table-cell py-2">
              <button class="flex items-center gap-2 font-semibold text-green-700 bg-transparent border-none cursor-pointer hover:text-green-900" @click="taxFreeCollapsed = !taxFreeCollapsed">
                <span>{{ taxFreeCollapsed ? Icons.chevronRight : Icons.chevronDown }}</span>
                <span>Tax Free ({{ taxFree.length }})</span>
              </button>
            </td>
          </tr>
          <template v-if="!taxFreeCollapsed">
            <TaxHubTableRow
              v-for="account in taxFree"
              :key="account.accountId"
              :account="account"
              :portfolio-item="portfolioItemMap[account.accountId] ?? null"
              section="notInScope"
              @edit-account="emit('editAccount', $event)"
              @show-events="emit('showEvents', $event)"
              @drag-start="onDragStart($event, 'notInScope')"
              @move-to-in-scope="emit('moveToInScope', $event)"
            />
          </template>

          <tr v-if="notInScope.length > 0" class="bg-red-50 border-t-2 border-red-200">
            <td colspan="16" class="table-cell py-2">
              <button class="flex items-center gap-2 font-semibold text-red-700 bg-transparent border-none cursor-pointer hover:text-red-900" @click="notInScopeCollapsed = !notInScopeCollapsed">
                <span>{{ notInScopeCollapsed ? Icons.chevronRight : Icons.chevronDown }}</span>
                <span>Not in Scope ({{ notInScope.length }})</span>
              </button>
            </td>
          </tr>
          <template v-if="!notInScopeCollapsed">
            <TaxHubTableRow
              v-for="account in notInScope"
              :key="account.accountId"
              :account="account"
              :portfolio-item="portfolioItemMap[account.accountId] ?? null"
              section="notInScope"
              @edit-account="emit('editAccount', $event)"
              @show-events="emit('showEvents', $event)"
              @drag-start="onDragStart($event, 'notInScope')"
              @move-to-in-scope="emit('moveToInScope', $event)"
              @clear-scope="emit('clearScope', $event)"
            />
          </template>
        </tbody>
        <tfoot>
          <tr class="bg-gray-100 border-t-2 border-gray-300 font-semibold">
            <td colspan="8" class="table-cell text-right">Totals</td>
            <td class="table-cell">{{ formatCurrency(totals.income) }}</td>
            <td class="table-cell">{{ formatCurrency(totals.capitalGain) }}</td>
            <td class="table-cell">{{ formatCurrency(totals.taxTakenOff) }}</td>
            <td class="table-cell">{{ formatCurrency(totals.taxDue) }}</td>
            <td colspan="4"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { EligibleAccount } from '@models/TaxModels';
import type { PortfolioItem } from '@models/WealthTrackDataModels';
import TaxHubTableRow from '@views/TaxHub/TaxHubTableRow.vue';
import { Icons } from '@/constants/icons';

const props = defineProps<{
  inScope: EligibleAccount[];
  eligible: EligibleAccount[];
  taxFree: EligibleAccount[];
  notInScope: EligibleAccount[];
  loading: boolean;
  error: string | null;
  portfolioItemMap: Record<number, PortfolioItem>;
}>();

const totals = computed(() =>
  [...props.inScope, ...props.eligible, ...props.taxFree, ...props.notInScope].reduce(
    (t, a) => ({
      income: t.income + (a.taxReturn?.income ?? 0),
      capitalGain: t.capitalGain + (a.taxReturn?.capitalGain ?? 0),
      taxTakenOff: t.taxTakenOff + (a.taxReturn?.taxTakenOff ?? 0),
      taxDue: t.taxDue + (a.taxReturn?.taxDue ?? 0),
    }),
    { income: 0, capitalGain: 0, taxTakenOff: 0, taxDue: 0 },
  )
);

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val);
}

const emit = defineEmits<{
  editReturn: [account: EligibleAccount];
  editAccount: [account: EligibleAccount];
  manageDocuments: [account: EligibleAccount];
  showEvents: [account: EligibleAccount];
  moveToInScope: [accountId: number];
  moveToEligible: [accountId: number];
  markOutOfScope: [account: EligibleAccount];
  clearScope: [accountId: number];
}>();

const inScopeCollapsed = ref(false);
const eligibleCollapsed = ref(false);
const taxFreeCollapsed = ref(true);
const notInScopeCollapsed = ref(true);
const draggingAccountId = ref<number | null>(null);
const draggingFrom = ref<'inScope' | 'eligible' | 'notInScope' | null>(null);

function onDragStart(accountId: number, section: 'inScope' | 'eligible' | 'notInScope'): void {
  draggingAccountId.value = accountId;
  draggingFrom.value = section;
}

function onDropInScope(): void {
  if (draggingAccountId.value !== null && (draggingFrom.value === 'eligible' || draggingFrom.value === 'notInScope')) {
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
