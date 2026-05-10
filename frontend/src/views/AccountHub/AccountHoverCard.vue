<template>
  <Teleport to="body">
    <div
      v-if="visible && anchorRect"
      class="pointer-events-none fixed z-[9999] w-[290px] bg-card rounded-[14px] border border-border overflow-hidden"
      style="box-shadow: 0 20px 60px rgba(15,23,42,0.22)"
      :style="cardStyle"
    >
      <div class="bg-gradient-to-br from-primary to-primary-dark px-4 py-3">
        <p class="m-0 text-white/75 text-[0.62rem] font-semibold tracking-[0.2em] uppercase leading-none">
          {{ item.institution?.name ?? 'No Institution' }}
        </p>
        <p class="m-0 mt-1.5 text-white font-bold text-base leading-snug">{{ item.account.name }}</p>
        <span class="mt-2 inline-block px-2 py-0.5 text-[0.6rem] font-bold tracking-wider uppercase bg-white/20 text-white rounded-full">
          {{ item.accountType ?? 'Unknown' }}
        </span>
      </div>

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
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';
import { getDisplayBalance } from '@views/AccountHub/accountDisplayUtils';
import { formatCurrency, formatDate, formatInterestRate } from '@views/AccountHub/formattingUtils';

const props = defineProps<{
  item: PortfolioItem;
  anchorRect: DOMRect | null;
  visible: boolean;
}>();

const CARD_W = 290;
const MARGIN = 10;

const cardStyle = computed(() => {
  const rect = props.anchorRect;
  if (!rect) return {};
  let left = rect.right + MARGIN;
  if (left + CARD_W > window.innerWidth - MARGIN) left = rect.left - CARD_W - MARGIN;
  const top = Math.max(MARGIN, Math.min(rect.top, window.innerHeight - MARGIN));
  return { top: `${top}px`, left: `${Math.max(MARGIN, left)}px` };
});

type Row = { label: string; value: string };

const sections = computed((): Row[][] => {
  const a = props.item.account;
  const result: Row[][] = [];

  const balanceRows: Row[] = [{ label: 'Balance', value: formatCurrency(getDisplayBalance(props.item)) }];
  if (props.item.latestBalance?.createdAt) {
    balanceRows.push({ label: 'As of', value: formatDate(props.item.latestBalance.createdAt) });
  }
  result.push(balanceRows);

  const idRows: Row[] = [
    ...(a.accountNumber ? [{ label: 'Acc No.', value: a.accountNumber }] : []),
    ...(a.sortCode ? [{ label: 'Sort Code', value: a.sortCode }] : []),
    ...(a.rollRefNumber ? [{ label: 'Roll / Ref', value: a.rollRefNumber }] : []),
  ];
  if (idRows.length) result.push(idRows);

  const rate = formatInterestRate(a.fixedBonusRate, a.interestRate);
  if (rate !== '—') {
    const rateRows: Row[] = [{ label: 'Rate', value: rate }];
    if (a.fixedBonusRateEndDate) rateRows.push({ label: 'Ends', value: formatDate(a.fixedBonusRateEndDate) });
    result.push(rateRows);
  }

  const dateRows: Row[] = [
    ...(a.openedAt ? [{ label: 'Opened', value: formatDate(a.openedAt) }] : []),
    ...(a.closedAt ? [{ label: 'Closed', value: formatDate(a.closedAt) }] : []),
  ];
  if (dateRows.length) result.push(dateRows);

  const extraRows: Row[] = [
    ...(a.assetClass ? [{ label: 'Asset Class', value: a.assetClass }] : []),
    ...(a.encumbrance ? [{ label: 'Encumbrance', value: formatCurrency(a.encumbrance) }] : []),
    ...(a.numberOfShares ? [{ label: 'Shares', value: a.numberOfShares }] : []),
    ...(a.pensionMonthlyPayment ? [{ label: 'Monthly', value: formatCurrency(a.pensionMonthlyPayment) }] : []),
    ...(a.releaseDate ? [{ label: 'Release Date', value: formatDate(a.releaseDate) }] : []),
  ];
  if (extraRows.length) result.push(extraRows);

  return result;
});
</script>
