import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import BriefingPackModal from '@/views/TaxHub/BriefingPackModal.vue';
import { apiService } from '@services/ApiService';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    getFamilies: vi.fn(),
    listTaxPeriods: vi.fn(),
    downloadTaxBriefingPack: vi.fn(),
  },
}));

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ showError: vi.fn(), showSuccess: vi.fn() }),
}));

vi.mock('@/modules/auth', () => ({
  authState: { user: { id: 1, firstName: 'Mark', lastName: 'Lewis' } },
}));

const mockApi = vi.mocked(apiService);

const period = {
  id: 9, userId: 1, name: '2025/26', startDate: '2025-04-06', endDate: '2026-04-05',
  accountGroupId: null, createdAt: '', updatedAt: '',
};

describe('BriefingPackModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:x');
    globalThis.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    mockApi.getFamilies.mockResolvedValue([] as never);
  });

  it('loads people and renders tax-year options when opened', async () => {
    mockApi.listTaxPeriods.mockResolvedValue([period]);
    const wrapper = mount(BriefingPackModal, { props: { open: false } });
    await wrapper.setProps({ open: true });
    await flushPromises();
    const text = wrapper.text();
    expect(text).toContain('Mark Lewis (You)');
    expect(text).toContain('2025/26');
  });

  it('generates the pack and emits close on success', async () => {
    mockApi.listTaxPeriods.mockResolvedValue([period]);
    mockApi.downloadTaxBriefingPack.mockResolvedValue(new Blob(['%PDF-']));
    const wrapper = mount(BriefingPackModal, { props: { open: false } });
    await wrapper.setProps({ open: true });
    await flushPromises();
    await wrapper.find('.btn-primary').trigger('click');
    await flushPromises();
    expect(mockApi.downloadTaxBriefingPack).toHaveBeenCalledWith(9, undefined);
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('disables generate when no tax year is available', async () => {
    mockApi.listTaxPeriods.mockResolvedValue([]);
    const wrapper = mount(BriefingPackModal, { props: { open: false } });
    await wrapper.setProps({ open: true });
    await flushPromises();
    expect(wrapper.find('.btn-primary').attributes('disabled')).toBeDefined();
  });

  it('emits close when cancel is clicked', async () => {
    mockApi.listTaxPeriods.mockResolvedValue([period]);
    const wrapper = mount(BriefingPackModal, { props: { open: true } });
    await flushPromises();
    await wrapper.find('.btn-modal-secondary').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });
});
