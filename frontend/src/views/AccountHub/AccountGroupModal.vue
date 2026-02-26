<template>
  <BaseModal
    :open="open"
    :title="title"
    size="large"
    @close="handleClose"
  >
    <div v-if="displayError" class="error-banner mb-4">
      <span>{{ displayError }}</span>
    </div>

    <!-- Group name combobox -->
    <div class="mb-5">
      <label class="block text-xs font-600 tracking-widest uppercase text-muted mb-2">Group Name</label>
      <input
        v-model="groupName"
        type="text"
        :list="type === 'create' ? 'existing-groups-list' : undefined"
        class="form-input"
        :placeholder="type === 'create' ? 'Type a new name or pick an existing group…' : ''"
        @input="onGroupNameInput"
        @keyup.enter="handleSave"
      />
      <datalist v-if="type === 'create'" id="existing-groups-list">
        <option v-for="group in availableGroups" :key="group.id" :value="group.name" />
      </datalist>
    </div>

    <!-- Account Selection -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-3">
          <label class="text-xs font-600 tracking-widest uppercase text-muted">Accounts</label>
          <span v-if="hideGrouped && hiddenCount > 0" class="text-xs text-muted">({{ hiddenCount }} in other groups hidden)</span>
        </div>
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 cursor-pointer select-none text-sm text-muted">
            <span>Hide grouped</span>
            <button
              type="button"
              role="switch"
              :aria-checked="hideGrouped"
              class="toggle-switch"
              :class="hideGrouped ? 'toggle-switch--on' : 'toggle-switch--off'"
              @click="hideGrouped = !hideGrouped"
            />
          </label>
          <span v-if="selectedAccountIds.size > 0" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-600 bg-blue-100 text-blue-700">
            {{ selectedAccountIds.size }} selected
          </span>
        </div>
      </div>
      <input
        v-model="searchQuery"
        type="text"
        class="form-input mb-3"
        placeholder="Search by name or institution..."
      />

      <div class="rounded-xl border border-border overflow-hidden" style="max-height: 340px; overflow-y: auto;">
        <table class="w-full border-collapse">
          <thead class="sticky top-0 z-10 bg-gray-50">
            <tr>
              <th class="w-10 py-3 px-3 text-center border-b border-border">
                <input
                  type="checkbox"
                  :checked="allFilteredSelected"
                  :indeterminate="someFilteredSelected && !allFilteredSelected"
                  class="cursor-pointer accent-blue-600"
                  title="Select all"
                  @change="toggleAllFiltered"
                />
              </th>
              <th class="py-3 px-4 text-left text-xs font-600 tracking-widest uppercase text-muted border-b border-border">Institution</th>
              <th class="py-3 px-4 text-left text-xs font-600 tracking-widest uppercase text-muted border-b border-border">Account Name</th>
              <th class="py-3 px-4 text-left text-xs font-600 tracking-widest uppercase text-muted border-b border-border">Type</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredItems"
              :key="item.account.id"
              class="cursor-pointer border-b border-border transition-colors last:border-b-0"
              :class="selectedAccountIds.has(item.account.id)
                ? 'bg-blue-50 hover:bg-blue-100'
                : 'bg-white hover:bg-gray-50'"
              @click="toggleAccount(item.account.id)"
            >
              <td class="w-10 py-3 px-3 text-center" @click.stop="toggleAccount(item.account.id)">
                <input
                  type="checkbox"
                  :checked="selectedAccountIds.has(item.account.id)"
                  class="cursor-pointer accent-blue-600"
                  @change.prevent
                />
              </td>
              <td class="py-3 px-4 text-sm text-text-dark">{{ item.institution?.name || '—' }}</td>
              <td class="py-3 px-4 text-sm font-600 text-text-dark">{{ item.account.name }}</td>
              <td class="py-3 px-4 text-sm text-muted">{{ item.accountType || '—' }}</td>
            </tr>
            <tr v-if="filteredItems.length === 0">
              <td colspan="4" class="py-10 text-center text-sm text-muted">No accounts found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template #footer>
      <!-- Delete on the left, Cancel/Save on the right -->
      <button
        v-if="targetGroupId"
        type="button"
        class="btn btn-danger mr-auto"
        @click="handleDelete"
      >
        Delete Group
      </button>
      <button type="button" class="btn-modal-secondary" @click="handleClose">Cancel</button>
      <button type="button" class="btn btn-primary" @click="handleSave">
        {{ saveLabel }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { PortfolioItem, AccountGroup, ReferenceDataItem } from '@/models/WealthTrackDataModels';
import BaseModal from '@/components/BaseModal.vue';

interface Props {
  open: boolean;
  type: 'create' | 'edit';
  items: PortfolioItem[];
  accountTypes: ReferenceDataItem[];
  availableGroups: AccountGroup[];
  groupMembersMap: Map<number, number[]>;
  apiError?: string | null;
  initialGroupName?: string;
  initialGroupId?: number;
  initialMemberIds?: number[];
}

interface Emits {
  close: [];
  save: [data: { name: string; accountIds: number[]; groupId?: number }];
  deleteGroup: [groupId: number];
}

const props = withDefaults(defineProps<Props>(), {
  availableGroups: () => [],
  groupMembersMap: () => new Map(),
  apiError: null,
  initialGroupName: '',
  initialGroupId: 0,
  initialMemberIds: () => [],
});

const emit = defineEmits<Emits>();

const groupName = ref(props.initialGroupName);
const selectedGroupId = ref<number | undefined>(undefined);
const searchQuery = ref('');
const hideGrouped = ref(true);
const error = ref('');
const selectedAccountIds = ref(new Set<number>(props.initialMemberIds));

watch(() => props.open, (newOpen) => {
  if (newOpen) {
    groupName.value = props.initialGroupName;
    selectedGroupId.value = undefined;
    selectedAccountIds.value = new Set(props.initialMemberIds || []);
    searchQuery.value = '';
    error.value = '';
  }
});

// When availableGroups updates, check if the group we were working with has been deleted
watch(() => props.availableGroups, (newGroups) => {
  const activeId = selectedGroupId.value ?? (props.type === 'edit' ? props.initialGroupId : undefined);
  if (activeId && !newGroups.find(g => g.id === activeId)) {
    groupName.value = '';
    selectedGroupId.value = undefined;
    selectedAccountIds.value = new Set();
    error.value = '';
  }
});

// The group ID we're operating on (edit mode uses initialGroupId, create mode uses combobox selection)
const targetGroupId = computed(() =>
  props.type === 'edit' ? props.initialGroupId : selectedGroupId.value
);

const onGroupNameInput = () => {
  if (props.type !== 'create') return;
  const match = props.availableGroups.find(g => g.name === groupName.value);
  if (match) {
    selectedGroupId.value = match.id;
    selectedAccountIds.value = new Set(props.groupMembersMap.get(match.id) || []);
  } else {
    selectedGroupId.value = undefined;
  }
};

const title = computed(() =>
  props.type === 'create' ? 'Create Account Group' : 'Edit Account Group'
);

const saveLabel = computed(() =>
  (props.type === 'edit' || selectedGroupId.value) ? 'Save Changes' : 'Create Group'
);

const displayError = computed(() => error.value || props.apiError || '');

// All account IDs that belong to any group (by ID, not name)
const allGroupedIds = computed(() => {
  const ids = new Set<number>();
  props.groupMembersMap.forEach(memberIds => memberIds.forEach(id => ids.add(id)));
  return ids;
});

// How many accounts are hidden because they're in another group (and not selected)
const hiddenCount = computed(() =>
  props.items.filter(item =>
    allGroupedIds.value.has(item.account.id) &&
    !selectedAccountIds.value.has(item.account.id)
  ).length
);

const filteredItems = computed(() => {
  let items = props.items;

  if (hideGrouped.value) {
    items = items.filter(item =>
      !allGroupedIds.value.has(item.account.id) ||
      selectedAccountIds.value.has(item.account.id)
    );
  }

  if (!searchQuery.value.trim()) return items;
  const query = searchQuery.value.toLowerCase();
  return items.filter(item =>
    item.account.name.toLowerCase().includes(query) ||
    item.institution?.name?.toLowerCase().includes(query)
  );
});

const allFilteredSelected = computed(() =>
  filteredItems.value.length > 0 &&
  filteredItems.value.every(item => selectedAccountIds.value.has(item.account.id))
);

const someFilteredSelected = computed(() =>
  filteredItems.value.some(item => selectedAccountIds.value.has(item.account.id))
);

const toggleAllFiltered = () => {
  if (allFilteredSelected.value) {
    filteredItems.value.forEach(item => selectedAccountIds.value.delete(item.account.id));
  } else {
    filteredItems.value.forEach(item => selectedAccountIds.value.add(item.account.id));
  }
};

const toggleAccount = (accountId: number) => {
  if (selectedAccountIds.value.has(accountId)) {
    selectedAccountIds.value.delete(accountId);
  } else {
    selectedAccountIds.value.add(accountId);
  }
};

const handleSave = () => {
  error.value = '';
  if (!groupName.value.trim()) {
    error.value = 'Please enter a group name';
    return;
  }
  emit('save', {
    name: groupName.value.trim(),
    accountIds: Array.from(selectedAccountIds.value),
    groupId: selectedGroupId.value,
  });
};

const handleDelete = () => {
  if (targetGroupId.value) {
    emit('deleteGroup', targetGroupId.value);
  }
};

const handleClose = () => emit('close');
</script>

<style scoped>
.toggle-switch {
  position: relative;
  width: 36px;
  height: 20px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;
}
.toggle-switch::after {
  content: '';
  position: absolute;
  top: 3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  transition: left 0.2s;
}
.toggle-switch--on {
  background-color: #3b82f6;
}
.toggle-switch--on::after {
  left: 19px;
}
.toggle-switch--off {
  background-color: #cbd5e1;
}
.toggle-switch--off::after {
  left: 3px;
}
</style>
