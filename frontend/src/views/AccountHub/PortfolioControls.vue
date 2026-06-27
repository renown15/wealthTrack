<template>
  <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
    <h3 class="section-title">Portfolio</h3>
    <div class="flex flex-wrap items-center gap-3">
      <input
        :value="search"
        type="search"
        placeholder="Search name, institution, acc no, sort code…"
        class="px-3 py-1.5 border border-gray-300 rounded text-xs w-44 sm:w-72"
        @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
      />
      <div class="flex items-center gap-2">
        <span class="text-xs font-medium text-gray-700">Hide Closed</span>
        <button class="relative w-10 h-5 rounded-full transition-colors duration-200 border-none cursor-pointer" :class="hideClosed ? 'bg-blue-600' : 'bg-gray-300'" @click="$emit('toggle-hide-closed')" title="Toggle closed accounts">
          <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200" :class="hideClosed ? 'translate-x-5' : 'translate-x-0'" />
        </button>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs font-medium text-gray-700">Grouped</span>
        <button class="relative w-10 h-5 rounded-full transition-colors duration-200 border-none cursor-pointer" :class="grouped ? 'bg-blue-600' : 'bg-gray-300'" @click="$emit('toggle-grouped')" title="Toggle grouping">
          <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200" :class="grouped ? 'translate-x-5' : 'translate-x-0'" />
        </button>
      </div>
      <button
        class="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white border-none rounded text-xs font-medium cursor-pointer transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="refreshing"
        @click="$emit('refresh-prices')"
        title="Clear price cache and fetch latest share prices"
      >{{ refreshing ? 'Refreshing…' : 'Refresh Prices' }}</button>
      <button class="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white border-none rounded text-xs font-medium cursor-pointer transition-colors hover:bg-blue-600" @click="$emit('export')" title="Export accounts to Excel">
        <span>{{ Icons.download }}</span><span>Excel</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icons } from '@/constants/icons';
defineProps<{ hideClosed: boolean; grouped: boolean; refreshing?: boolean; search?: string }>();
defineEmits<{ 'toggle-hide-closed': []; 'toggle-grouped': []; export: []; 'refresh-prices': []; 'update:search': [value: string] }>();
</script>
