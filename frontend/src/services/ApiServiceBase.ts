/** Core API facade — auth, accounts, institutions, portfolio, reference data */
import type { User, UserRegistration, UserLogin, AuthToken } from '@models/User';
import type { ReferenceDataItem } from '@models/ReferenceData';
import type {
  Portfolio,
  Account,
  AccountEvent,
  AccountEventCreateRequest,
  AccountCreateRequest,
  AccountUpdateRequest,
  Institution,
  InstitutionCreateRequest,
  InstitutionUpdateRequest,
} from '@models/WealthTrackDataModels';
import axios, { type AxiosInstance } from 'axios';
import { toSnakeCase } from '@utils/caseTransform';
import { authService } from '@services/AuthService';
import { portfolioFetchService } from '@services/PortfolioFetchService';
import { accountCrudService } from '@services/AccountCrudService';
import { institutionCrudService } from '@services/InstitutionCrudService';
import { referenceDataService } from '@services/ReferenceDataService';
import { institutionCredentialService } from '@services/InstitutionCredentialService';
import { accountGroupCrudService } from '@services/AccountGroupCrudService';
import { analyticsService } from '@services/AnalyticsService';
import { taxService } from '@services/TaxService';
import { accountDocumentService } from '@services/AccountDocumentService';
import { shareSaleService } from '@services/ShareSaleService';

export class ApiServiceBase {
  public client: AxiosInstance;

  constructor() {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
    }) as unknown as AxiosInstance;

    this.client.interceptors.request.use((config) => {
      if (config.data && typeof config.data === 'object') {
        config.data = toSnakeCase(config.data);
      }
      return config;
    });

    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
    authService['client'] = this.client;
    portfolioFetchService['client'] = this.client;
    accountCrudService['client'] = this.client;
    institutionCrudService['client'] = this.client;
    referenceDataService['client'] = this.client;
    accountGroupCrudService['client'] = this.client;
    institutionCredentialService['client'] = this.client;
    analyticsService['client'] = this.client;
    taxService['client'] = this.client;
    accountDocumentService['client'] = this.client;
    shareSaleService['client'] = this.client;
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
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

  async getReferenceData(classKey: string): Promise<ReferenceDataItem[]> {
    return referenceDataService.listByClass(classKey);
  }

  setAuthToken(token: string): void {
    authService.setAuthToken(token);
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken(): void {
    authService.clearAuthToken();
    delete this.client.defaults.headers.common['Authorization'];
  }

  getAuthToken(): string | undefined {
    return authService.getAuthToken();
  }
}
