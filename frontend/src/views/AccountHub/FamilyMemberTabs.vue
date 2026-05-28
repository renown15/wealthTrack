<template>
  <div class="flex gap-1 border-b border-gray-200 mb-4">
    <button
      type="button"
      class="px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors"
      :class="activeId === null ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
      @click="$emit('select', null)"
    >Me</button>
    <button
      type="button"
      class="px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors"
      :class="activeId === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
      @click="$emit('select', 'all')"
    >All</button>
    <button
      v-for="m in members"
      :key="m.accountId"
      type="button"
      class="px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors"
      :class="activeId === m.accountId ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
      @click="$emit('select', m.accountId)"
    >{{ m.firstName }} {{ m.lastName }}</button>
  </div>
</template>

<script setup lang="ts">
import type { FamilyMember } from '@models/family';
import type { TabMode } from '@composables/useFamilyTabs';
defineProps<{ members: FamilyMember[]; activeId: TabMode }>();
defineEmits<{ select: [id: TabMode] }>();
</script>
