<template>
  <div v-if="open" class="modal-overlay" @mousedown.self="emit('close')">
    <div class="modal-content" @click.stop>
      <header class="modal-header">
        <h2 class="modal-title">Actual Costs — {{ accountName }}</h2>
        <button class="btn-close" @click="emit('close')">×</button>
      </header>

      <div class="modal-body">
        <p class="text-xs text-muted mb-3">
          Record what each period actually cost. The projected cost is the average of the
          last 12 months of actuals.
        </p>

        <div class="flex items-end gap-2 mb-4">
          <div class="form-group flex-1 mb-0">
            <label for="actualDate" class="form-label">Period Date</label>
            <input id="actualDate" v-model="newDate" type="date" class="form-input" />
          </div>
          <div class="form-group flex-1 mb-0">
            <label for="actualAmount" class="form-label">Amount (£)</label>
            <input
              id="actualAmount" v-model="newAmount" type="text" inputmode="decimal"
              class="form-input" placeholder="e.g., 142.50"
            />
          </div>
          <button class="btn-primary" :disabled="!canAdd" @click="handleAdd">Add</button>
        </div>

        <div v-if="error" class="error-banner mb-3"><span>{{ error }}</span></div>
        <div v-if="loading" class="text-muted text-sm">Loading…</div>
        <div v-else-if="actuals.length === 0" class="text-muted text-sm py-2">
          No actuals recorded yet.
        </div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="table-header text-left">Date</th>
              <th class="table-header text-right">Amount</th>
              <th class="table-header"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in actuals" :key="a.groupId" class="border-b">
              <td class="table-cell">{{ formatDate(a.costDate) }}</td>
              <td class="table-cell text-right">{{ formatGbp(a.amount) }}</td>
              <td class="table-cell text-right">
                <button
                  class="btn-icon delete inline-flex items-center justify-center w-7 h-7 text-xs rounded border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
                  title="Delete"
                  @click="handleDelete(a.groupId)"
                >{{ Icons.delete }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="modal-footer">
        <button class="btn-modal-secondary" @click="emit('close')">Close</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useActualCosts } from '@composables/useActualCosts';
import { Icons } from '@/constants/icons';

const props = defineProps<{
  open: boolean;
  accountId: number;
  accountName: string;
}>();

const emit = defineEmits<{
  close: [];
  changed: [];
}>();

const { actuals, loading, error, loadActuals, addActual, removeActual } = useActualCosts();
const newDate = ref('');
const newAmount = ref('');

const canAdd = computed(() => newDate.value !== '' && newAmount.value.trim() !== '');

watch(() => props.open, (open) => {
  if (open) {
    newDate.value = '';
    newAmount.value = '';
    void loadActuals(props.accountId);
  }
}, { immediate: true });

async function handleAdd(): Promise<void> {
  const ok = await addActual(props.accountId, newAmount.value.trim(), newDate.value);
  if (ok) {
    newDate.value = '';
    newAmount.value = '';
    emit('changed');
  }
}

async function handleDelete(groupId: number): Promise<void> {
  const ok = await removeActual(groupId);
  if (ok) emit('changed');
}

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatGbp(value: string): string {
  const v = parseFloat(value);
  if (isNaN(v)) return value;
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v);
}
</script>
