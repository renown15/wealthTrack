import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TaxReturnModal from '@views/TaxHub/TaxReturnModal.vue';
import type { EligibleAccount } from '@/models/TaxModels';

const makeAccount = (overrides: Partial<EligibleAccount> = {}): EligibleAccount => ({
  accountId: 1,
  accountName: 'Savings Account',
  accountType: 'Savings Account',
  institutionName: 'Test Bank',
  interestRate: '2.5',
  accountStatus: 'Open',
  accountNumber: null,
  sortCode: null,
  rollRefNumber: null,
  eligibilityReason: 'interest_bearing',
  eventCount: 0,
  firstBalanceDate: null,
  taxReturn: null,
  documents: [],
  ...overrides,
});

describe('TaxReturnModal', () => {
  it('does not render when open is false', () => {
    const wrapper = mount(TaxReturnModal, { props: { open: false, account: null } });
    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
  });

  it('renders the comment and three figure fields when open', () => {
    const wrapper = mount(TaxReturnModal, {
      props: { open: true, account: makeAccount() },
    });
    expect(wrapper.text()).toContain('Comment');
    expect(wrapper.text()).toContain('Income (£)');
    expect(wrapper.text()).toContain('Capital Gain (£)');
    expect(wrapper.text()).toContain('Tax Taken Off (£)');
  });

  it('renders income and capital gain fields for in_scope accounts', () => {
    const wrapper = mount(TaxReturnModal, {
      props: { open: true, account: makeAccount({ eligibilityReason: 'in_scope' }) },
    });
    expect(wrapper.text()).toContain('Income (£)');
    expect(wrapper.text()).toContain('Capital Gain (£)');
  });

  it('renders income and capital gain fields for sold_in_period accounts', () => {
    const wrapper = mount(TaxReturnModal, {
      props: { open: true, account: makeAccount({ eligibilityReason: 'sold_in_period' }) },
    });
    expect(wrapper.text()).toContain('Income (£)');
    expect(wrapper.text()).toContain('Capital Gain (£)');
  });

  // inputs order: [0] comment, [1] income, [2] capital gain, [3] tax taken off
  it('populates fields from existing taxReturn and comment', () => {
    const account = makeAccount({
      comment: 'HSBC Employment',
      taxReturn: {
        id: 10, accountId: 1, taxPeriodId: 1,
        income: 1234.56, capitalGain: 500, taxTakenOff: 246.91,
        createdAt: '2025-01-01', updatedAt: '2025-01-01',
      },
    });
    const wrapper = mount(TaxReturnModal, { props: { open: true, account } });
    const inputs = wrapper.findAll('input');
    expect(inputs[0].element.value).toBe('HSBC Employment');
    expect(inputs[1].element.value).toBe('1234.56');
    expect(inputs[2].element.value).toBe('500');
    expect(inputs[3].element.value).toBe('246.91');
  });

  it('leaves fields empty when taxReturn is null', () => {
    const wrapper = mount(TaxReturnModal, {
      props: { open: true, account: makeAccount({ taxReturn: null }) },
    });
    const inputs = wrapper.findAll('input');
    expect(inputs[1].element.value).toBe('');
    expect(inputs[2].element.value).toBe('');
    expect(inputs[3].element.value).toBe('');
  });

  it('emits save with parsed values and comment when Save clicked', async () => {
    const wrapper = mount(TaxReturnModal, {
      props: { open: true, account: makeAccount() },
    });
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('HSBC Employment');
    await inputs[1].setValue('800');
    await inputs[2].setValue('250.5');
    await inputs[3].setValue('160');

    await wrapper.find('button.btn-primary').trigger('click');

    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.emitted('save')![0][0]).toEqual({
      income: 800,
      capitalGain: 250.5,
      taxTakenOff: 160,
      comment: 'HSBC Employment',
    });
  });

  it('emits save with null figures and empty comment for empty fields', async () => {
    const wrapper = mount(TaxReturnModal, {
      props: { open: true, account: makeAccount() },
    });
    await wrapper.find('button.btn-primary').trigger('click');

    expect(wrapper.emitted('save')![0][0]).toEqual({
      income: null,
      capitalGain: null,
      taxTakenOff: null,
      comment: '',
    });
  });

  it('emits close when Cancel clicked', async () => {
    const wrapper = mount(TaxReturnModal, {
      props: { open: true, account: makeAccount() },
    });
    await wrapper.find('button.btn-modal-secondary').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('shows account name in title', () => {
    const wrapper = mount(TaxReturnModal, {
      props: { open: true, account: makeAccount({ accountName: 'My ISA' }) },
    });
    expect(wrapper.text()).toContain('My ISA — Tax Return');
  });

  it('shows institution name when present', () => {
    const wrapper = mount(TaxReturnModal, {
      props: { open: true, account: makeAccount({ institutionName: 'Barclays' }) },
    });
    expect(wrapper.text()).toContain('Barclays');
  });

  it('reloads field values when account prop changes', async () => {
    const wrapper = mount(TaxReturnModal, {
      props: { open: true, account: makeAccount({ taxReturn: null }) },
    });
    expect(wrapper.findAll('input')[0].element.value).toBe('');

    await wrapper.setProps({
      account: makeAccount({
        taxReturn: {
          id: 2, accountId: 1, taxPeriodId: 1,
          income: 999, capitalGain: null, taxTakenOff: 100,
          createdAt: '2025-01-01', updatedAt: '2025-01-01',
        },
      }),
    });

    expect(wrapper.findAll('input')[1].element.value).toBe('999');
    expect(wrapper.findAll('input')[2].element.value).toBe('');
    expect(wrapper.findAll('input')[3].element.value).toBe('100');
  });
});
