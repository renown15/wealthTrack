<template>
  <template v-if="loading || institutions.length > 0">
    <hr class="my-4 border-gray-200">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
      <h3 class="section-title">Institutions</h3>
      <div class="flex flex-wrap items-center gap-3">
        <div v-if="!isAllTab" class="flex items-center gap-2">
          <span class="text-xs font-medium text-gray-700">Hide inactive</span>
          <button
            class="relative w-10 h-5 rounded-full transition-colors duration-200 border-none cursor-pointer"
            :class="hideInactive ? 'bg-blue-600' : 'bg-gray-300'"
            @click="hideInactive = !hideInactive"
            title="Hide institutions with no accounts in current view"
          >
            <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200" :class="hideInactive ? 'translate-x-5' : 'translate-x-0'" />
          </button>
        </div>
        <div v-if="!isAllTab" class="flex items-center gap-2">
          <span class="text-xs font-medium text-gray-700">Group by Parent</span>
          <button
            class="relative w-10 h-5 rounded-full transition-colors duration-200 border-none cursor-pointer"
            :class="groupByParent ? 'bg-blue-600' : 'bg-gray-300'"
            @click="$emit('toggleGroupByParent')"
            title="Toggle grouping"
          >
            <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200" :class="groupByParent ? 'translate-x-5' : 'translate-x-0'" />
          </button>
        </div>
        <button
          v-if="!readOnly"
          class="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white border-none rounded text-xs font-medium cursor-pointer transition-colors hover:bg-blue-600"
          @click="$emit('export')"
          title="Export institutions and credentials to Excel"
        >
          <span>{{ Icons.download }}</span><span>Excel</span>
        </button>
      </div>
    </div>
    <InstitutionsFamilyView
      v-if="isAllTab"
      :portfolio-items="portfolioItems"
      :members="allMembers"
    />
    <InstitutionsList
      v-else-if="!loading"
      :institutions="visibleInstitutions"
      :portfolio-items="portfolioItems"
      :group-by-parent="groupByParent"
      :read-only="readOnly"
      @edit-institution="$emit('editInstitution', $event)"
      @delete-institution="(id, name) => $emit('deleteInstitution', id, name)"
      @manage-credentials="$emit('manageCredentials', $event)"
    />
  </template>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Institution, PortfolioItem } from '@/models/WealthTrackDataModels';
import type { FamilyMember } from '@/models/family';
import { Icons } from '@/constants/icons';
import { isOutgoingInstitution } from '@composables/outgoingTypes';
import InstitutionsList from '@views/AccountHub/InstitutionsList.vue';
import InstitutionsFamilyView from '@views/AccountHub/InstitutionsFamilyView.vue';

const props = defineProps<{
  institutions: Institution[];
  portfolioItems: PortfolioItem[];
  allMembers: FamilyMember[];
  groupByParent: boolean;
  loading: boolean;
  readOnly: boolean;
  isAllTab: boolean;
}>();

defineEmits<{
  toggleGroupByParent: [];
  export: [];
  editInstitution: [institution: Institution];
  deleteInstitution: [id: number, name: string];
  manageCredentials: [institution: Institution];
}>();

const hideInactive = ref(true);

const activeInstitutionIds = computed<Set<number>>(() => {
  const ids = new Set<number>();
  for (const item of props.portfolioItems) {
    if (item.account.institutionId) ids.add(item.account.institutionId);
  }
  return ids;
});

const visibleInstitutions = computed<Institution[]>(() => {
  // Outgoings-hub providers live only in the Outgoings Hub, not the wealth view.
  const wealth = props.institutions.filter((i) => !isOutgoingInstitution(i.institutionType));
  if (!hideInactive.value) return wealth;
  const hasActiveChild = (parentId: number): boolean =>
    wealth.some((c) => c.parentId === parentId && activeInstitutionIds.value.has(c.id));
  return wealth.filter(
    (inst) => activeInstitutionIds.value.has(inst.id) || hasActiveChild(inst.id),
  );
});
</script>
