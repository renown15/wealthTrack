<template>
  <span
    :class="subtle
      ? 'inline-flex items-center justify-center w-3 h-3 text-[0.5rem] font-bold rounded-full border border-current/40 cursor-pointer flex-shrink-0 opacity-50 hover:opacity-90 transition-opacity'
      : 'inline-flex items-center justify-center w-4 h-4 text-xs font-bold rounded bg-blue-100 text-blue-600 cursor-pointer flex-shrink-0'"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >i
    <Teleport to="body">
      <div
        v-if="hovered && anchorRect"
        class="pointer-events-none fixed z-[9999] w-[260px] bg-card rounded-[14px] border border-border overflow-hidden"
        style="box-shadow: 0 20px 60px rgba(15,23,42,0.22)"
        :style="cardStyle"
      >
        <div class="px-4 py-3 flex flex-col">
          <template v-for="(section, si) in sections" :key="si">
            <div :class="['flex flex-col gap-1', si > 0 && 'border-t border-border pt-2.5 mt-2.5']">
              <div v-for="row in section" :key="row.label" class="flex justify-between items-baseline gap-3">
                <span class="text-[0.62rem] font-semibold tracking-[0.15em] uppercase text-muted shrink-0">{{ row.label }}</span>
                <span class="text-sm font-medium text-text-dark text-right">{{ row.value }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{ text: string; subtle?: boolean }>();

const hovered = ref(false);
const anchorRect = ref<DOMRect | null>(null);
let timer: ReturnType<typeof setTimeout> | null = null;

const CARD_W = 260;
const MARGIN = 10;

function onEnter(e: MouseEvent): void {
  anchorRect.value = (e.currentTarget as HTMLElement).getBoundingClientRect();
  timer = setTimeout(() => { hovered.value = true; }, 300);
}

function onLeave(): void {
  if (timer) { clearTimeout(timer); timer = null; }
  hovered.value = false;
}

const cardStyle = computed(() => {
  const rect = anchorRect.value;
  if (!rect) return {};
  let left = rect.right + MARGIN;
  if (left + CARD_W > window.innerWidth - MARGIN) left = rect.left - CARD_W - MARGIN;
  const top = Math.max(MARGIN, Math.min(rect.top, window.innerHeight - MARGIN));
  return { top: `${top}px`, left: `${Math.max(MARGIN, left)}px` };
});

const sections = computed(() => {
  const lines = props.text.split('\n');
  const result: Array<Array<{ label: string; value: string }>> = [[]];
  for (const line of lines) {
    if (/^[─]+$/.test(line.trim())) {
      result.push([]);
      continue;
    }
    const idx = line.indexOf(': ');
    if (idx !== -1) {
      result[result.length - 1].push({ label: line.slice(0, idx), value: line.slice(idx + 2) });
    } else if (line.trim()) {
      result[result.length - 1].push({ label: line.trim(), value: '' });
    }
  }
  return result.filter(s => s.length > 0);
});
</script>
