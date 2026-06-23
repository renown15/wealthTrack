<template>
  <div class="page-view">
    <div class="hub-header-card">
      <ScenarioStats
        :scenarios="state.scenarios"
        :selected-id="activeId"
        @create="openCreate"
        @select="selectScenario"
        @rename="openRename"
        @delete="confirmDelete"
      />
    </div>

    <div v-if="state.loading" class="hub-content-card p-6 flex justify-center">
      <div class="spinner"></div>
    </div>

    <template v-else-if="activeId !== null">
      <div v-if="state.detailLoading" class="hub-content-card p-6 flex justify-center">
        <div class="spinner"></div>
      </div>

      <div v-else-if="state.active" class="hub-content-card overflow-hidden">
        <div class="px-6 pt-5 pb-4 border-b border-border">
          <h2 class="text-lg font-bold text-text-dark">{{ state.active.name }}</h2>
          <div class="flex items-center gap-3 mt-3">
            <p v-if="!state.active.isOwner" class="text-xs text-muted">View only</p>
            <button v-if="state.active.isOwner" class="btn-add" @click="openAddGroup">+ Add Group</button>
            <button class="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white border-none rounded text-xs font-medium cursor-pointer hover:bg-blue-600" @click="handleExportExcel">{{ Icons.download }} Excel</button>
            <button class="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white border-none rounded text-xs font-medium cursor-pointer hover:bg-blue-600" @click="handleExportPdf">{{ Icons.download }} PDF</button>
          </div>
        </div>
        <div ref="exportRef" class="p-6">
          <ScenarioGroupTable
            :detail="state.active"
            :balance-map="balanceMap"
            :expand-all="pdfExporting"
            @rename-group="openRenameGroup"
            @delete-group="handleDeleteGroup"
            @assign-account="handleAssign"
          />
        </div>
      </div>
    </template>

    <div v-else-if="state.scenarios.length > 0" class="hub-content-card p-6">
      <div class="empty-state">
        <p class="empty-title">Select a scenario</p>
        <p class="empty-text">Choose a scenario from the panel above to view its groups.</p>
      </div>
    </div>

    <TextPromptModal
      v-model="createName" :open="createOpen" title="New Scenario" label="Name"
      placeholder="e.g. Conservative" submit-label="Create"
      @submit="submitCreate" @close="createOpen = false"
    />
    <TextPromptModal
      v-model="renameName" :open="renameOpen" title="Rename Scenario" label="Name"
      submit-label="Save" @submit="submitRename" @close="renameOpen = false"
    />
    <TextPromptModal
      v-model="groupName" :open="addGroupOpen" title="Add Group" label="Group Name"
      placeholder="e.g. High Risk" submit-label="Add"
      @submit="submitAddGroup" @close="addGroupOpen = false"
    />
    <TextPromptModal
      v-model="renameGroupName" :open="renameGroupOpen" title="Rename Group" label="Group Name"
      submit-label="Save" @submit="submitRenameGroup" @close="renameGroupOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useScenario } from '@composables/useScenario';
import { useScenarioBalances } from '@composables/useScenarioBalances';
import { exportScenarioToExcel } from '@utils/exportToExcel';
import type { ScenarioListItem } from '@models/scenario';
import { Icons } from '@/constants/icons';
import TextPromptModal from '@/components/TextPromptModal.vue';
import ScenarioStats from '@views/ScenarioHub/ScenarioStats.vue';
import ScenarioGroupTable from '@views/ScenarioHub/ScenarioGroupTable.vue';

const { state, loadScenarios, loadDetail, createScenario, renameScenario, deleteScenario,
        addGroup, renameGroup, deleteGroup, assignAccount } = useScenario();
const { balanceMap, portfolioItemsById, loadBalances } = useScenarioBalances();

const activeId = ref<number | null>(null);
const exportRef = ref<HTMLElement | null>(null);
const pdfExporting = ref(false);

const createOpen = ref(false);
const createName = ref('');
const renameOpen = ref(false);
const renameName = ref('');
const renameTarget = ref<ScenarioListItem | null>(null);
const addGroupOpen = ref(false);
const groupName = ref('');
const renameGroupOpen = ref(false);
const renameGroupName = ref('');
const renameGroupLinkId = ref<number | null>(null);

onMounted(async () => {
  await loadScenarios();
  await loadBalances();
});

async function selectScenario(id: number): Promise<void> {
  activeId.value = id;
  await loadDetail(id);
}

function handleExportExcel(): void {
  if (!state.active) return;
  const today = new Date().toISOString().split('T')[0];
  exportScenarioToExcel(
    state.active.name, state.active, portfolioItemsById.value, balanceMap.value,
    `scenario-${state.active.name}-${today}.xlsx`,
  );
}

async function handleExportPdf(): Promise<void> {
  if (!exportRef.value || !state.active) return;
  pdfExporting.value = true;
  await nextTick();
  const today = new Date().toISOString().split('T')[0];
  // Lazy-loaded: jsPDF + html2canvas are heavy and only needed on export.
  const { exportScenarioPdf } = await import('@utils/exportScenarioPdf');
  await exportScenarioPdf(exportRef.value, state.active.name, `scenario-${state.active.name}-${today}.pdf`);
  pdfExporting.value = false;
}

function openCreate(): void { createName.value = ''; createOpen.value = true; }

async function submitCreate(): Promise<void> {
  if (!createName.value.trim()) return;
  const item = await createScenario(createName.value.trim());
  createOpen.value = false;
  if (item) await selectScenario(item.scenarioId);
}

function openRename(s: ScenarioListItem): void {
  renameName.value = s.name; renameTarget.value = s; renameOpen.value = true;
}

async function submitRename(): Promise<void> {
  if (!renameTarget.value || !renameName.value.trim()) return;
  await renameScenario(renameTarget.value.scenarioId, renameName.value.trim());
  renameOpen.value = false;
}

async function confirmDelete(s: ScenarioListItem): Promise<void> {
  if (!confirm(`Delete scenario "${s.name}"?`)) return;
  await deleteScenario(s.scenarioId);
  if (activeId.value === s.scenarioId) activeId.value = null;
}

function openAddGroup(): void { groupName.value = ''; addGroupOpen.value = true; }

async function submitAddGroup(): Promise<void> {
  if (!groupName.value.trim()) return;
  await addGroup(groupName.value.trim());
  addGroupOpen.value = false;
}

function openRenameGroup(linkId: number, currentName: string): void {
  renameGroupLinkId.value = linkId; renameGroupName.value = currentName; renameGroupOpen.value = true;
}

async function submitRenameGroup(): Promise<void> {
  if (!renameGroupLinkId.value || !renameGroupName.value.trim()) return;
  await renameGroup(renameGroupLinkId.value, renameGroupName.value.trim());
  renameGroupOpen.value = false;
}

async function handleDeleteGroup(linkId: number): Promise<void> {
  if (!confirm('Delete this group? Its accounts will become unassigned.')) return;
  await deleteGroup(linkId);
}

async function handleAssign(accountId: number, groupId: number | null): Promise<void> {
  await assignAccount(accountId, groupId);
}
</script>
