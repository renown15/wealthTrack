import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import GiftsSummary from '@views/TaxHub/GiftsSummary.vue';
import { apiService } from '@services/ApiService';
import type { GiftSummary } from '@models/gift';

vi.mock('@services/ApiService', () => ({
  apiService: { listGifts: vi.fn(), deleteGift: vi.fn() },
}));

const mockGifts: GiftSummary[] = [
  {
    groupId: 1, accountId: 10, accountName: 'Current Account',
    donor: 'Grandparent', giftDate: '2022-03-15', giftValueGbp: '5000.00',
    numShares: null, yearsElapsed: 3.2, ihtRate: '0.32', ihtExposure: '1600.00',
  },
  {
    groupId: 2, accountId: 11, accountName: 'Shares Portfolio',
    donor: 'Parent', giftDate: '2016-01-01', giftValueGbp: '10000.00',
    numShares: '50', yearsElapsed: 9.4, ihtRate: '0', ihtExposure: '0.00',
  },
];

describe('GiftsSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiService.listGifts as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (apiService.deleteGift as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('shows loading state initially', async () => {
    (apiService.listGifts as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    const wrapper = mount(GiftsSummary);
    await nextTick();
    expect(wrapper.find('.spinner').exists()).toBe(true);
  });

  it('shows empty message when no gifts', async () => {
    const wrapper = mount(GiftsSummary);
    await flushPromises();
    expect(wrapper.text()).toContain('No gifts recorded');
  });

  it('renders gift rows', async () => {
    (apiService.listGifts as ReturnType<typeof vi.fn>).mockResolvedValue(mockGifts);
    const wrapper = mount(GiftsSummary);
    await flushPromises();
    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0].text()).toContain('Grandparent');
    expect(rows[1].text()).toContain('Parent');
  });

  it('shows 0% rate and green color for gifts over 7 years', async () => {
    (apiService.listGifts as ReturnType<typeof vi.fn>).mockResolvedValue([mockGifts[1]]);
    const wrapper = mount(GiftsSummary);
    await flushPromises();
    // IHT Exposure is second-to-last column (last is delete button)
    const tds = wrapper.findAll('tbody td');
    const exposureCell = tds.at(-2);
    expect(exposureCell?.classes()).toContain('text-green-600');
  });

  it('shows red color for active IHT exposure', async () => {
    (apiService.listGifts as ReturnType<typeof vi.fn>).mockResolvedValue([mockGifts[0]]);
    const wrapper = mount(GiftsSummary);
    await flushPromises();
    const tds = wrapper.findAll('tbody td');
    const exposureCell = tds.at(-2);
    expect(exposureCell?.classes()).toContain('text-red-600');
  });

  it('shows error message on failure', async () => {
    (apiService.listGifts as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    const wrapper = mount(GiftsSummary);
    await flushPromises();
    expect(wrapper.find('.error-banner').text()).toContain('Network error');
  });

  it('shows confirmation banner when delete button clicked', async () => {
    (apiService.listGifts as ReturnType<typeof vi.fn>).mockResolvedValue([mockGifts[0]]);
    const wrapper = mount(GiftsSummary);
    await flushPromises();
    const deleteBtn = wrapper.find('tbody button');
    await deleteBtn.trigger('click');
    expect(wrapper.text()).toContain('Delete this gift?');
  });

  it('calls deleteGift and reloads on confirm', async () => {
    (apiService.listGifts as ReturnType<typeof vi.fn>).mockResolvedValue([mockGifts[0]]);
    const wrapper = mount(GiftsSummary);
    await flushPromises();
    await wrapper.find('tbody button').trigger('click');
    const confirmBtn = wrapper.find('button.btn-danger');
    await confirmBtn.trigger('click');
    await flushPromises();
    expect(apiService.deleteGift).toHaveBeenCalledWith(1);
    expect(apiService.listGifts).toHaveBeenCalledTimes(2);
  });

  it('hides confirmation banner on cancel', async () => {
    (apiService.listGifts as ReturnType<typeof vi.fn>).mockResolvedValue([mockGifts[0]]);
    const wrapper = mount(GiftsSummary);
    await flushPromises();
    await wrapper.find('tbody button').trigger('click');
    expect(wrapper.text()).toContain('Delete this gift?');
    await wrapper.find('button.btn-modal-secondary').trigger('click');
    expect(wrapper.text()).not.toContain('Delete this gift?');
  });
});
