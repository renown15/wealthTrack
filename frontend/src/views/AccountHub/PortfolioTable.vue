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
            <th class="table-cell table-header text-left sort-header whitespace-nowrap" @click="toggleSort('type')">
              Account Type <span class="sort-icon">{{ sortIcon('type') }}</span>
            </th>
            <th class="table-cell table-header text-left sort-header" @click="toggleSort('balance')">
              Latest Balance <span class="sort-icon">{{ sortIcon('balance') }}</span>
            </th>
            <th class="table-cell table-header text-left sort-header whitespace-nowrap" @click="toggleSort('balanceUpdated')">
              Updated <span class="sort-icon">{{ sortIcon('balanceUpdated') }}</span>
            </th>
            <th class="table-cell table-header text-left sort-header" @click="toggleSort('interestRate')">
              Interest Rate <span class="sort-icon">{{ sortIcon('interestRate') }}</span>
            </th>
            <th class="table-cell table-header text-left sort-header whitespace-nowrap" @click="toggleSort('fixedRateEnd')">
              End Date <span class="sort-icon">{{ sortIcon('fixedRateEnd') }}</span>
            </th>
            <th class="table-cell table-header text-left sort-header" @click="toggleSort('events')">
              Events <span class="sort-icon">{{ sortIcon('events') }}</span>
            </th>
            <th class="table-cell table-header text-left">Docs</th>
            <th class="table-cell table-header text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="row in sortedRows" :key="row.kind === 'group' ? `group-${row.groupId}` : `account-${row.item.account.id}`">
            <PortfolioTableGroupRow
              v-if="row.kind === 'group'"
              :group-id="row.groupId"
              :name="row.name"
              :items="row.items"
              :summary="row.summary"
              :is-expanded="expandedGroups.has(row.groupId)"
              :editing-balance-id="editingBalanceId"
              v-model:editingBalanceValue="editingBalanceValue"
              @toggle-group="toggleGroup"
              @edit-group="(id, n) => $emit('editGroup', id, n)"
              @delete-group="(id) => $emit('deleteGroup', id)"
              @save-balance="saveBalance"
              @cancel-edit="cancelEdit"
              @start-edit="startEdit"
              @show-events="emitShowEvents"
              @show-docs="emitShowDocs"
              @edit-account="(a) => $emit('editAccount', a)"
              @delete-account="(a) => $emit('deleteAccount', a)"
            />
            <PortfolioTableAccountRow
              v-else
              :item="row.item"
              :editing-balance-id="editingBalanceId"
              v-model:editingBalanceValue="editingBalanceValue"
              @save-balance="saveBalance"
              @cancel-edit="cancelEdit"
              @start-edit="startEdit"
              @show-events="emitShowEvents"
              @show-docs="emitShowDocs"
              @edit-account="(a) => $emit('editAccount', a)"
              @delete-account="(a) => $emit('deleteAccount', a)"
            />
          </template>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { Account, PortfolioItem, AccountGroup } from '@/models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import { getGroupSummary, getSortVal, type SortCol, type GroupRow, type AccountRow, type TableRow } from '@views/AccountHub/portfolioTableUtils';
import { useBalanceEditing } from '@views/AccountHub/useBalanceEditing';
import PortfolioTableGroupRow from '@views/AccountHub/PortfolioTableGroupRow.vue';
import PortfolioTableAccountRow from '@views/AccountHub/PortfolioTableAccountRow.vue';

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
  showEvents: [accountId: number, accountName: string, eventCount: number, accountType: string];
  showDocs: [accountId: number, accountName: string];
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

const emitShowEvents = (item: PortfolioItem): void => {
  const accountType = props.accountTypes.find(t => t.id === item.account.typeId)?.referenceValue || 'Unknown';
  emit('showEvents', item.account.id, item.account.name, item.eventCount ?? 0, accountType);
};

const emitShowDocs = (item: PortfolioItem): void => {
  emit('showDocs', item.account.id, item.account.name);
};


const ungroupedAccountIds = computed(() => {
  const ids = new Set<number>();
  props.groupMembers.forEach(memberIds => memberIds.forEach(id => ids.add(id)));
  return ids;
});


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
  return [...rows].sort((a, b) => {
    const av = getSortVal(a, col);
    const bv = getSortVal(b, col);
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
