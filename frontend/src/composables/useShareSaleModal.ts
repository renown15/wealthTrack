import { ref } from 'vue';
import type { Ref } from 'vue';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';

export function useShareSaleModal(
  state: { items: PortfolioItem[] },
  loadPortfolio: () => Promise<void>,
  currentAccountId: Ref<number>,
  openEventsModal: (id: number, name: string, type?: string) => Promise<void>,
): {
  shareSaleModalOpen: Ref<boolean>;
  shareSaleStartTab: Ref<'record' | 'history'>;
  openShareSaleModal: () => void;
  openShareSaleModalHistory: () => void;
  closeShareSaleModal: () => void;
  handleShareSold: () => Promise<void>;
} {
  const shareSaleModalOpen = ref(false);
  const shareSaleStartTab = ref<'record' | 'history'>('record');

  const openShareSaleModal = (): void => {
    shareSaleStartTab.value = 'record';
    shareSaleModalOpen.value = true;
  };

  const openShareSaleModalHistory = (): void => {
    shareSaleStartTab.value = 'history';
    shareSaleModalOpen.value = true;
  };

  const closeShareSaleModal = (): void => {
    shareSaleModalOpen.value = false;
  };

  const handleShareSold = async (): Promise<void> => {
    closeShareSaleModal();
    await loadPortfolio();
    const accountName = state.items.find((i) => i.account.id === currentAccountId.value)?.account.name ?? 'Shares Account';
    await openEventsModal(currentAccountId.value, accountName, 'Shares');
  };

  return { shareSaleModalOpen, shareSaleStartTab, openShareSaleModal, openShareSaleModalHistory, closeShareSaleModal, handleShareSold };
}
