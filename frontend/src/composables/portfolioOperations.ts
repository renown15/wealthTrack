/**
 * Portfolio operations - CRUD functions for accounts and institutions
 */

import { apiService } from '@/services/ApiService';

export interface AccountCreatePayload {
  institutionId: number;
  name: string;
  typeId?: number;
  statusId?: number;
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
}

export interface AccountUpdatePayload {
  name: string;
  typeId?: number;
  statusId?: number;
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
}

/**
 * Create a new account
 */
export async function createAccountOp(payload: AccountCreatePayload): Promise<void> {
  await apiService.createAccount(payload);
}

/**
 * Update an account
 */
export async function updateAccountOp(
  accountId: number,
  payload: AccountUpdatePayload,
): Promise<void> {
  await apiService.updateAccount(accountId, payload);
}

/**
 * Delete an account
 */
export async function deleteAccountOp(accountId: number): Promise<void> {
  await apiService.deleteAccount(accountId);
}

/**
 * Create a new institution
 */
export async function createInstitutionOp(
  name: string,
  parentId: number | null = null,
  institutionType: string | null = null,
): Promise<void> {
  await apiService.createInstitution({ name, parentId, institutionType });
}

/**
 * Update an institution
 */
export async function updateInstitutionOp(
  institutionId: number,
  name: string,
  parentId: number | null = null,
  institutionType: string | null = null,
): Promise<void> {
  await apiService.updateInstitution(institutionId, { name, parentId, institutionType });
}

/**
 * Delete an institution
 */
export async function deleteInstitutionOp(institutionId: number): Promise<void> {
  await apiService.deleteInstitution(institutionId);
}
