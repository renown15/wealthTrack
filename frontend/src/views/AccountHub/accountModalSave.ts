import type { AccountFormData } from '@/composables/useAccountForm';
import type { ReferenceDataItem } from '@/models/ReferenceData';
import { convertFromDateInputFormat } from '@/composables/useAccountForm';
import { validatePenceField } from '@views/AccountHub/addAccountModalValidation';

export interface SavePayload {
  name: string;
  institutionId: number;
  typeId: number;
  statusId: number;
  transferToAccountId?: number;
  openedAt?: string;
  closedAt?: string;
  accountNumber?: string;
  sortCode?: string;
  rollRefNumber?: string;
  interestRate?: string;
  fixedBonusRate?: string;
  fixedBonusRateEndDate?: string;
  releaseDate?: string;
  numberOfShares?: string;
  underlying?: string;
  price?: string;
  purchasePrice?: string;
  pensionMonthlyPayment?: string;
  assetClass?: string;
  encumbrance?: string;
  taxYear?: string;
  utr?: string;
  renewalDate?: string;
  renewalType?: string;
  monthlyCost?: string;
  costingMethod?: string;
  outgoingEndDate?: string;
}

function opt(v: string): string | undefined {
  return v !== '' ? v : undefined;
}

export function buildSavePayload(
  fd: AccountFormData,
  accountStatuses: ReferenceDataItem[],
): { payload: SavePayload | null; error: string } {
  if (!fd.name) return { payload: null, error: 'Please enter an account name' };
  if (!fd.institutionId) return { payload: null, error: 'Please select an institution' };
  if (!fd.typeId || !fd.statusId) return { payload: null, error: 'Please select an account type and status' };
  const closed = accountStatuses.find(s => s.id === fd.statusId);
  if (closed?.referenceValue === 'Closed' && !fd.closedAt) {
    return { payload: null, error: 'Please set a Closed Date when marking an account as Closed' };
  }
  const priceErr = validatePenceField(fd.price, 'Price') ?? validatePenceField(fd.purchasePrice, 'Purchase Price');
  if (priceErr) return { payload: null, error: priceErr };
  return {
    error: '',
    payload: {
      name: fd.name,
      institutionId: fd.institutionId,
      typeId: fd.typeId,
      statusId: fd.statusId,
      openedAt: fd.openedAt ? convertFromDateInputFormat(fd.openedAt) : undefined,
      closedAt: fd.closedAt ? convertFromDateInputFormat(fd.closedAt) : undefined,
      accountNumber: opt(fd.accountNumber),
      sortCode: opt(fd.sortCode),
      rollRefNumber: opt(fd.rollRefNumber),
      interestRate: opt(fd.interestRate),
      fixedBonusRate: opt(fd.fixedBonusRate),
      fixedBonusRateEndDate: fd.fixedBonusRateEndDate ? convertFromDateInputFormat(fd.fixedBonusRateEndDate) : undefined,
      releaseDate: fd.releaseDate ? convertFromDateInputFormat(fd.releaseDate) : undefined,
      numberOfShares: opt(fd.numberOfShares),
      underlying: opt(fd.underlying),
      price: opt(fd.price),
      purchasePrice: opt(fd.purchasePrice),
      pensionMonthlyPayment: opt(fd.pensionMonthlyPayment),
      assetClass: opt(fd.assetClass),
      encumbrance: opt(fd.encumbrance),
      taxYear: opt(fd.taxYear),
      utr: opt(fd.utr),
      renewalDate: fd.renewalDate ? convertFromDateInputFormat(fd.renewalDate) : undefined,
      renewalType: opt(fd.renewalType),
      monthlyCost: opt(fd.monthlyCost),
      costingMethod: opt(fd.costingMethod),
      outgoingEndDate: fd.outgoingEndDate ? convertFromDateInputFormat(fd.outgoingEndDate) : undefined,
      transferToAccountId: fd.transferToAccountId ?? undefined,
    },
  };
}
