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
    'Fixed Rate End Date': item.account?.fixedBonusRateEndDate ? formatDateForExcel(item.account.fixedBonusRateEndDate) : '',
    'Opened Date': item.account?.openedAt ? formatDateForExcel(item.account.openedAt) : '',
    'Closed Date': item.account?.closedAt ? formatDateForExcel(item.account.closedAt) : '',
    'Release Date': item.account?.releaseDate ? formatDateForExcel(item.account.releaseDate) : '',
    'Shares': item.account?.numberOfShares || '',
    'Price': item.account?.price || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    // Format Balance as GBP currency
    const balanceCellAddress = XLSX.utils.encode_cell({ r: row, c: 3 });
    const balanceCellData = worksheet[balanceCellAddress] as Record<string, unknown> | undefined;
    if (balanceCellData && typeof balanceCellData === 'object') {
      balanceCellData.z = '"£"#,##0.00';
    }
    
    // Format date columns - these contain ISO date strings now
    const dateColumnIndices = [9, 10, 11, 12]; // Fixed Rate End Date, Opened Date, Closed Date, Release Date
    dateColumnIndices.forEach((col) => {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cellData = worksheet[cellAddress] as Record<string, unknown> | undefined;
      if (cellData && typeof cellData === 'object' && cellData.v && cellData.v !== '') {
        // Convert ISO string to Date object
        cellData.t = 'd';
        cellData.v = new Date(cellData.v as string);
        cellData.z = 'yyyy-mm-dd';
      }
    });
  }
  
  const columnWidths = [
    { wch: 25 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 15 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Accounts');

  XLSX.writeFile(workbook, fileName);
}

function formatDateForExcel(dateString: string): string {
  if (!dateString || dateString.trim() === '') {
    return '';
  }

  let date = new Date(dateString);
  
  // If standard parsing fails, try DD/MM/YYYY format
  if (isNaN(date.getTime())) {
    const ddmmyyyyMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10);
      const year = parseInt(ddmmyyyyMatch[3], 10);
      date = new Date(year, month - 1, day); // month is 0-indexed
    }
  }
  
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: "${dateString}". Expected ISO format (YYYY-MM-DD), DD/MM/YYYY, or valid JavaScript date string.`);
  }

  return date.toISOString().split('T')[0];
}
