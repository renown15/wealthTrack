import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportFamilyToExcel } from '@utils/exportToExcel';
import * as XLSX from 'xlsx';

vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    json_to_sheet: vi.fn(() => ({ '!ref': 'A1:D2' })),
    book_append_sheet: vi.fn(),
    decode_range: vi.fn(() => ({ s: { r: 0, c: 0 }, e: { r: 1, c: 3 } })),
    encode_cell: vi.fn(({ r, c }) => `${String.fromCharCode(65 + c)}${r + 1}`),
  },
  writeFile: vi.fn(),
}));

const makeItem = (name: string, balance: string | null) => ({
  account: { id: 1, name, userId: 1, institutionId: 1, typeId: 1, statusId: 1, openedAt: null, closedAt: null, createdAt: '', updatedAt: '' },
  institution: { id: 1, userId: 1, name: 'Test Bank', createdAt: '', updatedAt: '' },
  latestBalance: balance ? { value: balance } : null,
  accountType: 'Savings',
}) as never;

describe('exportFamilyToExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(XLSX.utils.book_new).mockReturnValue({} as never);
    vi.mocked(XLSX.utils.json_to_sheet).mockReturnValue({ '!ref': 'A1:D2' } as never);
    vi.mocked(XLSX.utils.decode_range).mockReturnValue({ s: { r: 0, c: 0 }, e: { r: 1, c: 3 } });
  });

  it('creates one sheet per family member', () => {
    const sheets = [
      { name: 'Alice Smith', items: [makeItem('ISA', '10000')] },
      { name: 'Bob Jones', items: [makeItem('Savings', '5000')] },
    ];
    exportFamilyToExcel(sheets, 'family.xlsx');
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2);
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'family.xlsx');
  });

  it('truncates sheet name to 31 characters', () => {
    const longName = 'A'.repeat(40);
    exportFamilyToExcel([{ name: longName, items: [] }]);
    const call = vi.mocked(XLSX.utils.book_append_sheet).mock.calls[0];
    expect((call[2] as string).length).toBeLessThanOrEqual(31);
  });

  it('uses default filename when none provided', () => {
    exportFamilyToExcel([{ name: 'Alice', items: [] }]);
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'family-portfolio.xlsx');
  });

  it('handles empty items list', () => {
    exportFamilyToExcel([{ name: 'Alice', items: [] }]);
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([]);
  });
});
