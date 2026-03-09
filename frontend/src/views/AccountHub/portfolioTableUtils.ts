import type { PortfolioItem } from '@/models/WealthTrackDataModels';
import { getFixedRateEndDate, getDisplayBalance } from '@views/AccountHub/accountDisplayUtils';

export type SortCol = 'institution' | 'name' | 'type' | 'balance' | 'balanceUpdated' | 'interestRate' | 'fixedRateEnd' | 'events';

export type GroupRow = { kind: 'group'; groupId: number; name: string; items: PortfolioItem[]; summary: GroupSummary | null };
export type AccountRow = { kind: 'account'; item: PortfolioItem };
export type TableRow = GroupRow | AccountRow;

export function toNum(v: string | number | null | undefined): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseFloat(v) || 0;
  return 0;
}

export function getSortVal(row: TableRow, col: SortCol): string | number {
  if (row.kind === 'group') {
    const s = row.summary;
    switch (col) {
      case 'institution':    return (s?.commonInstitution || row.name).toLowerCase();
      case 'name':           return row.name.toLowerCase();
      case 'type':           return (s?.commonAccountType || '').toLowerCase();
      case 'balance':        return s?.totalBalance ?? 0;
      case 'balanceUpdated': return s?.commonBalanceUpdatedAt || '';
      case 'interestRate':   return toNum(s?.commonInterestRate);
      case 'fixedRateEnd':   return s?.commonEndDate || '';
      case 'events':         return s?.totalEvents ?? 0;
    }
  } else {
    const { item } = row;
    switch (col) {
      case 'institution':    return (item.institution?.name || '').toLowerCase();
      case 'name':           return item.account.name.toLowerCase();
      case 'type':           return (item.accountType || '').toLowerCase();
      case 'balance':        return toNum(getDisplayBalance(item));
      case 'balanceUpdated': return item.latestBalance?.createdAt || '';
      case 'interestRate':   return toNum(item.account.interestRate);
      case 'fixedRateEnd':   return getFixedRateEndDate(item) || '';
      case 'events':         return item.eventCount ?? 0;
      default:               return '';
    }
  }
}

export interface GroupSummary {
  totalBalance: number;
  commonInstitution: string | null | undefined;
  commonAccountType: string | null | undefined;
  commonInterestRate: string | number | null | undefined;
  commonBonusRate: string | number | null | undefined;
  commonEndDate: string | null | undefined;
  commonBalanceUpdatedAt: string | undefined;
  totalEvents: number;
  namesMatch: boolean;
}

export function getGroupSummary(groupItems: PortfolioItem[]): GroupSummary | null {
  if (groupItems.length === 0) return null;
  const totalBalance = groupItems.reduce((sum, item) => {
    const balance = getDisplayBalance(item);
    return sum + (typeof balance === 'number' ? balance : 0);
  }, 0);
  const institutions = groupItems.map(item => item.institution?.name).filter(Boolean);
  const commonInstitution = institutions.length > 0 && institutions.every(i => i === institutions[0]) ? institutions[0] : null;
  const accountTypes = groupItems.map(item => item.accountType);
  const commonAccountType = accountTypes.every(t => t === accountTypes[0]) ? accountTypes[0] : null;
  const interestRates = groupItems.map(item => item.account.interestRate);
  const commonInterestRate = interestRates.every(r => r === interestRates[0]) ? interestRates[0] : null;
  const bonusRates = groupItems.map(item => item.account.fixedBonusRate);
  const commonBonusRate = bonusRates.every(r => r === bonusRates[0]) ? bonusRates[0] : null;
  const endDates = groupItems.map(item => getFixedRateEndDate(item));
  const commonEndDate = endDates.every(d => d === endDates[0]) ? endDates[0] : null;
  const totalEvents = groupItems.reduce((sum, item) => sum + (item.eventCount ?? 0), 0);
  const balanceDateParts = groupItems
    .filter(item => item.latestBalance?.createdAt)
    .map(item => {
      const date = new Date(item.latestBalance!.createdAt);
      return `${String(date.getUTCDate()).padStart(2, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${date.getUTCFullYear()}`;
    });
  let commonBalanceUpdatedAt: string | undefined = undefined;
  if (balanceDateParts.length === groupItems.length && balanceDateParts.length > 0) {
    if (balanceDateParts.every(d => d === balanceDateParts[0])) {
      commonBalanceUpdatedAt = groupItems.find(item => item.latestBalance?.createdAt)?.latestBalance?.createdAt;
    }
  }
  const allInstitutionsMatch = institutions.length > 0 && institutions.every(i => i === institutions[0]);
  const accountNames = groupItems.map(item => item.account.name);
  const namesMatch = allInstitutionsMatch && accountNames.every(n => n === accountNames[0]);
  return { totalBalance, commonInstitution, commonAccountType, commonInterestRate, commonBonusRate, commonEndDate, commonBalanceUpdatedAt, totalEvents, namesMatch };
}
