import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { useShareSaleModal } from '@composables/useShareSaleModal';

const makeState = (items = [{ account: { id: 5, name: 'My Shares' } } as never]) => ({ items });

describe('useShareSaleModal', () => {
  it('starts closed with record tab', () => {
    const { shareSaleModalOpen, shareSaleStartTab } = useShareSaleModal(
      makeState(), vi.fn(), ref(5), vi.fn(),
    );
    expect(shareSaleModalOpen.value).toBe(false);
    expect(shareSaleStartTab.value).toBe('record');
  });

  it('openShareSaleModal sets tab to record and opens', () => {
    const { shareSaleModalOpen, shareSaleStartTab, openShareSaleModal } = useShareSaleModal(
      makeState(), vi.fn(), ref(5), vi.fn(),
    );
    openShareSaleModal();
    expect(shareSaleStartTab.value).toBe('record');
    expect(shareSaleModalOpen.value).toBe(true);
  });

  it('openShareSaleModalHistory sets tab to history and opens', () => {
    const { shareSaleModalOpen, shareSaleStartTab, openShareSaleModalHistory } = useShareSaleModal(
      makeState(), vi.fn(), ref(5), vi.fn(),
    );
    openShareSaleModalHistory();
    expect(shareSaleStartTab.value).toBe('history');
    expect(shareSaleModalOpen.value).toBe(true);
  });

  it('closeShareSaleModal closes the modal', () => {
    const { shareSaleModalOpen, openShareSaleModal, closeShareSaleModal } = useShareSaleModal(
      makeState(), vi.fn(), ref(5), vi.fn(),
    );
    openShareSaleModal();
    closeShareSaleModal();
    expect(shareSaleModalOpen.value).toBe(false);
  });

  it('handleShareSold closes modal, reloads portfolio, opens events modal with account name', async () => {
    const loadPortfolio = vi.fn().mockResolvedValue(undefined);
    const openEventsModal = vi.fn().mockResolvedValue(undefined);
    const { shareSaleModalOpen, openShareSaleModal, handleShareSold } = useShareSaleModal(
      makeState(), loadPortfolio, ref(5), openEventsModal,
    );
    openShareSaleModal();
    await handleShareSold();
    expect(shareSaleModalOpen.value).toBe(false);
    expect(loadPortfolio).toHaveBeenCalledOnce();
    expect(openEventsModal).toHaveBeenCalledWith(5, 'My Shares', 'Shares');
  });

  it('handleShareSold uses default name when account not found', async () => {
    const openEventsModal = vi.fn().mockResolvedValue(undefined);
    const { handleShareSold } = useShareSaleModal(
      makeState([]), vi.fn().mockResolvedValue(undefined), ref(99), openEventsModal,
    );
    await handleShareSold();
    expect(openEventsModal).toHaveBeenCalledWith(99, 'Shares Account', 'Shares');
  });
});
