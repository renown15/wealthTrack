import type { Institution, PortfolioItem } from '@/models/WealthTrackDataModels';
import type { FamilyMember } from '@/models/family';

export interface MemberBalance {
  member: FamilyMember;
  balance: number;
}

export interface InstitutionWithMembers {
  institution: Institution;
  totalBalance: number;
  memberBalances: MemberBalance[];
}

export function deriveInstitutions(items: PortfolioItem[]): Institution[] {
  const seen = new Map<number, Institution>();
  for (const item of items) {
    if (item.institution && !seen.has(item.institution.id)) {
      seen.set(item.institution.id, item.institution);
    }
  }
  return Array.from(seen.values());
}

export function deriveInstitutionsWithMembers(
  items: PortfolioItem[],
  members: FamilyMember[],
): InstitutionWithMembers[] {
  const instMap = new Map<number, InstitutionWithMembers>();

  for (const item of items) {
    if (!item.institution) continue;
    const instId = item.institution.id;
    if (!instMap.has(instId)) {
      instMap.set(instId, { institution: item.institution, totalBalance: 0, memberBalances: [] });
    }
    const entry = instMap.get(instId)!;
    const balance = item.latestBalance?.value ? parseFloat(item.latestBalance.value) : 0;
    entry.totalBalance += balance;
    const member = members.find((m) => m.accountId === item.account.userId);
    if (!member) continue;
    const mb = entry.memberBalances.find((b) => b.member.accountId === member.accountId);
    if (mb) {
      mb.balance += balance;
    } else {
      entry.memberBalances.push({ member, balance });
    }
  }
  return Array.from(instMap.values());
}
