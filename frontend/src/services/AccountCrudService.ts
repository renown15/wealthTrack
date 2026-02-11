/**
 * Account service for CRUD operations on user accounts.
 */
import type {
  Account,
  AccountCreateRequest,
  AccountEvent,
  AccountEventCreateRequest,
  AccountUpdateRequest,
} from '@models/Portfolio';
import { BaseApiClient } from '@services/BaseApiClient';

class AccountCrudService extends BaseApiClient {
  /**
   * Get all accounts for current user.
   */
  async getAccounts(): Promise<Account[]> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<Account[]>('/api/v1/accounts'),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch accounts');
    }
  }

  /**
   * Get a specific account by ID.
   */
  async getAccount(accountId: number): Promise<Account> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<Account>(`/api/v1/accounts/${accountId}`),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch account');
    }
  }

  /**
   * Create a new account.
   */
  async createAccount(data: AccountCreateRequest): Promise<Account> {
    try {
      const response = await this.retryRequest(() =>
        this.client.post<Account>('/api/v1/accounts', data),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create account');
    }
  }

  /**
   * Update an existing account.
   */
  async updateAccount(accountId: number, data: AccountUpdateRequest): Promise<Account> {
    try {
      const response = await this.retryRequest(() =>
        this.client.put<Account>(`/api/v1/accounts/${accountId}`, data),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update account');
    }
  }

  /**
   * Delete an account.
   */
  async deleteAccount(accountId: number): Promise<void> {
    try {
      await this.retryRequest(() => this.client.delete(`/api/v1/accounts/${accountId}`));
    } catch (error) {
      throw this.handleError(error, 'Failed to delete account');
    }
  }

  async getAccountEvents(accountId: number): Promise<AccountEvent[]> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<AccountEvent[]>(`/api/v1/accounts/${accountId}/events`),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch account events');
    }
  }

  async createAccountEvent(
    accountId: number,
    data: AccountEventCreateRequest,
  ): Promise<AccountEvent> {
    try {
      const response = await this.retryRequest(() =>
        this.client.post<AccountEvent>(`/api/v1/accounts/${accountId}/events`, data),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create account event');
    }
  }

  async updateAccountDates(
    accountId: number,
    data: { opened_at?: string | null; closed_at?: string | null },
  ): Promise<{ accountId: number; openedAt: string | null; closedAt: string | null }> {
    try {
      const response = await this.retryRequest(() =>
        this.client.put<{ accountId: number; openedAt: string | null; closedAt: string | null }>(
          `/api/v1/accounts/${accountId}/dates`,
          data,
        ),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update account dates');
    }
  }
}

export const accountCrudService = new AccountCrudService();
