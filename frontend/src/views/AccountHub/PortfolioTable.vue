<template>
  <section>
    <div class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th class="table-cell table-header text-left w-8">
              <!-- expand column -->
            </th>
            <th class="table-cell table-header text-left sort-header" @click="toggleSort('institution')">
              Institution <span class="sort-icon">{{ sortIcon('institution') }}</span>
            </th>
            <th class="table-cell table-header text-left sort-header" @click="toggleSort('name')">
              Account Name <span class="sort-icon">{{ sortIcon('name') }}</span>
            </th>
            <th class="table-cell table-header text-left sort-header" @click="toggleSort('type')">
              Account Type <span class="sort-icon">{{ sortIcon('type') }}</span>
            </th>
            <th class="table-cell table-header text-left sort-header" @click="toggleSort('balance')">
              Latest Balance <span class="sort-icon">{{ sortIcon('balance') }}</span>
            </th>
            <th class="table-cell table-header text-left sort-header" @click="toggleSort('balanceUpdated')">
              Balance Updated <span class="sort-icon">{{ sortIcon('balanceUpdated') }}</span>
            </th>
            <th class="table-cell table-header text-left sort-header" @click="toggleSort('interestRate')">
              Interest Rate <span class="sort-icon">{{ sortIcon('interestRate') }}</span>
            </th>
            <th class="table-cell table-header text-left sort-header" @click="toggleSort('fixedRateEnd')">
              Fixed Rate End <span class="sort-icon">{{ sortIcon('fixedRateEnd') }}</span>
            </th>
            <th class="table-cell table-header text-left sort-header" @click="toggleSort('events')">
              Events <span class="sort-icon">{{ sortIcon('events') }}</span>
            </th>
            <th class="table-cell table-header text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="row in sortedRows" :key="row.kind === 'group' ? `group-${row.groupId}` : `account-${row.item.account.id}`">
            <!-- Group header row -->
            <template v-if="row.kind === 'group'">
              <tr class="table-row-hover cursor-pointer group-row" @click="toggleGroup(row.groupId)">
                <td class="table-cell text-center">
                  <span class="inline-block transition-transform" :class="{ 'rotate-90': expandedGroups.has(row.groupId) }">
                    ▶
                  </span>
                </td>
                <td class="table-cell">{{ row.summary?.commonInstitution || '—' }}</td>
                <td class="table-cell font-semibold">
                  <span v-if="!row.summary?.namesMatch" class="flex items-center justify-between gap-2">
                    <span>📁 {{ row.name }}</span>
                    <span class="inline-flex items-center px-2 py-1 text-xs font-600 bg-blue-100 text-blue-700 rounded">{{ row.items.length }}</span>
                  </span>
                  <span v-else class="flex items-center justify-between gap-2">
                    <span>{{ row.items[0]?.account.name || '—' }}</span>
                    <span class="inline-flex items-center px-2 py-1 text-xs font-600 bg-blue-100 text-blue-700 rounded">{{ row.items.length }}</span>
                  </span>
                </td>
                <td class="table-cell">{{ row.summary?.commonAccountType || '—' }}</td>
                <td class="table-cell font-semibold text-green-700">{{ formatCurrency(row.summary?.totalBalance || 0) }}</td>
                <td class="table-cell">{{ row.summary?.commonBalanceUpdatedAt ? formatDate(row.summary.commonBalanceUpdatedAt) : '—' }}</td>
                <td class="table-cell">
                  <span class="flex items-center gap-1">
                    <span>{{ row.summary?.commonBonusRate !== null && row.summary?.commonInterestRate !== null
                      ? formatInterestRate(row.summary?.commonBonusRate, row.summary?.commonInterestRate)
                      : '—' }}</span>
                    <span v-if="getGroupYieldTooltip(row.items)" class="text-blue-500 opacity-70 hover:opacity-100" :title="getGroupYieldTooltip(row.items)">ℹ️</span>
                  </span>
                </td>
                <td class="table-cell">{{ row.summary?.commonEndDate ? formatDate(row.summary.commonEndDate) : '—' }}</td>
                <td class="table-cell">
                  <span v-if="(row.summary?.totalEvents || 0) > 0" class="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold rounded-lg bg-blue-100 text-blue-600">
                    {{ row.summary?.totalEvents ?? 0 }}
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="table-cell text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      class="btn-icon edit inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                      type="button"
                      @click.stop="$emit('editGroup', row.groupId, row.name)"
                      title="Edit group"
                    >{{ Icons.edit }}</button>
                    <button
                      class="btn-icon delete inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
                      type="button"
                      @click.stop="$emit('deleteGroup', row.groupId)"
                      title="Delete group"
                    >{{ Icons.delete }}</button>
                  </div>
                </td>
              </tr>
              <!-- Group member rows -->
              <tr
                v-for="(item, idx) in row.items"
                v-show="expandedGroups.has(row.groupId)"
                :key="`member-${item.account.id}`"
                class="table-row-hover bg-gray-100"
                :class="{ 'first-member': idx === 0 }"
              >
                <td class="table-cell"></td>
                <td class="table-cell">{{ item.institution?.name || 'Unassigned' }}</td>
                <td class="table-cell font-semibold">{{ item.account.name }}</td>
                <td class="table-cell">{{ item.accountType || 'Unknown' }}</td>
                <td class="table-cell">
                  <div v-if="editingBalanceId === item.account.id && !isDeferredShares(item) && !isRSU(item)" class="balance-edit">
                    <input
                      v-model="editingBalanceValue"
                      type="text"
                      inputmode="decimal"
                      class="balance-input form-input py-1 px-2 w-28 text-sm"
                      @keydown.enter.prevent="saveBalance(item.account.id)"
                      @keydown.escape="cancelEdit"
                    />
                  </div>
                  <button
                    v-if="!isDeferredShares(item) && !isRSU(item)"
                    type="button"
                    class="flex items-center gap-1 text-left bg-transparent border-none cursor-pointer group"
                    @click.stop="startEdit(item.account.id, getEditValue(item))"
                  >
                    <span class="font-semibold text-green-600">{{ formatCurrency(getDisplayBalance(item)) }}</span>
                    <span v-if="isDeferredCash(item)" class="text-blue-500 opacity-70 hover:opacity-100" :title="getDeferredTooltip(item)">ℹ️</span>
                    <span class="text-muted opacity-0 group-hover:opacity-100 transition-opacity">{{ Icons.edit }}</span>
                  </button>
                  <div v-else class="flex items-center gap-1">
                    <div class="font-semibold text-green-600">{{ formatCurrency(getDisplayBalance(item)) }}</div>
                    <span v-if="getDeferredTooltip(item)" class="text-blue-500 opacity-70 hover:opacity-100" :title="getDeferredTooltip(item)">ℹ️</span>
                  </div>
                </td>
                <td class="table-cell text-gray-600">{{ formatDate(item.latestBalance?.createdAt) }}</td>
                <td class="table-cell">
                  <span class="flex items-center gap-1">
                    <span>{{ formatInterestRate(item.account.fixedBonusRate, item.account.interestRate) }}</span>
                    <span v-if="getYieldTooltip(item)" class="text-blue-500 opacity-70 hover:opacity-100" :title="getYieldTooltip(item)">ℹ️</span>
                  </span>
                </td>
                <td class="table-cell">{{ formatDate(getFixedRateEndDate(item)) }}</td>
                <td class="table-cell">
                  <button
                    class="btn-events inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                    type="button"
                    @click="$emit('showEvents', item.account.id, item.account.name, item.eventCount ?? 0)"
                  >{{ item.eventCount ?? 0 }}</button>
                </td>
                <td class="table-cell">
                  <div class="actions-col">
                    <button
                      class="btn-icon edit inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                      type="button"
                      @click="$emit('editAccount', item.account)"
                      title="Edit account"
                    >{{ Icons.edit }}</button>
                    <button
                      class="btn-icon delete inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
                      type="button"
                      @click="$emit('deleteAccount', item.account)"
                      title="Delete account"
                    >{{ Icons.delete }}</button>
                  </div>
                </td>
              </tr>
            </template>

            <!-- Ungrouped account row -->
            <tr v-else class="table-row-hover">
              <td class="table-cell"></td>
              <td class="table-cell">{{ row.item.institution?.name || 'Unassigned' }}</td>
              <td class="table-cell font-semibold">{{ row.item.account.name }}</td>
              <td class="table-cell">{{ row.item.accountType || 'Unknown' }}</td>
              <td class="table-cell">
                <div v-if="editingBalanceId === row.item.account.id && !isDeferredShares(row.item) && !isRSU(row.item)" class="balance-edit">
                  <input
                    v-model="editingBalanceValue"
                    type="text"
                    inputmode="decimal"
                    class="balance-input form-input py-1 px-2 w-28 text-sm"
                    @keydown.enter.prevent="saveBalance(row.item.account.id)"
                    @keydown.escape="cancelEdit"
                  />
                </div>
                <button
                  v-if="!isDeferredShares(row.item) && !isRSU(row.item)"
                  type="button"
                  class="flex items-center gap-1 text-left bg-transparent border-none cursor-pointer group"
                  @click.stop="startEdit(row.item.account.id, getEditValue(row.item))"
                >
                  <span class="font-semibold text-green-600">{{ formatCurrency(getDisplayBalance(row.item)) }}</span>
                  <span v-if="isDeferredCash(row.item)" class="text-blue-500 opacity-70 hover:opacity-100" :title="getDeferredTooltip(row.item)">ℹ️</span>
                  <span class="text-muted opacity-0 group-hover:opacity-100 transition-opacity">{{ Icons.edit }}</span>
                </button>
                <div v-else class="flex items-center gap-1">
                  <div class="font-semibold text-green-600">{{ formatCurrency(getDisplayBalance(row.item)) }}</div>
                  <span v-if="getDeferredTooltip(row.item)" class="text-blue-500 opacity-70 hover:opacity-100" :title="getDeferredTooltip(row.item)">ℹ️</span>
                </div>
              </td>
              <td class="table-cell text-gray-600">{{ formatDate(row.item.latestBalance?.createdAt) }}</td>
              <td class="table-cell">
                <span class="flex items-center gap-1">
                  <span>{{ formatInterestRate(row.item.account.fixedBonusRate, row.item.account.interestRate) }}</span>
                  <span v-if="getYieldTooltip(row.item)" class="text-blue-500 opacity-70 hover:opacity-100" :title="getYieldTooltip(row.item)">ℹ️</span>
                </span>
              </td>
              <td class="table-cell">{{ formatDate(getFixedRateEndDate(row.item)) }}</td>
              <td class="table-cell">
                <button
                  class="btn-events inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                  type="button"
                  @click="$emit('showEvents', row.item.account.id, row.item.account.name, row.item.eventCount ?? 0)"
                >{{ row.item.eventCount ?? 0 }}</button>
              </td>
              <td class="table-cell">
                <div class="actions-col">
                  <button
                    class="btn-icon edit inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                    type="button"
                    @click="$emit('editAccount', row.item.account)"
                    title="Edit account"
                  >{{ Icons.edit }}</button>
                  <button
                    class="btn-icon delete inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
                    type="button"
                    @click="$emit('deleteAccount', row.item.account)"
                    title="Delete account"
                  >{{ Icons.delete }}</button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { Account, PortfolioItem, AccountGroup, ReferenceDataItem } from '@/models/WealthTrackDataModels';
import {
  isDeferredShares,
  isDeferredCash,
  isRSU,
  getFixedRateEndDate,
  getEditValue,
  getDeferredTooltip,
  getDisplayBalance,
  getYieldTooltip,
  getGroupYieldTooltip,
} from '@views/AccountHub/accountDisplayUtils';
import {
  formatCurrency,
  formatDate,
  formatInterestRate,
} from '@views/AccountHub/formattingUtils';
import { useBalanceEditing } from '@views/AccountHub/useBalanceEditing';
import { Icons } from '@/constants/icons';

type SortCol = 'institution' | 'name' | 'type' | 'balance' | 'balanceUpdated' | 'interestRate' | 'fixedRateEnd' | 'events';
type SortDir = 'asc' | 'desc';

interface Props {
  items: PortfolioItem[];
  groups: AccountGroup[];
  groupMembers: Map<number, number[]>;
  accountTypes: ReferenceDataItem[];
  grouped?: boolean;
}

interface Emits {
  editAccount: [account: Account];
  deleteAccount: [account: Account];
  editGroup: [groupId: number, groupName: string];
  deleteGroup: [groupId: number];
  showEvents: [accountId: number, accountName: string, eventCount: number];
  updateBalance: [accountId: number, value: string];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const expandedGroups = reactive(new Set<number>());
const sortCol = ref<SortCol | null>(null);
const sortDir = ref<SortDir>('asc');

const {
  editingBalanceId,
  editingBalanceValue,
  startEdit,
  cancelEdit,
  saveBalance: onSaveBalance,
} = useBalanceEditing();

const toggleGroup = (groupId: number) => {
  if (expandedGroups.has(groupId)) {
    expandedGroups.delete(groupId);
  } else {
    expandedGroups.add(groupId);
  }
};

const toggleSort = (col: SortCol) => {
  if (sortCol.value === col) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortCol.value = col;
    sortDir.value = 'asc';
  }
};

const sortIcon = (col: SortCol): string => {
  if (sortCol.value !== col) return '↕';
  return sortDir.value === 'asc' ? '↑' : '↓';
};

const getGroupSummary = (groupItems: PortfolioItem[]) => {
  if (groupItems.length === 0) return null;

  const totalBalance = groupItems.reduce((sum, item) => {
    const balance = getDisplayBalance(item);
    return sum + (typeof balance === 'number' ? balance : 0);
  }, 0);

  const institutions = groupItems.map(item => item.institution?.name).filter(Boolean);
  const commonInstitution = institutions.length > 0 && institutions.every(i => i === institutions[0])
    ? institutions[0] : null;

  const accountTypes = groupItems.map(item => item.accountType);
  const commonAccountType = accountTypes.every(t => t === accountTypes[0]) ? accountTypes[0] : null;

  const interestRates = groupItems.map(item => item.account.interestRate);
  const commonInterestRate = interestRates.every(r => r === interestRates[0]) ? interestRates[0] : null;

  const bonusRates = groupItems.map(item => item.account.fixedBonusRate);
  const commonBonusRate = bonusRates.every(r => r === bonusRates[0]) ? bonusRates[0] : null;

  const endDates = groupItems.map(item => getFixedRateEndDate(item));
  const commonEndDate = endDates.every(d => d === endDates[0]) ? endDates[0] : null;

  const totalEvents = groupItems.reduce((sum, item) => sum + (item.eventCount ?? 0), 0);

  const balanceDateParts = groupItems
    .filter(item => item.latestBalance?.createdAt)
    .map(item => {
      const date = new Date(item.latestBalance!.createdAt);
      return `${String(date.getUTCDate()).padStart(2, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${date.getUTCFullYear()}`;
    });

  let commonBalanceUpdatedAt: string | undefined = undefined;
  if (balanceDateParts.length === groupItems.length && balanceDateParts.length > 0) {
    if (balanceDateParts.every(d => d === balanceDateParts[0])) {
      commonBalanceUpdatedAt = groupItems.find(item => item.latestBalance?.createdAt)?.latestBalance?.createdAt;
    }
  }

  const allInstitutionsMatch = institutions.length > 0 && institutions.every(i => i === institutions[0]);
  const accountNames = groupItems.map(item => item.account.name);
  const namesMatch = allInstitutionsMatch && accountNames.every(n => n === accountNames[0]);

  return {
    totalBalance,
    commonInstitution,
    commonAccountType,
    commonInterestRate,
    commonBonusRate,
    commonEndDate,
    commonBalanceUpdatedAt,
    totalEvents,
    namesMatch,
  };
};

const ungroupedAccountIds = computed(() => {
  const ids = new Set<number>();
  props.groupMembers.forEach(memberIds => memberIds.forEach(id => ids.add(id)));
  return ids;
});

type GroupRow = { kind: 'group'; groupId: number; name: string; items: PortfolioItem[]; summary: ReturnType<typeof getGroupSummary> };
type AccountRow = { kind: 'account'; item: PortfolioItem };
type TableRow = GroupRow | AccountRow;

const sortedRows = computed((): TableRow[] => {
  let rows: TableRow[];

  if (props.grouped !== false) {
    const groupRows: GroupRow[] = props.groups
      .map(group => {
        const memberIds = props.groupMembers.get(group.id) || [];
        const items = props.items.filter(item => memberIds.includes(item.account.id));
        return { kind: 'group' as const, groupId: group.id, name: group.name, items, summary: getGroupSummary(items) };
      })
      .filter(r => r.items.length > 0);

    const accountRows: AccountRow[] = props.items
      .filter(item => !ungroupedAccountIds.value.has(item.account.id))
      .map(item => ({ kind: 'account' as const, item }));

    rows = [...groupRows, ...accountRows];
  } else {
    rows = props.items.map(item => ({ kind: 'account' as const, item }));
  }

  if (!sortCol.value) return rows;

  const col = sortCol.value;
  const dir = sortDir.value === 'asc' ? 1 : -1;

  // getDisplayBalance and interestRate can return strings from the API — always coerce to number
  const toNum = (v: string | number | null | undefined): number => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return parseFloat(v) || 0;
    return 0;
  };

  const getSortVal = (row: TableRow): string | number => {
    if (row.kind === 'group') {
      const s = row.summary;
      switch (col) {
        case 'institution':    return (s?.commonInstitution || row.name).toLowerCase();
        case 'name':           return row.name.toLowerCase();
        case 'type':           return (s?.commonAccountType || '').toLowerCase();
        case 'balance':        return s?.totalBalance ?? 0;
        case 'balanceUpdated': return s?.commonBalanceUpdatedAt || '';
        case 'interestRate':   return toNum(s?.commonInterestRate);
        case 'fixedRateEnd':   return s?.commonEndDate || '';
        case 'events':         return s?.totalEvents ?? 0;
      }
    } else {
      const { item } = row;
      switch (col) {
        case 'institution':    return (item.institution?.name || '').toLowerCase();
        case 'name':           return item.account.name.toLowerCase();
        case 'type':           return (item.accountType || '').toLowerCase();
        case 'balance':        return toNum(getDisplayBalance(item));
        case 'balanceUpdated': return item.latestBalance?.createdAt || '';
        case 'interestRate':   return toNum(item.account.interestRate);
        case 'fixedRateEnd':   return getFixedRateEndDate(item) || '';
        case 'events':         return item.eventCount ?? 0;
        default:               return '';
      }
    }
  };

  return [...rows].sort((a, b) => {
    const av = getSortVal(a);
    const bv = getSortVal(b);
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
});

const saveBalance = (accountId: number) => {
  const result = onSaveBalance(accountId);
  if (result.accountId && result.value) {
    emit('updateBalance', result.accountId, result.value);
  }
};
</script>

<!-- Uses UnoCSS shortcuts defined in uno.config.ts -->
