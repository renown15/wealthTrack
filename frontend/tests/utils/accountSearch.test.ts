import { describe, it, expect } from 'vitest';
import { matchesAccountSearch } from '@/utils/accountSearch';

const fields = {
  institutionName: 'Barclays Bank',
  accountName: 'Everyday Saver',
  accountNumber: '12345678',
  sortCode: '20-00-00',
};

describe('matchesAccountSearch', () => {
  it('matches everything when query is empty or whitespace', () => {
    expect(matchesAccountSearch('', fields)).toBe(true);
    expect(matchesAccountSearch('   ', fields)).toBe(true);
  });

  it('matches institution name case-insensitively', () => {
    expect(matchesAccountSearch('barclays', fields)).toBe(true);
  });

  it('matches account name', () => {
    expect(matchesAccountSearch('saver', fields)).toBe(true);
  });

  it('matches account number substring', () => {
    expect(matchesAccountSearch('3456', fields)).toBe(true);
  });

  it('matches sort code', () => {
    expect(matchesAccountSearch('20-00', fields)).toBe(true);
  });

  it('returns false when nothing matches', () => {
    expect(matchesAccountSearch('zzz', fields)).toBe(false);
  });

  it('tolerates null/undefined fields', () => {
    expect(matchesAccountSearch('x', { accountName: null, sortCode: undefined })).toBe(false);
    expect(matchesAccountSearch('', {})).toBe(true);
  });
});
