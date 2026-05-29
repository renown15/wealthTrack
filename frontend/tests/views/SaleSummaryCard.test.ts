import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SaleSummaryCard from '@views/AccountHub/SaleSummaryCard.vue';
import type { ShareSaleSummary } from '@/models/ShareSaleModels';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';

const mockSale: ShareSaleSummary = {
  groupId: 42,
  soldAt: '2025-06-15T10:30:00Z',
  events: [
    { id: 1, accountId: 100, eventType: 'Deposit', value: '5000', createdAt: '2025-06-15T10:30:00Z' },
    { id: 2, accountId: 200, eventType: 'Capital Gains Tax', value: '200', createdAt: '2025-06-15T10:30:00Z' },
  ],
  attributes: [],
  sharesSold: '100',
  remainingShares: '50',
  proceeds: '5000',
  cgt: '200',
  cgtRate: '20',
  capitalGain: '1000',
  cashNewBalance: '6000',
  taxNewBalance: '500',
  salePricePence: '5000',
  purchasePricePence: '3000',
};

const mockItems: PortfolioItem[] = [
  {
    account: {
      id: 100,
      userId: 1,
      institutionId: 1,
      name: 'Cash ISA',
      typeId: 1,
      statusId: 1,
      openedAt: null,
      closedAt: null,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    institution: null,
    latestBalance: null,
  },
  {
    account: {
      id: 200,
      userId: 1,
      institutionId: 1,
      name: 'Tax Liability 2025',
      typeId: 1,
      statusId: 1,
      openedAt: null,
      closedAt: null,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    institution: null,
    latestBalance: null,
  },
];

describe('SaleSummaryCard', () => {
  it('renders the group id', () => {
    const wrapper = mount(SaleSummaryCard, { props: { sale: mockSale, allItems: [] } });
    expect(wrapper.text()).toContain('Group #42');
  });

  it('renders Sale header', () => {
    const wrapper = mount(SaleSummaryCard, { props: { sale: mockSale, allItems: [] } });
    expect(wrapper.text()).toContain('Sale');
  });

  it('renders shares sold', () => {
    const wrapper = mount(SaleSummaryCard, { props: { sale: mockSale, allItems: [] } });
    expect(wrapper.text()).toContain('100');
  });

  it('renders remaining shares', () => {
    const wrapper = mount(SaleSummaryCard, { props: { sale: mockSale, allItems: [] } });
    expect(wrapper.text()).toContain('50');
  });

  it('renders proceeds as GBP currency', () => {
    const wrapper = mount(SaleSummaryCard, { props: { sale: mockSale, allItems: [] } });
    expect(wrapper.text()).toContain('£5,000.00');
  });

  it('renders CGT amount', () => {
    const wrapper = mount(SaleSummaryCard, { props: { sale: mockSale, allItems: [] } });
    expect(wrapper.text()).toContain('£200.00');
  });

  it('renders CGT rate percentage', () => {
    const wrapper = mount(SaleSummaryCard, { props: { sale: mockSale, allItems: [] } });
    expect(wrapper.text()).toContain('20%');
  });

  it('shows cash account name when allItems has matching account', () => {
    const wrapper = mount(SaleSummaryCard, { props: { sale: mockSale, allItems: mockItems } });
    expect(wrapper.text()).toContain('Cash ISA');
  });

  it('shows tax account name when allItems has matching account', () => {
    const wrapper = mount(SaleSummaryCard, { props: { sale: mockSale, allItems: mockItems } });
    expect(wrapper.text()).toContain('Tax Liability 2025');
  });

  it('shows dash for missing proceeds', () => {
    const emptySale: ShareSaleSummary = { ...mockSale, proceeds: undefined };
    const wrapper = mount(SaleSummaryCard, { props: { sale: emptySale, allItems: [] } });
    expect(wrapper.text()).toContain('—');
  });
});
