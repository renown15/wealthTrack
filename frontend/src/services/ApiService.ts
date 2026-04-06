/** API service facade — aggregates all API operations for backwards compatibility. */
import type {
  User,
  UserRegistration,
  UserLogin,
  AuthToken,
} from '@models/User';
import type { ReferenceDataItem } from '@models/ReferenceData';
import type {
  Portfolio,
  Account,
  AccountEvent,
  PortfolioBreakdown,
  PortfolioHistory,
  AccountEventCreateRequest,
  AccountCreateRequest,
  AccountUpdateRequest,
  Institution,
  InstitutionCreateRequest,
  InstitutionUpdateRequest,
  InstitutionCredential,
  InstitutionCredentialCreate,
  InstitutionCredentialUpdate,
  AccountGroup,
  AccountGroupCreateRequest,
  AccountGroupUpdateRequest,
} from '@models/WealthTrackDataModels';
import axios, { type AxiosInstance } from 'axios';
import { authService } from '@services/AuthService';
import { portfolioFetchService } from '@services/PortfolioFetchService';
import { accountCrudService } from '@services/AccountCrudService';
import { institutionCrudService } from '@services/InstitutionCrudService';
import { referenceDataService } from '@services/ReferenceDataService';
import { institutionCredentialService } from '@services/InstitutionCredentialService';
import { accountGroupCrudService } from '@services/AccountGroupCrudService';
import { analyticsService } from '@services/AnalyticsService';
import { taxService } from '@services/TaxService';

/**
 * Facade service that aggregates all API operations.
 * Maintains backwards compatibility with existing code.
 */
class ApiService {
  // Shared axios client for backwards compatibility with tests
  public client: AxiosInstance;

  constructor() {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    }) as unknown as AxiosInstance;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    authService['client'] = this.client;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    portfolioFetchService['client'] = this.client;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    accountCrudService['client'] = this.client;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    institutionCrudService['client'] = this.client;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    referenceDataService['client'] = this.client;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    accountGroupCrudService['client'] = this.client;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    institutionCredentialService['client'] = this.client;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    analyticsService['client'] = this.client;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    taxService['client'] = this.client;
  }

  async registerUser(userData: UserRegistration): Promise<User> {
    return authService.registerUser(userData);
  }

  async loginUser(credentials: UserLogin): Promise<AuthToken> {
    return authService.loginUser(credentials);
  }

  async getCurrentUser(): Promise<User> {
    return authService.getCurrentUser();
  }

  async getPortfolio(): Promise<Portfolio> {
    return portfolioFetchService.getPortfolio();
  }

  async getAccounts(): Promise<Account[]> {
    return accountCrudService.getAccounts();
  }

  async getAccount(accountId: number): Promise<Account> {
    return accountCrudService.getAccount(accountId);
  }

  async createAccount(data: AccountCreateRequest): Promise<Account> {
    return accountCrudService.createAccount(data);
  }

  async updateAccount(accountId: number, data: AccountUpdateRequest): Promise<Account> {
    return accountCrudService.updateAccount(accountId, data);
  }

  async deleteAccount(accountId: number): Promise<void> {
    return accountCrudService.deleteAccount(accountId);
  }

  async getAccountEvents(accountId: number): Promise<AccountEvent[]> {
    return accountCrudService.getAccountEvents(accountId);
  }

  async createAccountEvent(
    accountId: number,
    data: AccountEventCreateRequest,
  ): Promise<AccountEvent> {
    return accountCrudService.createAccountEvent(accountId, data);
  }

  async getInstitutions(): Promise<Institution[]> {
    return institutionCrudService.getInstitutions();
  }

  async getInstitution(institutionId: number): Promise<Institution> {
    return institutionCrudService.getInstitution(institutionId);
  }

  async createInstitution(data: InstitutionCreateRequest): Promise<Institution> {
    return institutionCrudService.createInstitution(data);
  }

  async updateInstitution(
    institutionId: number,
    data: InstitutionUpdateRequest,
  ): Promise<Institution> {
    return institutionCrudService.updateInstitution(institutionId, data);
  }

  async deleteInstitution(institutionId: number): Promise<void> {
    return institutionCrudService.deleteInstitution(institutionId);
  }

  async listInstitutionCredentials(
    institutionId: number,
  ): Promise<InstitutionCredential[]> {
    return institutionCredentialService.list(institutionId);
  }

  async createInstitutionCredential(
    institutionId: number,
    payload: InstitutionCredentialCreate,
  ): Promise<InstitutionCredential> {
    return institutionCredentialService.create(institutionId, payload);
  }

  async updateInstitutionCredential(
    institutionId: number,
    credentialId: number,
    payload: InstitutionCredentialUpdate,
  ): Promise<InstitutionCredential> {
    return institutionCredentialService.update(institutionId, credentialId, payload);
  }

  async deleteInstitutionCredential(
    institutionId: number,
    credentialId: number,
  ): Promise<void> {
    return institutionCredentialService.delete(institutionId, credentialId);
  }

  async getReferenceData(classKey: string): Promise<ReferenceDataItem[]> {
    return referenceDataService.listByClass(classKey);
  }

  async getAccountGroups(): Promise<AccountGroup[]> {
    return accountGroupCrudService.getAccountGroups();
  }

  async getAccountGroup(groupId: number): Promise<AccountGroup> {
    return accountGroupCrudService.getAccountGroup(groupId);
  }

  async createAccountGroup(data: AccountGroupCreateRequest): Promise<AccountGroup> {
    return accountGroupCrudService.createAccountGroup(data);
  }

  async updateAccountGroup(
    groupId: number,
    data: AccountGroupUpdateRequest,
  ): Promise<AccountGroup> {
    return accountGroupCrudService.updateAccountGroup(groupId, data);
  }

  async deleteAccountGroup(groupId: number): Promise<void> {
    return accountGroupCrudService.deleteAccountGroup(groupId);
  }

  async addAccountToGroup(groupId: number, accountId: number): Promise<void> {
    return accountGroupCrudService.addAccountToGroup(groupId, accountId);
  }

  async removeAccountFromGroup(groupId: number, accountId: number): Promise<void> {
    return accountGroupCrudService.removeAccountFromGroup(groupId, accountId);
  }

  async getGroupMembers(groupId: number): Promise<number[]> {
    return accountGroupCrudService.getGroupMembers(groupId);
  }

  async getAnalyticsBreakdown(): Promise<PortfolioBreakdown> {
    return analyticsService.getBreakdown();
  }

  async getAnalyticsHistory(): Promise<PortfolioHistory> {
    return analyticsService.getPortfolioHistory();
  }

  setAuthToken(token: string): void {
    authService.setAuthToken(token);
    // Also set in the shared client for backwards compatibility
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken(): void {
    authService.clearAuthToken();
    // Also clear in the shared client
    delete this.client.defaults.headers.common['Authorization'];
  }

  getAuthToken(): string | undefined {
    return authService.getAuthToken();
  }
}

export const apiService = new ApiService();
