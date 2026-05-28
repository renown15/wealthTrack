<template>
  <BaseModal :open="open" title="Manage Family" size="medium" @close="$emit('close')">
    <div v-if="state.error" class="error-banner mb-4">
      <span>{{ state.error }}</span>
    </div>

    <div v-if="state.loading" class="text-center py-4 text-muted text-sm">Loading…</div>

    <!-- No family yet -->
    <template v-else-if="!state.family">
      <p class="text-sm text-muted mb-4">You don't belong to a family yet. Create one to share your portfolio with family members.</p>
      <label class="block text-xs font-600 tracking-widest uppercase text-muted mb-2">Family Name</label>
      <input
        v-model="newFamilyName"
        type="text"
        class="form-input mb-4"
        placeholder="e.g. The Smiths"
        @keyup.enter="handleCreate"
      />
    </template>

    <!-- Family exists -->
    <template v-else>
      <!-- Name row -->
      <div class="flex items-center gap-2 mb-5">
        <div v-if="!renaming" class="flex-1">
          <span class="text-base font-semibold text-gray-900">{{ state.family.name }}</span>
        </div>
        <input
          v-else
          v-model="editName"
          type="text"
          class="form-input flex-1"
          @keyup.enter="handleRename"
          @keyup.escape="renaming = false"
        />
        <button
          v-if="state.family.isOwner && !renaming"
          type="button"
          class="btn btn-secondary btn-sm"
          @click="startRename"
        >
          Rename
        </button>
        <button
          v-if="renaming"
          type="button"
          class="btn btn-primary btn-sm"
          @click="handleRename"
        >
          Save
        </button>
        <button
          v-if="renaming"
          type="button"
          class="btn-modal-secondary btn-sm"
          @click="renaming = false"
        >
          Cancel
        </button>
      </div>

      <!-- Members -->
      <h3 class="text-xs font-600 tracking-widest uppercase text-muted mb-2">Members</h3>
      <ul class="divide-y divide-gray-100 mb-4">
        <li v-for="member in state.family.members" :key="member.id" class="flex items-center justify-between py-2">
          <div>
            <span class="text-sm font-medium text-gray-900">{{ member.firstName }} {{ member.lastName }}</span>
            <span class="text-xs text-muted ml-2">{{ member.email }}</span>
            <span v-if="member.accountId === state.family.ownerId" class="text-xs ml-1 text-blue-600">(owner)</span>
          </div>
          <button
            v-if="state.family.isOwner && member.accountId !== currentUserId"
            type="button"
            class="btn-icon delete inline-flex items-center justify-center w-8 h-8 text-sm rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
            :disabled="state.loading"
            @click="handleRemoveMember(member.id)"
          >×</button>
        </li>
      </ul>

      <!-- Add member (owner only) -->
      <div v-if="state.family.isOwner && state.availableMembers.length > 0" class="mt-4">
        <label class="block text-xs font-600 tracking-widest uppercase text-muted mb-2">Add Member</label>
        <div class="flex gap-2">
          <select v-model="selectedMemberId" class="form-input flex-1">
            <option :value="null" disabled>Select a user…</option>
            <option
              v-for="user in state.availableMembers"
              :key="user.id"
              :value="user.id"
            >
              {{ user.firstName }} {{ user.lastName }} — {{ user.email }}
            </option>
          </select>
          <button
            type="button"
            class="btn btn-primary btn-sm flex-shrink-0"
            :disabled="selectedMemberId === null || state.loading"
            @click="handleAddMember"
          >
            Add
          </button>
        </div>
      </div>
      <p v-else-if="state.family.isOwner && state.availableMembers.length === 0" class="text-xs text-muted mt-4">
        No other registered users available to add.
      </p>
    </template>

    <template #footer>
      <button
        v-if="state.family?.isOwner"
        type="button"
        class="btn btn-danger mr-auto"
        :disabled="state.loading"
        @click="handleDelete"
      >
        Delete Family
      </button>
      <button type="button" class="btn-modal-secondary" @click="$emit('close')">Close</button>
      <button
        v-if="!state.family"
        type="button"
        class="btn btn-primary"
        :disabled="!newFamilyName.trim() || state.loading"
        @click="handleCreate"
      >
        Create Family
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import BaseModal from '@components/BaseModal.vue';
import { useFamily } from '@composables/useFamily';

const props = defineProps<{ open: boolean; currentUserId: number }>();
defineEmits<{ close: [] }>();

const { state, loadFamily, createFamily, renameFamily, deleteFamily, loadAvailableMembers, addMember, removeMember } = useFamily();

const newFamilyName = ref('');
const renaming = ref(false);
const editName = ref('');
const selectedMemberId = ref<number | null>(null);

onMounted(async () => {
  await loadFamily();
  if (state.family) await loadAvailableMembers();
});

watch(() => props.open, async (val) => {
  if (val) {
    await loadFamily();
    if (state.family) await loadAvailableMembers();
    newFamilyName.value = '';
    renaming.value = false;
    selectedMemberId.value = null;
  }
});

const startRename = () => {
  editName.value = state.family?.name ?? '';
  renaming.value = true;
};

const handleCreate = async () => {
  if (!newFamilyName.value.trim()) return;
  await createFamily(newFamilyName.value.trim());
  if (state.family) {
    newFamilyName.value = '';
    await loadAvailableMembers();
  }
};

const handleRename = async () => {
  if (!editName.value.trim()) return;
  await renameFamily(editName.value.trim());
  renaming.value = false;
};

const handleDelete = async () => {
  await deleteFamily();
};

const handleAddMember = async () => {
  if (selectedMemberId.value === null) return;
  await addMember(selectedMemberId.value);
  selectedMemberId.value = null;
};

const handleRemoveMember = async (memberId: number) => {
  await removeMember(memberId);
};
</script>
