<template>
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
            class="relative w-9 h-5 rounded-[10px] border-none cursor-pointer transition-colors duration-200 flex-shrink-0"
            :class="hideGrouped ? 'bg-blue-500' : 'bg-slate-300'"
            @click="$emit('update:hideGrouped', !hideGrouped)"
          >
            <span
              class="absolute top-[3px] w-3.5 h-3.5 bg-white rounded-full transition-all duration-200"
              :class="hideGrouped ? 'left-[19px]' : 'left-[3px]'"
            />
          </button>
        </label>
        <span v-if="selectedAccountIds.size > 0" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-600 bg-blue-100 text-blue-700">
          {{ selectedAccountIds.size }} selected
        </span>
      </div>
    </div>
    <input
      :value="searchQuery"
      @input="(e) => $emit('update:searchQuery', (e.target as HTMLInputElement).value)"
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
                @change="$emit('toggleAllFiltered')"
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
            @click="$emit('toggleAccount', item.account.id)"
          >
            <td class="w-10 py-3 px-3 text-center" @click.stop="$emit('toggleAccount', item.account.id)">
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
</template>

<script setup lang="ts">
import type { PortfolioItem } from '@/models/WealthTrackDataModels';

defineProps<{
  filteredItems: PortfolioItem[];
  selectedAccountIds: Set<number>;
  hideGrouped: boolean;
  hiddenCount: number;
  searchQuery: string;
  allFilteredSelected: boolean;
  someFilteredSelected: boolean;
}>();

defineEmits<{
  'update:hideGrouped': [value: boolean];
  'update:searchQuery': [value: string];
  toggleAllFiltered: [];
  toggleAccount: [accountId: number];
}>();
</script>
