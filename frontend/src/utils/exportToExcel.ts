import * as XLSX from 'xlsx';
import type { PortfolioItem } from '@/models/WealthTrackDataModels';
import type { Institution } from '@/models/WealthTrackDataModels';
import type { InstitutionCredential } from '@/models/InstitutionCredential';
import type { ScenarioDetail, ScenarioAccountItem } from '@/models/scenario';
import { getGrossBalance } from '@views/AccountHub/accountDisplayUtils';

export interface FamilyMemberSheet {
  name: string;
  items: PortfolioItem[];
}

function buildAccountSheet(items: PortfolioItem[]): XLSX.WorkSheet {
  const data = items.map((item) => ({
    'Account Name': item.account?.name || '',
    'Institution': item.institution?.name || '',
    'Type': item.accountType || '',
    'Balance': item.latestBalance?.value ? parseFloat(item.latestBalance.value) : 0,
    'Encumbrance (deducted from balance)': item.account?.encumbrance ? parseFloat(item.account.encumbrance) : '',
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
    [3, 4].forEach((c) => {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c })] as Record<string, unknown> | undefined;
      if (cell && typeof cell === 'object' && cell.v !== '') cell.z = '"£"#,##0.00';
    });
    [10, 11, 12, 13].forEach((c) => {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c })] as Record<string, unknown> | undefined;
      if (cell && typeof cell === 'object' && cell.v && cell.v !== '') {
        cell.t = 'd'; cell.v = new Date(cell.v as string); cell.z = 'yyyy-mm-dd';
      }
    });
  }
  worksheet['!cols'] = [
    { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 30 },
    { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 15 },
    { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
  ];
  return worksheet;
}

export function exportAccountsToExcel(accounts: PortfolioItem[], fileName: string = 'accounts.xlsx'): void {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, buildAccountSheet(accounts), 'Accounts');
  XLSX.writeFile(workbook, fileName);
}

export function exportFamilyToExcel(sheets: FamilyMemberSheet[], fileName: string = 'family-portfolio.xlsx'): void {
  const workbook = XLSX.utils.book_new();
  for (const sheet of sheets) {
    XLSX.utils.book_append_sheet(workbook, buildAccountSheet(sheet.items), sheet.name.slice(0, 31));
  }
  XLSX.writeFile(workbook, fileName);
}

export async function exportInstitutionsToExcel(
  institutions: Institution[],
  fetchCredentials: (institutionId: number) => Promise<InstitutionCredential[]>,
  fileName: string = 'institutions.xlsx',
): Promise<void> {
  const parentById = new Map(institutions.map((i) => [i.id, i.name]));

  const credentialsByInstitution = await Promise.all(
    institutions.map(async (inst) => {
      try {
        const creds = await fetchCredentials(inst.id);
        return { inst, creds };
      } catch {
        return { inst, creds: [] as InstitutionCredential[] };
      }
    }),
  );

  const rows: Record<string, string>[] = [];
  for (const { inst, creds } of credentialsByInstitution) {
    const base = {
      'Institution': inst.name,
      'Type': inst.institutionType || '',
      'Parent': inst.parentId ? (parentById.get(inst.parentId) ?? '') : '',
    };
    if (creds.length === 0) {
      rows.push({ ...base, 'Credential Type': '', 'Key': '', 'Value': '' });
    } else {
      for (const cred of creds) {
        rows.push({ ...base, 'Credential Type': cred.typeLabel, 'Key': cred.key ?? '', 'Value': cred.value ?? '' });
      }
    }
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 30 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Institutions');
  XLSX.writeFile(workbook, fileName);
}

export function exportScenarioToExcel(
  scenarioName: string,
  detail: ScenarioDetail,
  portfolioItemsById: Record<number, PortfolioItem>,
  balanceMap: Record<number, number>,
  fileName?: string,
): void {
  const rows = [
    ...detail.groups.flatMap(g => g.accounts.map(a => buildScenarioRow(g.name, a, portfolioItemsById[a.accountId], balanceMap[a.accountId] ?? 0))),
    ...detail.unassigned.map(a => buildScenarioRow('Unassigned', a, portfolioItemsById[a.accountId], balanceMap[a.accountId] ?? 0)),
  ];
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 },
    { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 12 },
    { wch: 15 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, scenarioName.slice(0, 31));
  XLSX.writeFile(wb, fileName ?? `scenario-${scenarioName}-${new Date().toISOString().split('T')[0]}.xlsx`);
}

function buildScenarioRow(
  group: string,
  acc: ScenarioAccountItem,
  item: PortfolioItem | undefined,
  balance: number,
): Record<string, unknown> {
  return {
    'Scenario Group': group,
    'Owner': acc.ownerName || acc.ownerInitials,
    'Account Name': acc.name,
    'Institution': acc.institutionName,
    'Type': acc.accountType,
    'Balance': balance,
    'Gross Balance': item ? (getGrossBalance(item) ?? '') : '',
    'Encumbrance': item?.account?.encumbrance ? parseFloat(item.account.encumbrance) : '',
    'Account Number': item?.account?.accountNumber ?? '',
    'Sort Code': item?.account?.sortCode ?? '',
    'Roll / Ref Number': item?.account?.rollRefNumber ?? '',
    'Interest Rate': item?.account?.interestRate ?? '',
    'Fixed Bonus Rate': item?.account?.fixedBonusRate ?? '',
    'Fixed Rate End Date': item?.account?.fixedBonusRateEndDate ? formatDateForExcel(item.account.fixedBonusRateEndDate) : '',
    'Opened Date': item?.account?.openedAt ? formatDateForExcel(item.account.openedAt) : '',
    'Closed Date': item?.account?.closedAt ? formatDateForExcel(item.account.closedAt) : '',
    'Release Date': item?.account?.releaseDate ? formatDateForExcel(item.account.releaseDate) : '',
    'Shares': item?.account?.numberOfShares ?? '',
    'Price': item?.account?.price ?? '',
  };
}

function formatDateForExcel(dateString: string): string {
  if (!dateString || dateString.trim() === '') return '';
  let date = new Date(dateString);
  if (isNaN(date.getTime())) {
    const match = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) date = new Date(parseInt(match[3], 10), parseInt(match[2], 10) - 1, parseInt(match[1], 10));
  }
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: "${dateString}". Expected ISO format (YYYY-MM-DD), DD/MM/YYYY, or valid JavaScript date string.`);
  }
  return date.toISOString().split('T')[0];
}
