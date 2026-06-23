<template>
  <div>
    <div v-if="detail.groups.length === 0 && detail.unassigned.length === 0" class="empty-state">
      <p class="empty-title">No accounts yet</p>
      <p class="empty-text">Add groups using the button above, then drag accounts between them.</p>
    </div>

    <div v-else class="flex flex-col xl:flex-row gap-6">
      <div class="flex-1 overflow-x-auto">
        <table class="data-table w-full">
          <thead>
            <tr>
              <th class="table-cell table-header text-left">Account</th>
              <th class="table-cell table-header text-left">Institution</th>
              <th class="table-cell table-header text-left">Type</th>
              <th class="table-cell table-header text-right">Balance</th>
              <th v-if="detail.isOwner" class="table-cell table-header"></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="group in detail.groups" :key="group.linkId">
              <tr class="bg-indigo-50 border-t-2 border-indigo-200" @dragover.prevent @drop="onDropGroup(group.groupId)">
                <td :colspan="detail.isOwner ? 5 : 4" class="table-cell py-2">
                  <div class="flex items-center gap-3">
                    <button class="flex items-center gap-1 font-semibold text-indigo-700 bg-transparent border-none cursor-pointer hover:text-indigo-900 p-0" @click="toggleGroup(group.linkId)">
                      <span class="text-xs">{{ (collapsed.has(group.linkId) && !props.expandAll) ? Icons.chevronRight : Icons.chevronDown }}</span>
                      <span>{{ group.name }}</span>
                      <template v-if="collapsed.has(group.linkId) && !props.expandAll">
                        <span v-for="mc in memberCounts(group.accounts)" :key="mc.initials" class="text-xs bg-indigo-100 text-indigo-600 rounded px-1">{{ mc.initials }}×{{ mc.count }}</span>
                        <span class="text-xs font-mono text-indigo-500">{{ groupTotal(group) }}</span>
                      </template>
                      <span v-else class="text-indigo-400 font-normal text-xs">({{ group.accounts.length }})</span>
                    </button>
                    <template v-if="detail.isOwner">
                      <button class="btn-icon-edit" style="width:1.5rem;height:1.5rem;font-size:0.7rem;" title="Rename group" @click="emit('renameGroup', group.linkId, group.name)">{{ Icons.edit }}</button>
                      <button class="btn-icon-delete" style="width:1.5rem;height:1.5rem;font-size:0.7rem;" title="Delete group" @click="emit('deleteGroup', group.linkId)">{{ Icons.delete }}</button>
                    </template>
                  </div>
                </td>
              </tr>
              <template v-if="!collapsed.has(group.linkId) || props.expandAll">
                <ScenarioGroupRow
                  v-for="account in group.accounts"
                  :key="account.accountId"
                  :account="account"
                  :balance-map="balanceMap"
                  :is-owner="detail.isOwner"
                  @drag-start="onDragStart($event, group.groupId)"
                  @unassign="emit('assignAccount', $event, null)"
                />
                <tr v-if="group.accounts.length > 0" class="bg-indigo-50 border-b border-indigo-200">
                  <td colspan="3" class="table-cell text-xs text-indigo-500 uppercase tracking-wider">Total</td>
                  <td class="table-cell text-right font-mono font-semibold text-indigo-700">{{ groupTotal(group) || '—' }}</td>
                  <td v-if="detail.isOwner" class="table-cell"></td>
                </tr>
              </template>
            </template>

            <tr class="bg-gray-50 border-t-2 border-gray-200" @dragover.prevent @drop="onDropUnassigned">
              <td :colspan="detail.isOwner ? 5 : 4" class="table-cell py-2">
                <button class="flex items-center gap-1 font-semibold text-muted bg-transparent border-none cursor-pointer hover:text-text-dark p-0" @click="unassignedCollapsed = !unassignedCollapsed">
                  <span class="text-xs">{{ unassignedCollapsed ? Icons.chevronRight : Icons.chevronDown }}</span>
                  <span>Unassigned</span>
                  <span class="text-muted font-normal text-xs">({{ detail.unassigned.length }})</span>
                </button>
              </td>
            </tr>
            <template v-if="!unassignedCollapsed || props.expandAll">
              <ScenarioGroupRow
                v-for="account in detail.unassigned"
                :key="account.accountId"
                :account="account"
                :balance-map="balanceMap"
                :is-owner="false"
                @drag-start="onDragStart($event, null)"
                @unassign="() => {}"
              />
              <tr v-if="detail.unassigned.length > 0" class="bg-gray-50 border-b border-gray-200">
                <td colspan="3" class="table-cell text-xs text-muted uppercase tracking-wider">Total</td>
                <td class="table-cell text-right font-mono font-semibold text-gray-600">{{ formatBalance(unassignedBalance) || '—' }}</td>
                <td v-if="detail.isOwner" class="table-cell"></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div v-if="hasBalances" class="xl:w-60 flex-shrink-0 flex flex-col gap-6">
        <ScenarioPieChart v-if="groupChartEntries.length > 0" title="Balance Allocation" :entries="groupChartEntries" :breakdown="groupBreakdown" />
        <ScenarioPieChart v-if="memberChartEntries.length > 0" title="By Member" :entries="memberChartEntries" :breakdown="memberBreakdown" show-table />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue';
import type { ScenarioAccountItem, ScenarioDetail, ScenarioGroup } from '@models/scenario';
import { Icons } from '@/constants/icons';
import { useScenarioCharts } from '@composables/useScenarioCharts';
import ScenarioGroupRow from '@views/ScenarioHub/ScenarioGroupRow.vue';

// Lazy-loaded: chart.js + vue-chartjs are only needed when balances render.
const ScenarioPieChart = defineAsyncComponent(
  () => import('@views/ScenarioHub/ScenarioPieChart.vue'),
);

const props = defineProps<{
  detail: ScenarioDetail;
  balanceMap: Record<number, number>;
  expandAll?: boolean;
}>();

const emit = defineEmits<{
  renameGroup: [linkId: number, currentName: string];
  deleteGroup: [linkId: number];
  assignAccount: [accountId: number, groupId: number | null];
}>();

const collapsed = ref(new Set<number>());
const unassignedCollapsed = ref(false);
const draggingAccountId = ref<number | null>(null);
const draggingFromGroup = ref<number | null>(null);

function toggleGroup(linkId: number): void {
  if (collapsed.value.has(linkId)) collapsed.value.delete(linkId);
  else collapsed.value.add(linkId);
}

function accountsBalance(accounts: ScenarioAccountItem[]): number {
  return accounts.reduce((sum, a) => sum + (props.balanceMap[a.accountId] ?? 0), 0);
}

function groupBalance(group: ScenarioGroup): number { return accountsBalance(group.accounts); }

const formatBalance = (val: number): string =>
  val ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val) : '';

const groupTotal = (group: ScenarioGroup): string => formatBalance(groupBalance(group));

function memberCounts(accounts: ScenarioAccountItem[]): { initials: string; count: number }[] {
  const map = new Map<string, number>();
  for (const a of accounts) map.set(a.ownerInitials, (map.get(a.ownerInitials) ?? 0) + 1);
  return [...map.entries()].map(([initials, count]) => ({ initials, count }));
}

const hasBalances = computed(() =>
  props.detail.groups.some(g => g.accounts.some(a => props.balanceMap[a.accountId] !== undefined))
  || props.detail.unassigned.some(a => props.balanceMap[a.accountId] !== undefined),
);

const { unassignedBalance, groupChartEntries, groupBreakdown, memberChartEntries, memberBreakdown } =
  useScenarioCharts(() => props.detail, () => props.balanceMap);

function onDragStart(accountId: number, fromGroupId: number | null): void {
  draggingAccountId.value = accountId; draggingFromGroup.value = fromGroupId;
}

function onDropGroup(targetGroupId: number): void {
  if (draggingAccountId.value !== null && draggingFromGroup.value !== targetGroupId)
    emit('assignAccount', draggingAccountId.value, targetGroupId);
  draggingAccountId.value = null; draggingFromGroup.value = null;
}

function onDropUnassigned(): void {
  if (draggingAccountId.value !== null && draggingFromGroup.value !== null)
    emit('assignAccount', draggingAccountId.value, null);
  draggingAccountId.value = null; draggingFromGroup.value = null;
}
</script>
