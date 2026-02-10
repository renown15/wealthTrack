/**
 * API service facade for backwards compatibility.
 * Re-exports specialized services for cleaner organization.
 */
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
  AccountCreateRequest,
  AccountUpdateRequest,
  Institution,
  InstitutionCreateRequest,
  InstitutionUpdateRequest,
} from '@models/Portfolio';
import axios, { type AxiosInstance } from 'axios';
import { authService } from '@services/AuthService';
import { portfolioFetchService } from '@services/PortfolioFetchService';
import { accountCrudService } from '@services/AccountCrudService';
import { institutionCrudService } from '@services/InstitutionCrudService';
import { referenceDataService } from '@services/ReferenceDataService';

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

    // Share the client across all services
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
  }

  // Auth operations
  async registerUser(userData: UserRegistration): Promise<User> {
    return authService.registerUser(userData);
  }

  async loginUser(credentials: UserLogin): Promise<AuthToken> {
    return authService.loginUser(credentials);
  }

  async getCurrentUser(): Promise<User> {
    return authService.getCurrentUser();
  }

  // Portfolio operations
  async getPortfolio(): Promise<Portfolio> {
    return portfolioFetchService.getPortfolio();
  }

  // Account operations
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

  // Institution operations
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

  // Token management (exposed from BaseApiClient)
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
