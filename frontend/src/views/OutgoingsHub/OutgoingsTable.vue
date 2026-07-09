<template>
  <div>
    <div v-if="loading" class="text-muted text-sm">Loading…</div>
    <div v-else-if="error" class="error-banner"><span>{{ error }}</span></div>
    <div v-else-if="items.length === 0" class="text-muted text-sm py-4">No outgoings added yet. Use <strong>+ Add Outgoing</strong> above to get started.</div>

    <table v-else class="w-full text-sm">
      <thead>
        <tr class="border-b">
          <th class="table-header text-left">Provider</th>
          <th class="table-header text-left">Name</th>
          <th class="table-header text-left">Type</th>
          <th class="table-header text-left">Policy / Account No.</th>
          <th class="table-header text-left">Cost</th>
          <th class="table-header text-left">Renewal Type</th>
          <th class="table-header text-left">Renewal Date</th>
          <th class="table-header text-center">Docs</th>
          <th class="table-header"></th>
        </tr>
      </thead>
      <tbody>
        <OutgoingsTableRow
          v-for="item in items"
          :key="item.account.id"
          :item="item"
          :read-only="readOnly"
          :projected-cost="projections?.[item.account.id]"
          @edit="emit('editAccount', $event)"
          @delete="emit('deleteAccount', $event)"
          @show-docs="emit('showDocs', $event)"
          @show-actuals="emit('showActuals', $event)"
        />
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { PortfolioItem } from '@models/WealthTrackDataModels';
import OutgoingsTableRow from '@views/OutgoingsHub/OutgoingsTableRow.vue';

defineProps<{
  items: PortfolioItem[];
  loading: boolean;
  error: string | null;
  readOnly?: boolean;
  projections?: Record<number, string>;
}>();

const emit = defineEmits<{
  editAccount: [item: PortfolioItem];
  deleteAccount: [item: PortfolioItem];
  showDocs: [item: PortfolioItem];
  showActuals: [item: PortfolioItem];
}>();
</script>
