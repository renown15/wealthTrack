import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import AccountModal from '@views/AccountHub/AccountModal.vue';
import { apiService } from '@/services/ApiService';

vi.mock('@/services/ApiService', () => ({
  apiService: {
    getFamilies: vi.fn().mockResolvedValue([]),
    transferAccount: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/modules/auth', () => ({ authState: { user: { id: 1 } } }));

const mockFormData = ref({
  name: '', institutionId: 0, typeId: 0, statusId: 0,
  openedAt: '', closedAt: '', accountNumber: '', sortCode: '',
  rollRefNumber: '', interestRate: '', fixedBonusRate: '',
  fixedBonusRateEndDate: '', releaseDate: '', numberOfShares: '',
  underlying: '', price: '', purchasePrice: '', pensionMonthlyPayment: '',
  assetClass: '', encumbrance: '', taxYear: '',
});

vi.mock('@/composables/useAccountForm', () => ({
  useAccountForm: vi.fn(() => ({ formData: mockFormData })),
  convertFromDateInputFormat: (s: string) => s,
}));

vi.mock('@views/AccountHub/AccountFormFields.vue', () => ({
  default: {
    name: 'AccountFormFields',
    template: '<div data-testid="form-fields" />',
    props: ['formData', 'type', 'institutions', 'accountTypes', 'accountStatuses'],
  },
}));

const defaultProps = {
  open: true,
  type: 'create' as const,
  institutions: [],
  accountTypes: [],
  accountStatuses: [],
};

describe('AccountModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiService.getFamilies).mockResolvedValue([]);
    vi.mocked(apiService.transferAccount).mockResolvedValue(undefined);
    mockFormData.value = {
      name: '', institutionId: 0, typeId: 0, statusId: 0,
      openedAt: '', closedAt: '', accountNumber: '', sortCode: '',
      rollRefNumber: '', interestRate: '', fixedBonusRate: '',
      fixedBonusRateEndDate: '', releaseDate: '', numberOfShares: '',
      underlying: '', price: '', purchasePrice: '', pensionMonthlyPayment: '',
      assetClass: '', encumbrance: '', taxYear: '',
    };
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('shows "New Account" title for create type', () => {
    const wrapper = mount(AccountModal, { props: defaultProps });
    expect(wrapper.text()).toContain('New Account');
  });

  it('shows "Edit Account" title for edit type', () => {
    const wrapper = mount(AccountModal, { props: { ...defaultProps, type: 'edit' } });
    expect(wrapper.text()).toContain('Edit Account');
  });

  it('emits close when cancel button clicked', async () => {
    const wrapper = mount(AccountModal, { props: defaultProps });
    await wrapper.find('button.btn-modal-secondary').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('handleSave: no emit when name is empty', async () => {
    mockFormData.value.name = '';
    const wrapper = mount(AccountModal, { props: defaultProps });
    await wrapper.find('button.btn-primary').trigger('click');
    expect(wrapper.emitted('save')).toBeFalsy();
  });

  it('handleSave: no emit on create when institutionId missing', async () => {
    mockFormData.value.name = 'Test Account';
    mockFormData.value.institutionId = 0;
    const wrapper = mount(AccountModal, { props: defaultProps });
    await wrapper.find('button.btn-primary').trigger('click');
    expect(wrapper.emitted('save')).toBeFalsy();
  });

  it('handleSave: no emit when typeId or statusId missing', async () => {
    mockFormData.value.name = 'Test';
    mockFormData.value.institutionId = 1;
    mockFormData.value.typeId = 0;
    mockFormData.value.statusId = 1;
    const wrapper = mount(AccountModal, { props: defaultProps });
    await wrapper.find('button.btn-primary').trigger('click');
    expect(wrapper.emitted('save')).toBeFalsy();
  });

  it('handleSave: emits save with payload when all fields valid', async () => {
    mockFormData.value.name = 'My ISA';
    mockFormData.value.institutionId = 2;
    mockFormData.value.typeId = 3;
    mockFormData.value.statusId = 4;
    const wrapper = mount(AccountModal, { props: defaultProps });
    await wrapper.find('button.btn-primary').trigger('click');
    const emitted = wrapper.emitted('save');
    expect(emitted).toBeTruthy();
    expect((emitted![0][0] as any).name).toBe('My ISA');
    expect((emitted![0][0] as any).typeId).toBe(3);
  });

  it('shows error message when error prop set', () => {
    const wrapper = mount(AccountModal, { props: { ...defaultProps, error: 'Something failed' } });
    expect(wrapper.text()).toContain('Something failed');
  });

  it('does not call getFamilies in create mode', async () => {
    const wrapper = mount(AccountModal, { props: { ...defaultProps, open: false } });
    await wrapper.setProps({ open: true });
    await flushPromises();
    expect(apiService.getFamilies).not.toHaveBeenCalled();
  });

  it('shows owner dropdown with family member after edit mode loads', async () => {
    vi.mocked(apiService.getFamilies).mockResolvedValue([
      { id: 1, name: 'Fam', members: [{ accountId: 2, firstName: 'Jane', lastName: 'Doe' }] },
    ] as any);
    const wrapper = mount(AccountModal, { props: { ...defaultProps, type: 'edit', open: false } });
    await wrapper.setProps({ open: true });
    await flushPromises();
    const select = wrapper.find('select');
    expect(select.exists()).toBe(true);
    expect(select.text()).toContain('Jane Doe');
  });

  it('selecting different owner triggers inline confirmation then calls transferAccount', async () => {
    vi.mocked(apiService.getFamilies).mockResolvedValue([
      { id: 1, name: 'Fam', members: [{ accountId: 2, firstName: 'Jane', lastName: 'Doe' }] },
    ] as any);
    const wrapper = mount(AccountModal, {
      props: { ...defaultProps, type: 'edit', open: false, accountId: 10 },
    });
    await wrapper.setProps({ open: true });
    await flushPromises();
    const selectEl = wrapper.find('select').element as HTMLSelectElement;
    selectEl.options[1].selected = true;
    await wrapper.find('select').trigger('change');
    // First save → enters confirmation state
    await wrapper.find('button.btn-primary').trigger('click');
    expect(wrapper.text()).toContain('Confirm Ownership Transfer');
    // Second save → confirms transfer
    await wrapper.find('button.btn-primary').trigger('click');
    await flushPromises();
    expect(apiService.transferAccount).toHaveBeenCalledWith(10, 2);
    expect(wrapper.emitted('transferred')).toBeTruthy();
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('cancel during confirmation returns to edit form without closing', async () => {
    vi.mocked(apiService.getFamilies).mockResolvedValue([
      { id: 1, name: 'Fam', members: [{ accountId: 2, firstName: 'Jane', lastName: 'Doe' }] },
    ] as any);
    const wrapper = mount(AccountModal, {
      props: { ...defaultProps, type: 'edit', open: false, accountId: 10 },
    });
    await wrapper.setProps({ open: true });
    await flushPromises();
    const selectEl = wrapper.find('select').element as HTMLSelectElement;
    selectEl.options[1].selected = true;
    await wrapper.find('select').trigger('change');
    await wrapper.find('button.btn-primary').trigger('click');
    expect(wrapper.text()).toContain('Confirm Ownership Transfer');
    // Cancel → back to edit, not closed
    await wrapper.find('button.btn-modal-secondary').trigger('click');
    expect(wrapper.emitted('close')).toBeFalsy();
    expect(wrapper.text()).toContain('Edit Account');
  });
});
