<template>
  <div class="hub-content-card p-6">
    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center gap-3">
        <span class="w-3 h-3 rounded-full flex-shrink-0" :style="{ background: color }"></span>
        <div>
          <h3 class="m-0 text-lg font-semibold text-text-dark">{{ item.label }}</h3>
          <p class="m-0 text-sm text-muted">
            {{ formatCurrency(item.value) }} &middot; {{ pct(item.value, total) }} of portfolio
          </p>
        </div>
      </div>
      <button class="btn-close" @click="$emit('close')">×</button>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th class="table-header p-4 text-left">Account</th>
            <th class="table-header p-4 text-left">Institution</th>
            <th class="table-header p-4 text-right">Balance</th>
            <th class="table-header p-4 text-right">% of group</th>
            <th class="table-header p-4"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in item.accounts" :key="account.accountName" class="table-row-hover">
            <td class="table-cell font-medium">{{ account.accountName }}</td>
            <td class="table-cell text-muted">{{ account.institutionName }}</td>
            <td class="table-cell text-right font-semibold">{{ formatCurrency(account.balance) }}</td>
            <td class="table-cell text-right text-muted">{{ pct(account.balance, item.value) }}</td>
            <td class="table-cell text-right">
              <button
                class="inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                type="button"
                title="Edit account"
                @click="$emit('editAccount', account.accountId)"
              >{{ Icons.edit }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BreakdownItem } from '@/models/WealthTrackDataModels';
import { Icons } from '@/constants/icons';

defineProps<{
  item: BreakdownItem;
  color: string;
  total: number;
  formatCurrency: (v: number) => string;
  pct: (v: number, total: number) => string;
}>();

defineEmits<{ close: []; editAccount: [accountId: number] }>();
</script>
