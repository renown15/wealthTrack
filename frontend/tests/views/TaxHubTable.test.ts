import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import TaxHubTable from '@/views/TaxHub/TaxHubTable.vue';
import type { EligibleAccount } from '@/models/TaxModels';

vi.mock('@views/TaxHub/TaxHubTableRow.vue', () => ({
  default: {
    name: 'TaxHubTableRow',
    template: '<tr class="mock-tax-row"><td>row</td></tr>',
    props: ['account', 'portfolioItem', 'section'],
    emits: ['edit-return', 'edit-account', 'manage-documents', 'show-events', 'drag-start', 'move-to-in-scope', 'move-to-eligible'],
  },
}));

const makeAccount = (id: number, name: string): EligibleAccount => ({
  accountId: id,
  accountName: name,
  accountType: 'Savings',
  institutionName: 'Test Bank',
  interestRate: '2.5',
  accountStatus: 'active',
  accountNumber: null,
  sortCode: null,
  rollRefNumber: null,
  eligibilityReason: 'interest_bearing',
  eventCount: 0,
  firstBalanceDate: null,
  taxReturn: null,
  documents: [],
});

const defaultProps = {
  inScope: [] as EligibleAccount[],
  eligible: [] as EligibleAccount[],
  taxFree: [] as EligibleAccount[],
  notInScope: [] as EligibleAccount[],
  loading: false,
  error: null as string | null,
  portfolioItemMap: {} as Record<number, never>,
};

describe('TaxHubTable', () => {
  it('shows loading state when loading is true', () => {
    const wrapper = mount(TaxHubTable, { props: { ...defaultProps, loading: true } });
    expect(wrapper.text()).toContain('Loading accounts');
  });

  it('shows error message when error is set', () => {
    const wrapper = mount(TaxHubTable, {
      props: { ...defaultProps, error: 'Failed to load accounts' },
    });
    expect(wrapper.text()).toContain('Failed to load accounts');
  });

  it('shows empty state when no accounts', () => {
    const wrapper = mount(TaxHubTable, { props: defaultProps });
    expect(wrapper.text()).toContain('No accounts for this tax period');
  });

  it('renders In Scope section when accounts present', () => {
    const wrapper = mount(TaxHubTable, {
      props: { ...defaultProps, inScope: [makeAccount(1, 'Savings ISA')] },
    });
    expect(wrapper.text()).toContain('In Scope');
  });

  it('renders Eligible section when accounts present', () => {
    const wrapper = mount(TaxHubTable, {
      props: { ...defaultProps, eligible: [makeAccount(2, 'Current Account')] },
    });
    expect(wrapper.text()).toContain('Eligible');
  });

  it('shows account count in In Scope header', () => {
    const wrapper = mount(TaxHubTable, {
      props: { ...defaultProps, inScope: [makeAccount(1, 'ISA'), makeAccount(2, 'Bond')] },
    });
    expect(wrapper.text()).toContain('In Scope (2)');
  });

  it('shows account count in Eligible header', () => {
    const wrapper = mount(TaxHubTable, {
      props: { ...defaultProps, eligible: [makeAccount(3, 'Current')] },
    });
    expect(wrapper.text()).toContain('Eligible (1)');
  });

  it('renders TaxHubTableRow for each inScope account', () => {
    const wrapper = mount(TaxHubTable, {
      props: {
        ...defaultProps,
        inScope: [makeAccount(1, 'ISA'), makeAccount(2, 'Bond')],
      },
    });
    expect(wrapper.findAll('.mock-tax-row').length).toBeGreaterThanOrEqual(2);
  });

  it('collapses In Scope section when header button clicked', async () => {
    const inScope = [makeAccount(1, 'ISA')];
    const wrapper = mount(TaxHubTable, { props: { ...defaultProps, inScope } });
    const rowsBefore = wrapper.findAll('.mock-tax-row').length;
    const inScopeBtn = wrapper.findAll('button').find((b) => b.text().includes('In Scope'));
    await inScopeBtn?.trigger('click');
    expect(wrapper.findAll('.mock-tax-row').length).toBeLessThanOrEqual(rowsBefore);
  });

  it('renders Tax Free section when accounts present', () => {
    const wrapper = mount(TaxHubTable, {
      props: { ...defaultProps, taxFree: [makeAccount(3, 'Cash ISA')] },
    });
    expect(wrapper.text()).toContain('Tax Free (1)');
  });

  it('expands Tax Free section when header button clicked', async () => {
    const wrapper = mount(TaxHubTable, {
      props: { ...defaultProps, taxFree: [makeAccount(3, 'Cash ISA')] },
    });
    const taxFreeBtn = wrapper.findAll('button').find((b) => b.text().includes('Tax Free'));
    await taxFreeBtn?.trigger('click');
    expect(wrapper.findAll('.mock-tax-row').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Not in Scope section when accounts present', () => {
    const wrapper = mount(TaxHubTable, {
      props: { ...defaultProps, notInScope: [makeAccount(4, 'Cash')] },
    });
    expect(wrapper.text()).toContain('Not in Scope (1)');
  });

  it('bubbles editAccount from row to parent', async () => {
    const wrapper = mount(TaxHubTable, {
      props: { ...defaultProps, inScope: [makeAccount(1, 'ISA')] },
    });
    const row = wrapper.findComponent({ name: 'TaxHubTableRow' });
    await row.vm.$emit('edit-account', makeAccount(1, 'ISA'));
    expect(wrapper.emitted('editAccount')).toBeTruthy();
  });

  it('emits moveToInScope when eligible row dragged to in-scope zone', async () => {
    const wrapper = mount(TaxHubTable, {
      props: { ...defaultProps, eligible: [makeAccount(1, 'Savings')] },
    });
    const row = wrapper.findComponent({ name: 'TaxHubTableRow' });
    await row.vm.$emit('drag-start', 1);
    await wrapper.find('tr.bg-indigo-50').trigger('drop');
    expect(wrapper.emitted('moveToInScope')).toEqual([[1]]);
  });

  it('emits moveToEligible when inScope row dragged to eligible zone', async () => {
    const wrapper = mount(TaxHubTable, {
      props: { ...defaultProps, inScope: [makeAccount(1, 'Savings')] },
    });
    const row = wrapper.findComponent({ name: 'TaxHubTableRow' });
    await row.vm.$emit('drag-start', 1);
    await wrapper.find('tr.bg-gray-50').trigger('drop');
    expect(wrapper.emitted('moveToEligible')).toEqual([[1]]);
  });

  it('sums income, capital gain and tax taken off across all sections', () => {
    const withReturn = (id: number, income: number, gain: number, tax: number): EligibleAccount => ({
      ...makeAccount(id, `Acc ${id}`),
      taxReturn: {
        id, accountId: id, taxPeriodId: 1, income, capitalGain: gain, taxTakenOff: tax,
        createdAt: '2025-01-01', updatedAt: '2025-01-01',
      },
    });
    const wrapper = mount(TaxHubTable, {
      props: {
        ...defaultProps,
        inScope: [withReturn(1, 100, 50, 20)],
        eligible: [withReturn(2, 200, 0, 30)],
      },
    });
    const foot = wrapper.find('tfoot').text();
    expect(foot).toContain('Totals');
    expect(foot).toContain('£300.00'); // income
    expect(foot).toContain('£50.00');  // capital gain
    expect(foot).toContain('£50.00');  // tax taken off (20 + 30)
  });
});
