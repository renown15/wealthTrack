import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import AccountModal from '@views/AccountHub/AccountModal.vue';

const mockFormData = ref({
  name: '', institutionId: 0, typeId: 0, statusId: 0,
  openedAt: '', closedAt: '', accountNumber: '', sortCode: '',
  rollRefNumber: '', interestRate: '', fixedBonusRate: '',
  fixedBonusRateEndDate: '', releaseDate: '', numberOfShares: '',
  underlying: '', price: '', purchasePrice: '', pensionMonthlyPayment: '',
});

vi.mock('@/composables/useAccountForm', () => ({
  useAccountForm: vi.fn(() => ({ formData: mockFormData })),
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
    mockFormData.value = {
      name: '', institutionId: 0, typeId: 0, statusId: 0,
      openedAt: '', closedAt: '', accountNumber: '', sortCode: '',
      rollRefNumber: '', interestRate: '', fixedBonusRate: '',
      fixedBonusRateEndDate: '', releaseDate: '', numberOfShares: '',
      underlying: '', price: '', purchasePrice: '', pensionMonthlyPayment: '',
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
});
