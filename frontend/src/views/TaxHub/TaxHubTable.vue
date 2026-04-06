<template>
  <div>
    <div v-if="loading" class="p-8 loading-state">
      <div class="flex flex-col items-center"><div class="spinner"></div><p class="mt-4 text-muted">Loading accounts...</p></div>
    </div>

    <div v-else-if="error" class="error-banner"><span>{{ error }}</span></div>

    <div v-else-if="accounts.length === 0" class="p-8 text-center">
      <p class="text-muted">No eligible accounts for this tax period.</p>
      <p class="text-sm text-muted mt-2">
        Eligible accounts are non-ISA accounts with an interest rate, or Shares accounts sold during this period.
      </p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th class="table-cell table-header text-left">Account</th>
            <th class="table-cell table-header text-left">Institution</th>
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
          <tr v-for="account in accounts" :key="account.accountId" class="table-row-hover">
            <td class="table-cell font-semibold">{{ account.accountName }}</td>
            <td class="table-cell">{{ account.institutionName ?? '—' }}</td>
            <td class="table-cell">{{ account.accountType }}</td>
            <td class="table-cell">
              <span
                class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full"
                :class="account.accountStatus === 'Closed' ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'"
                :title="account.accountStatus ?? ''"
              >{{ account.accountStatus === 'Closed' ? 'C' : 'O' }}</span>
            </td>
            <td class="table-cell">
              {{ account.eligibilityReason === 'interest_bearing' ? (account.interestRate ?? '—') : '—' }}
            </td>
            <td class="table-cell">
              <span v-if="account.eligibilityReason === 'interest_bearing'">
                {{ formatCurrency(account.taxReturn?.income) }}
              </span>
              <span v-else class="text-muted">—</span>
            </td>
            <td class="table-cell">
              <span v-if="account.eligibilityReason === 'sold_in_period'">
                {{ formatCurrency(account.taxReturn?.capitalGain) }}
              </span>
              <span v-else class="text-muted">—</span>
            </td>
            <td class="table-cell">{{ formatCurrency(account.taxReturn?.taxTakenOff) }}</td>
            <td class="table-cell">
              <button
                class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded bg-blue-100 text-blue-600 hover:bg-blue-200 border-none cursor-pointer"
                :title="`View ${account.eventCount} events`"
                @click="emit('showEvents', account)"
              >{{ account.eventCount }}</button>
            </td>
            <td class="table-cell">
              <span class="font-medium">{{ account.documents.length }}</span>
            </td>
            <td class="table-cell">
              <div class="actions-col">
                <button
                  class="btn-icon edit inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                  title="Edit tax return"
                  @click="emit('editReturn', account)"
                >{{ Icons.edit }}</button>
                <button
                  class="btn-icon inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-green-100 text-green-600 hover:bg-green-200"
                  title="Manage documents"
                  @click="emit('manageDocuments', account)"
                >{{ Icons.eye }}</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EligibleAccount } from '@models/TaxModels';
import { Icons } from '@/constants/icons';

defineProps<{
  accounts: EligibleAccount[];
  loading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  editReturn: [account: EligibleAccount];
  manageDocuments: [account: EligibleAccount];
  showEvents: [account: EligibleAccount];
}>();

function formatCurrency(val: number | null | undefined): string {
  if (val == null) return '—';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val);
}
</script>
