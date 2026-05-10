import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AccountHoverCard from '@views/AccountHub/AccountHoverCard.vue';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';

const mockRect = { top: 100, left: 50, right: 200, bottom: 120, width: 150, height: 20 } as DOMRect;

const makeItem = (overrides: Partial<PortfolioItem['account']> = {}): PortfolioItem => ({
  account: {
    id: 1, userId: 1, institutionId: 1,
    name: 'My Savings', typeId: 1, statusId: 1,
    accountNumber: '12345678', sortCode: '12-34-56', rollRefNumber: null,
    interestRate: '2.50', fixedBonusRate: null, fixedBonusRateEndDate: null,
    releaseDate: null, numberOfShares: null, underlying: null,
    price: null, purchasePrice: null, pensionMonthlyPayment: null,
    assetClass: null, encumbrance: null, targetPrice: null,
    openedAt: '2023-04-06', closedAt: null,
    createdAt: '2023-04-06', updatedAt: '2025-01-01',
    ...overrides,
  },
  institution: { id: 1, userId: 1, name: 'Test Bank', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  latestBalance: {
    id: 10, accountId: 1, userId: 1,
    eventType: 'Balance Update', value: '5000',
    createdAt: '2025-03-01', updatedAt: '2025-03-01',
  },
  accountType: 'Savings Account',
});

describe('AccountHoverCard', () => {
  let container: HTMLDivElement;
  let wrapper: ReturnType<typeof mount> | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    document.body.removeChild(container);
  });

  const show = (item: PortfolioItem, overrides: Partial<{ anchorRect: DOMRect | null; visible: boolean }> = {}) => {
    wrapper = mount(AccountHoverCard, {
      props: { item, anchorRect: mockRect, visible: true, ...overrides },
      attachTo: container,
    });
  };

  it('renders nothing when visible is false', () => {
    show(makeItem(), { visible: false });
    expect(document.body.querySelector('.from-primary')).toBeNull();
  });

  it('renders nothing when anchorRect is null', () => {
    show(makeItem(), { anchorRect: null });
    expect(document.body.querySelector('.from-primary')).toBeNull();
  });

  it('renders the card when visible and anchorRect are set', () => {
    show(makeItem());
    expect(document.body.querySelector('.from-primary')).not.toBeNull();
  });

  it('shows institution name in header', () => {
    show(makeItem());
    expect(document.body.innerHTML).toContain('Test Bank');
  });

  it('shows account name in header', () => {
    show(makeItem());
    expect(document.body.innerHTML).toContain('My Savings');
  });

  it('shows account type badge in header', () => {
    show(makeItem());
    expect(document.body.innerHTML).toContain('Savings Account');
  });

  it('shows balance from latestBalance', () => {
    show(makeItem());
    expect(document.body.innerHTML).toContain('£5,000.00');
  });

  it('shows account number when set', () => {
    show(makeItem({ accountNumber: '87654321' }));
    expect(document.body.innerHTML).toContain('87654321');
  });

  it('shows sort code when set', () => {
    show(makeItem({ sortCode: '99-88-77' }));
    expect(document.body.innerHTML).toContain('99-88-77');
  });

  it('omits identifiers section when all are null', () => {
    show(makeItem({ accountNumber: null, sortCode: null, rollRefNumber: null }));
    expect(document.body.innerHTML).not.toContain('Acc No.');
    expect(document.body.innerHTML).not.toContain('Sort Code');
  });

  it('shows interest rate when set', () => {
    show(makeItem({ interestRate: '3.75' }));
    expect(document.body.innerHTML).toContain('3.75%');
  });

  it('omits rate section when no rate is set', () => {
    show(makeItem({ interestRate: null, fixedBonusRate: null }));
    expect(document.body.innerHTML).not.toContain('>Rate<');
  });

  it('shows opened date', () => {
    show(makeItem({ openedAt: '2023-04-06' }));
    expect(document.body.innerHTML).toContain('Opened');
    expect(document.body.innerHTML).toContain('2023');
  });

  it('shows closed date when set', () => {
    show(makeItem({ closedAt: '2025-01-15' }));
    expect(document.body.innerHTML).toContain('Closed');
    expect(document.body.innerHTML).toContain('2025');
  });

  it('shows encumbrance when set', () => {
    show(makeItem({ encumbrance: '1500' }));
    expect(document.body.innerHTML).toContain('£1,500.00');
  });

  it('shows "No Institution" when institution is null', () => {
    show({ ...makeItem(), institution: null });
    expect(document.body.innerHTML).toContain('No Institution');
  });
});
