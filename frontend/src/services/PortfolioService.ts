/**
 * Portfolio Service - Handles all portfolio-related API calls
 * Wraps ApiService to provide a clean interface for portfolio operations
 */

import { apiService } from '@services/ApiService';
import type { Account, Institution, Portfolio } from '@models/Portfolio';
import type {
  AccountCreateRequest,
  AccountUpdateRequest,
  InstitutionCreateRequest,
  InstitutionUpdateRequest,
} from '@models/Portfolio';

export class PortfolioService {
  /**
   * Fetch the user's portfolio with all accounts and institutions
   */
  static async getPortfolio(): Promise<Portfolio> {
    return apiService.getPortfolio();
  }

  /**
   * Fetch all institutions for the user
   */
  static async getInstitutions(): Promise<Institution[]> {
    return apiService.getInstitutions();
  }

  /**
   * Create a new account
   */
  static async createAccount(data: AccountCreateRequest): Promise<Account> {
    return apiService.createAccount(data);
  }

  /**
   * Update an existing account
   */
  static async updateAccount(
    accountId: number,
    data: AccountUpdateRequest,
  ): Promise<Account> {
    return apiService.updateAccount(accountId, data);
  }

  /**
   * Delete an account
   */
  static async deleteAccount(accountId: number): Promise<void> {
    return apiService.deleteAccount(accountId);
  }

  /**
   * Create a new institution
   */
  static async createInstitution(data: InstitutionCreateRequest): Promise<Institution> {
    return apiService.createInstitution(data);
  }

  /**
   * Update an existing institution
   */
  static async updateInstitution(
    institutionId: number,
    data: InstitutionUpdateRequest,
  ): Promise<Institution> {
    return apiService.updateInstitution(institutionId, data);
  }

  /**
   * Delete an institution
   */
  static async deleteInstitution(institutionId: number): Promise<void> {
    return apiService.deleteInstitution(institutionId);
  }
}

export const portfolioService = PortfolioService;
