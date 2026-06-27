/**
 * Shared account search matcher used by Account Hub and Tax Hub.
 * Case-insensitive substring match across institution, account name,
 * account number and sort code.
 */
export interface AccountSearchFields {
  institutionName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  sortCode?: string | null;
}

export function matchesAccountSearch(query: string, fields: AccountSearchFields): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [fields.institutionName, fields.accountName, fields.accountNumber, fields.sortCode]
    .some((value) => (value ?? '').toLowerCase().includes(q));
}
