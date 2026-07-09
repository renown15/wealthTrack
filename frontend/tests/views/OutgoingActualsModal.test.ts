import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import OutgoingActualsModal from '@views/OutgoingsHub/OutgoingActualsModal.vue';
import { apiService } from '@services/ApiService';

vi.mock('@services/ApiService', () => ({
  apiService: {
    listActualCosts: vi.fn(),
    recordActualCost: vi.fn(),
    deleteActualCost: vi.fn(),
  },
}));

const mockActuals = [
  { groupId: 5, accountId: 10, amount: '142.50', costDate: '2026-06-01' },
  { groupId: 6, accountId: 10, amount: '130.00', costDate: '2026-05-01' },
];

function mountOpen(): ReturnType<typeof mount> {
  return mount(OutgoingActualsModal, {
    props: { open: true, accountId: 10, accountName: 'Gas Bill' },
  });
}

describe('OutgoingActualsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiService.listActualCosts).mockResolvedValue(mockActuals);
    vi.mocked(apiService.recordActualCost).mockResolvedValue(mockActuals[0]);
    vi.mocked(apiService.deleteActualCost).mockResolvedValue(undefined);
  });

  it('does not render when closed', () => {
    const wrapper = mount(OutgoingActualsModal, {
      props: { open: false, accountId: 10, accountName: 'Gas Bill' },
    });
    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
  });

  it('loads and lists actuals when opened', async () => {
    const wrapper = mount(OutgoingActualsModal, {
      props: { open: false, accountId: 10, accountName: 'Gas Bill' },
    });
    await wrapper.setProps({ open: true });
    await flushPromises();
    expect(apiService.listActualCosts).toHaveBeenCalledWith(10);
    expect(wrapper.text()).toContain('Gas Bill');
    expect(wrapper.text()).toContain('£142.50');
    expect(wrapper.text()).toContain('£130.00');
  });

  it('disables Add until date and amount are set', async () => {
    const wrapper = mountOpen();
    await flushPromises();
    const addBtn = wrapper.find('.btn-primary');
    expect((addBtn.element as HTMLButtonElement).disabled).toBe(true);
    await wrapper.find('#actualDate').setValue('2026-07-01');
    await wrapper.find('#actualAmount').setValue('150.00');
    expect((addBtn.element as HTMLButtonElement).disabled).toBe(false);
  });

  it('records an actual and emits changed', async () => {
    const wrapper = mountOpen();
    await flushPromises();
    await wrapper.find('#actualDate').setValue('2026-07-01');
    await wrapper.find('#actualAmount').setValue('150.00');
    await wrapper.find('.btn-primary').trigger('click');
    await flushPromises();
    expect(apiService.recordActualCost).toHaveBeenCalledWith(10, {
      amount: '150.00', cost_date: '2026-07-01',
    });
    expect(wrapper.emitted('changed')).toHaveLength(1);
  });

  it('deletes an actual and emits changed', async () => {
    const wrapper = mountOpen();
    await flushPromises();
    await wrapper.find('button[title="Delete"]').trigger('click');
    await flushPromises();
    expect(apiService.deleteActualCost).toHaveBeenCalledWith(5);
    expect(wrapper.emitted('changed')).toHaveLength(1);
  });

  it('emits close from the footer button', async () => {
    const wrapper = mountOpen();
    await flushPromises();
    await wrapper.find('.btn-modal-secondary').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('shows the empty state when there are no actuals', async () => {
    vi.mocked(apiService.listActualCosts).mockResolvedValue([]);
    const wrapper = mountOpen();
    await flushPromises();
    expect(wrapper.text()).toContain('No actuals recorded yet');
  });
});
