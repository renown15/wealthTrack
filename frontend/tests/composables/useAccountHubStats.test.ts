import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useAccountHubStats } from '@/composables/useAccountHubStats';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';

const OPEN_STATUS_ID = 1;
const CLOSED_STATUS_ID = 2;

const accountStatuses = ref<ReferenceDataItem[]>([
  { id: OPEN_STATUS_ID, classKey: 'account_status', referenceValue: 'Active' },
  { id: CLOSED_STATUS_ID, classKey: 'account_status', referenceValue: 'Closed' },
]);

const makeItem = (id: number, balance: number, statusId: number, type = 'Savings Account', institutionName = 'Bank'): PortfolioItem => ({
  account: {
    id, userId: 1, institutionId: 1, name: `Account ${id}`,
    typeId: 1, statusId,
    openedAt: null, closedAt: null,
    createdAt: '2025-01-01', updatedAt: '2025-01-01',
  },
  institution: { id: 1, userId: 1, name: institutionName, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  latestBalance: { id: id, accountId: id, userId: 1, eventType: 'Balance Update', value: String(balance), createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  accountType: type,
});

const openAccount = makeItem(1, 1000, OPEN_STATUS_ID);
const closedAccount = makeItem(2, 500, CLOSED_STATUS_ID);

describe('useAccountHubStats - visibleItems filtering', () => {
  it('excludes closed accounts when hideClosed is true', () => {
    const items = ref([openAccount, closedAccount]);
    const { visibleItems } = useAccountHubStats(items, accountStatuses, ref(36), ref(0.075));
    expect(visibleItems.value).toHaveLength(1);
    expect(visibleItems.value[0].account.id).toBe(1);
  });

  it('includes all accounts when hideClosed is false', () => {
    const items = ref([openAccount, closedAccount]);
    const { visibleItems, hideClosed } = useAccountHubStats(items, accountStatuses, ref(36), ref(0.075));
    hideClosed.value = false;
    expect(visibleItems.value).toHaveLength(2);
  });

  it('toggling hideClosed updates visibleItems reactively', () => {
    const items = ref([openAccount, closedAccount]);
    const { visibleItems, hideClosed } = useAccountHubStats(items, accountStatuses, ref(36), ref(0.075));
    expect(visibleItems.value).toHaveLength(1);
    hideClosed.value = false;
    expect(visibleItems.value).toHaveLength(2);
    hideClosed.value = true;
    expect(visibleItems.value).toHaveLength(1);
  });

  it('shows all accounts when accountStatuses is empty (no Closed ID to match)', () => {
    const items = ref([openAccount, closedAccount]);
    const { visibleItems } = useAccountHubStats(items, ref([]), ref(36), ref(0.075));
    expect(visibleItems.value).toHaveLength(2);
  });

  it('returns empty list when items is empty', () => {
    const { visibleItems } = useAccountHubStats(ref([]), accountStatuses, ref(36), ref(0.075));
    expect(visibleItems.value).toHaveLength(0);
  });

  it('includes Tax Liability accounts like any other account type', () => {
    const taxLiability = makeItem(10, 200, OPEN_STATUS_ID, 'Tax Liability');
    const items = ref([openAccount, taxLiability]);
    const { visibleItems, hideClosed } = useAccountHubStats(items, accountStatuses, ref(36), ref(0.075));
    expect(visibleItems.value).toHaveLength(2);
    hideClosed.value = false;
    expect(visibleItems.value).toHaveLength(2);
  });
});

describe('useAccountHubStats - stats computed from visibleItems', () => {
  it('totalValue excludes closed account balance when hideClosed is true', () => {
    const items = ref([openAccount, closedAccount]);
    const { totalValue } = useAccountHubStats(items, accountStatuses, ref(36), ref(0.075));
    expect(totalValue.value).toBe(1000);
  });

  it('totalValue includes closed account balance when hideClosed is false', () => {
    const items = ref([openAccount, closedAccount]);
    const { totalValue, hideClosed } = useAccountHubStats(items, accountStatuses, ref(36), ref(0.075));
    hideClosed.value = false;
    expect(totalValue.value).toBe(1500);
  });

  it('cashAtHand excludes closed savings account when hideClosed is true', () => {
    const closedSavings = makeItem(3, 800, CLOSED_STATUS_ID, 'Current Account');
    const openSavings = makeItem(4, 200, OPEN_STATUS_ID, 'Current Account');
    const items = ref([openSavings, closedSavings]);
    const { cashAtHand } = useAccountHubStats(items, accountStatuses, ref(36), ref(0.075));
    expect(cashAtHand.value).toBe(200);
  });

  it('isaSavings excludes closed ISA when hideClosed is true', () => {
    const closedIsa = makeItem(5, 5000, CLOSED_STATUS_ID, 'Cash ISA');
    const openIsa = makeItem(6, 3000, OPEN_STATUS_ID, 'Cash ISA');
    const items = ref([openIsa, closedIsa]);
    const { isaSavings } = useAccountHubStats(items, accountStatuses, ref(36), ref(0.075));
    expect(isaSavings.value).toBe(3000);
  });

  it('stats update reactively when items change', () => {
    const items = ref([openAccount]);
    const { totalValue } = useAccountHubStats(items, accountStatuses, ref(36), ref(0.075));
    expect(totalValue.value).toBe(1000);
    items.value = [openAccount, makeItem(99, 2000, OPEN_STATUS_ID)];
    expect(totalValue.value).toBe(3000);
  });
});

describe('useAccountHubStats - institution name sorting', () => {
  it('sorts visibleItems by institution name ascending', () => {
    const items = ref([
      makeItem(1, 100, OPEN_STATUS_ID, 'Savings Account', 'Zopa'),
      makeItem(2, 100, OPEN_STATUS_ID, 'Savings Account', 'Barclays'),
      makeItem(3, 100, OPEN_STATUS_ID, 'Savings Account', 'Marcus'),
    ]);
    const { visibleItems } = useAccountHubStats(items, accountStatuses, ref(36), ref(0.075));
    expect(visibleItems.value.map(i => i.institution?.name)).toEqual(['Barclays', 'Marcus', 'Zopa']);
  });

  it('places accounts with no institution at the start', () => {
    const noInst = { ...makeItem(4, 100, OPEN_STATUS_ID), institution: null };
    const items = ref([makeItem(1, 100, OPEN_STATUS_ID, 'Savings Account', 'Barclays'), noInst]);
    const { visibleItems } = useAccountHubStats(items, accountStatuses, ref(36), ref(0.075));
    expect(visibleItems.value[0].institution).toBeNull();
    expect(visibleItems.value[1].institution?.name).toBe('Barclays');
  });

  it('sort order is stable after toggling hideClosed', () => {
    const items = ref([
      makeItem(1, 100, OPEN_STATUS_ID, 'Savings Account', 'Zopa'),
      makeItem(2, 100, OPEN_STATUS_ID, 'Savings Account', 'Barclays'),
    ]);
    const { visibleItems, hideClosed } = useAccountHubStats(items, accountStatuses, ref(36), ref(0.075));
    expect(visibleItems.value[0].institution?.name).toBe('Barclays');
    hideClosed.value = false;
    expect(visibleItems.value[0].institution?.name).toBe('Barclays');
  });
});
