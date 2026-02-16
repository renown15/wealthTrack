import * as XLSX from 'xlsx';
import type { PortfolioItem } from '@/models/Portfolio';

export function exportAccountsToExcel(accounts: PortfolioItem[], fileName: string = 'accounts.xlsx'): void {
  const data = accounts.map((item) => ({
    'Account Name': item.account?.name || '',
    'Institution': item.institution?.name || '',
    'Type': item.accountType || '',
    'Balance': item.latestBalance?.value ? parseFloat(item.latestBalance.value) : 0,
    'Account Number': item.account?.accountNumber || '',
    'Sort Code': item.account?.sortCode || '',
    'Roll / Ref Number': item.account?.rollRefNumber || '',
    'Interest Rate': item.account?.interestRate || '',
    'Fixed Bonus Rate': item.account?.fixedBonusRate || '',
    'Fixed Rate End Date': item.account?.fixedBonusRateEndDate ? new Date(item.account.fixedBonusRateEndDate).toLocaleDateString('en-GB') : '',
    'Opened Date': item.account?.openedAt ? new Date(item.account.openedAt).toLocaleDateString('en-GB') : '',
    'Closed Date': item.account?.closedAt ? new Date(item.account.closedAt).toLocaleDateString('en-GB') : '',
    'Release Date': item.account?.releaseDate ? new Date(item.account.releaseDate).toLocaleDateString('en-GB') : '',
    'Shares': item.account?.numberOfShares || '',
    'Price': item.account?.price || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Format Balance column (column D) as currency
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: 3 }); // Column D (index 3) is Balance
    const cellData = worksheet[cellAddress] as Record<string, unknown> | undefined;
    if (cellData && typeof cellData === 'object') {
      cellData.z = '#,##0.00'; // Format as number with 2 decimal places
    }
  }
  
  // Set column widths
  const columnWidths = [
    { wch: 25 }, // Account Name
    { wch: 20 }, // Institution
    { wch: 20 }, // Type
    { wch: 15 }, // Balance
    { wch: 18 }, // Account Number
    { wch: 12 }, // Sort Code
    { wch: 16 }, // Roll / Ref Number
    { wch: 12 }, // Interest Rate
    { wch: 15 }, // Fixed Bonus Rate
    { wch: 16 }, // Fixed Rate End Date
    { wch: 12 }, // Opened Date
    { wch: 12 }, // Closed Date
    { wch: 12 }, // Release Date
    { wch: 10 }, // Shares
    { wch: 10 }, // Price
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Accounts');

  XLSX.writeFile(workbook, fileName);
}
