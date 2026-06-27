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

  it('emits editReturn when edit tax return button clicked', async () => {
    const wrapper = row(makeAccount(), 'inScope');
    await wrapper.find('[title="Edit tax return"]').trigger('click');
    expect(wrapper.emitted('editReturn')).toBeTruthy();
  });

  it('emits editAccount when edit account button clicked', async () => {
    const wrapper = row(makeAccount(), 'inScope');
    await wrapper.find('[title="Edit account"]').trigger('click');
    expect(wrapper.emitted('editAccount')).toBeTruthy();
  });

  it('hides edit tax return button for notInScope section', () => {
    const wrapper = row(makeAccount(), 'notInScope');
    expect(wrapper.find('[title="Edit tax return"]').exists()).toBe(false);
  });

  it('shows add-to-scope button for notInScope section', () => {
    const wrapper = row(makeAccount(), 'notInScope');
    expect(wrapper.find('[title="Add to scope"]').exists()).toBe(true);
  });
});

describe('TaxHubTableRow — scope actions', () => {
  const outOfScope = (note: string | null) => ({
    taxReturn: {
      id: 1, accountId: 1, taxPeriodId: 1, income: null, capitalGain: null,
      taxTakenOff: null, scope: 'Out of Scope', note,
      createdAt: '2025-01-01', updatedAt: '2025-01-01',
    },
  });

  it('shows mark-out-of-scope button on eligible rows and emits', async () => {
    const wrapper = row(makeAccount({ eligibilityReason: 'interest_bearing' }), 'eligible');
    const btn = wrapper.find('[title="Mark out of scope"]');
    expect(btn.exists()).toBe(true);
    await btn.trigger('click');
    expect(wrapper.emitted('markOutOfScope')).toBeTruthy();
  });

  it('shows the note and return button for an out-of-scope row', async () => {
    const wrapper = row(makeAccount({ ...outOfScope('Below threshold') }), 'notInScope');
    expect(wrapper.text()).toContain('Below threshold');
    const btn = wrapper.find('[title="Return to eligible"]');
    expect(btn.exists()).toBe(true);
    await btn.trigger('click');
    expect(wrapper.emitted('clearScope')).toBeTruthy();
  });

  it('hides the return button when no scope override is set', () => {
    const wrapper = row(makeAccount(), 'notInScope');
    expect(wrapper.find('[title="Return to eligible"]').exists()).toBe(false);
  });
});

describe('TaxHubTableRow — interest rate display', () => {
  it('shows interest rate for in-scope accounts (not just interest_bearing)', () => {
    const wrapper = row(makeAccount({ eligibilityReason: 'in_scope', interestRate: '3.1' }), 'inScope');
    expect(wrapper.findAll('td')[7].text()).toBe('3.1');
  });

  it('shows dash when the account has no interest rate', () => {
    const wrapper = row(makeAccount({ interestRate: null }), 'inScope');
    expect(wrapper.findAll('td')[7].text()).toBe('—');
  });
});
