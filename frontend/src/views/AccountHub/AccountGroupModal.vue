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
    <AccountGroupMemberList
      :filtered-items="filteredItems"
      :selected-account-ids="selectedAccountIds"
      :hide-grouped="hideGrouped"
      :hidden-count="hiddenCount"
      :search-query="searchQuery"
      :all-filtered-selected="allFilteredSelected"
      :some-filtered-selected="someFilteredSelected"
      @update:hide-grouped="hideGrouped = $event"
      @update:search-query="searchQuery = $event"
      @toggle-all-filtered="toggleAllFiltered"
      @toggle-account="toggleAccount"
    />

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
import AccountGroupMemberList from '@views/AccountHub/AccountGroupMemberList.vue';

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

watch(() => props.availableGroups, (newGroups) => {
  const activeId = selectedGroupId.value ?? (props.type === 'edit' ? props.initialGroupId : undefined);
  if (activeId && !newGroups.find(g => g.id === activeId)) {
    groupName.value = '';
    selectedGroupId.value = undefined;
    selectedAccountIds.value = new Set();
    error.value = '';
  }
});

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

const allGroupedIds = computed(() => {
  const ids = new Set<number>();
  props.groupMembersMap.forEach(memberIds => memberIds.forEach(id => ids.add(id)));
  return ids;
});

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

<!-- Uses UnoCSS utilities -->
