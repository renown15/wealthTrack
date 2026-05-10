import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TaxHubTableRow from '@views/TaxHub/TaxHubTableRow.vue';
import type { EligibleAccount } from '@/models/TaxModels';

const makeAccount = (overrides: Partial<EligibleAccount> = {}): EligibleAccount => ({
  accountId: 1,
  accountName: 'Savings',
  accountType: 'Savings Account',
  institutionName: 'Test Bank',
  interestRate: '2.5',
  accountStatus: 'Open',
  accountNumber: '12345678',
  sortCode: '12-34-56',
  rollRefNumber: null,
  eligibilityReason: 'interest_bearing',
  eventCount: 3,
  firstBalanceDate: null,
  taxReturn: null,
  documents: [],
  ...overrides,
});

const withReturn = (income: number | null, capitalGain: number | null, taxTakenOff: number | null) => ({
  taxReturn: {
    id: 1, accountId: 1, taxPeriodId: 1,
    income, capitalGain, taxTakenOff,
    createdAt: '2025-01-01', updatedAt: '2025-01-01',
  },
});

const row = (account: EligibleAccount, section: 'inScope' | 'eligible' = 'inScope') =>
  mount(TaxHubTableRow, { props: { account, section, portfolioItem: null } });

describe('TaxHubTableRow — income display', () => {
  it('shows income for interest_bearing account', () => {
    const wrapper = row(makeAccount({ ...withReturn(1234.56, null, 0) }));
    expect(wrapper.text()).toContain('£1,234.56');
  });

  it('shows income for in_scope account with income set', () => {
    const wrapper = row(makeAccount({ eligibilityReason: 'in_scope', ...withReturn(500, null, 0) }));
    expect(wrapper.text()).toContain('£500.00');
  });

  it('shows income for sold_in_period account with income set', () => {
    const wrapper = row(makeAccount({ eligibilityReason: 'sold_in_period', ...withReturn(200, 300, 0) }));
    expect(wrapper.text()).toContain('£200.00');
  });

  it('shows dash when income is null', () => {
    const wrapper = row(makeAccount({ ...withReturn(null, null, 0) }));
    const cells = wrapper.findAll('td');
    expect(cells[8].text()).toBe('—');
  });
});

describe('TaxHubTableRow — capital gain display', () => {
  it('shows capital gain for sold_in_period account', () => {
    const wrapper = row(makeAccount({ eligibilityReason: 'sold_in_period', ...withReturn(null, 750.5, 0) }));
    expect(wrapper.text()).toContain('£750.50');
  });

  it('shows capital gain for in_scope account with capital gain set', () => {
    const wrapper = row(makeAccount({ eligibilityReason: 'in_scope', ...withReturn(null, 999, 0) }));
    expect(wrapper.text()).toContain('£999.00');
  });

  it('shows capital gain for interest_bearing account with capital gain set', () => {
    const wrapper = row(makeAccount({ eligibilityReason: 'interest_bearing', ...withReturn(100, 250, 0) }));
    expect(wrapper.text()).toContain('£250.00');
  });

  it('shows dash when capital gain is null', () => {
    const wrapper = row(makeAccount({ eligibilityReason: 'sold_in_period', ...withReturn(null, null, 0) }));
    const cells = wrapper.findAll('td');
    expect(cells[9].text()).toBe('—');
  });
});

describe('TaxHubTableRow — first balance date display', () => {
  it('shows the date when firstBalanceDate is set', () => {
    const wrapper = row(makeAccount({ firstBalanceDate: '2024-06-15' }));
    expect(wrapper.text()).toContain('2024-06-15');
  });

  it('shows "No balance" when firstBalanceDate is null', () => {
    const wrapper = row(makeAccount({ firstBalanceDate: null }));
    const cells = wrapper.findAll('td');
    expect(cells[11].text()).toBe('No balance');
  });
});

describe('TaxHubTableRow — section buttons', () => {
  it('shows add-to-scope button for eligible section', () => {
    const wrapper = row(makeAccount(), 'eligible');
    expect(wrapper.find('[title="Add to scope"]').exists()).toBe(true);
    expect(wrapper.find('[title="Remove from scope"]').exists()).toBe(false);
  });

  it('shows remove-from-scope button for inScope section', () => {
    const wrapper = row(makeAccount(), 'inScope');
    expect(wrapper.find('[title="Remove from scope"]').exists()).toBe(true);
    expect(wrapper.find('[title="Add to scope"]').exists()).toBe(false);
  });

  it('emits moveToInScope when + clicked', async () => {
    const wrapper = row(makeAccount(), 'eligible');
    await wrapper.find('[title="Add to scope"]').trigger('click');
    expect(wrapper.emitted('moveToInScope')).toEqual([[1]]);
  });

  it('emits moveToEligible when − clicked', async () => {
    const wrapper = row(makeAccount(), 'inScope');
    await wrapper.find('[title="Remove from scope"]').trigger('click');
    expect(wrapper.emitted('moveToEligible')).toEqual([[1]]);
  });

  it('emits editReturn when edit button clicked', async () => {
    const wrapper = row(makeAccount(), 'inScope');
    await wrapper.find('[title="Edit tax return"]').trigger('click');
    expect(wrapper.emitted('editReturn')).toBeTruthy();
  });
});
