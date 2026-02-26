/**
 * Account Group service for CRUD operations on account groups.
 */
import type {
  AccountGroup,
  AccountGroupCreateRequest,
  AccountGroupUpdateRequest,
} from '@models/WealthTrackDataModels';
import { BaseApiClient } from '@services/BaseApiClient';

class AccountGroupCrudService extends BaseApiClient {
  /**
   * Get all account groups for the current user.
   */
  async getAccountGroups(): Promise<AccountGroup[]> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<AccountGroup[]>('/api/v1/account-groups'),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch account groups');
    }
  }

  /**
   * Get a specific account group by ID.
   */
  async getAccountGroup(groupId: number): Promise<AccountGroup> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<AccountGroup>(`/api/v1/account-groups/${groupId}`),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch account group');
    }
  }

  /**
   * Create a new account group.
   */
  async createAccountGroup(data: AccountGroupCreateRequest): Promise<AccountGroup> {
    try {
      const response = await this.retryRequest(() =>
        this.client.post<AccountGroup>('/api/v1/account-groups', data),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create account group');
    }
  }

  /**
   * Update an existing account group.
   */
  async updateAccountGroup(
    groupId: number,
    data: AccountGroupUpdateRequest,
  ): Promise<AccountGroup> {
    try {
      const response = await this.retryRequest(() =>
        this.client.put<AccountGroup>(`/api/v1/account-groups/${groupId}`, data),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update account group');
    }
  }

  /**
   * Delete an account group.
   */
  async deleteAccountGroup(groupId: number): Promise<void> {
    try {
      await this.retryRequest(() => this.client.delete(`/api/v1/account-groups/${groupId}`));
    } catch (error) {
      throw this.handleError(error, 'Failed to delete account group');
    }
  }

  /**
   * Add an account to a group.
   */
  async addAccountToGroup(groupId: number, accountId: number): Promise<void> {
    try {
      await this.retryRequest(() =>
        this.client.post(`/api/v1/account-groups/${groupId}/members/${accountId}`, {}),
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to add account to group');
    }
  }

  /**
   * Remove an account from a group.
   */
  async removeAccountFromGroup(groupId: number, accountId: number): Promise<void> {
    try {
      await this.retryRequest(() =>
        this.client.delete(`/api/v1/account-groups/${groupId}/members/${accountId}`),
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to remove account from group');
    }
  }

  /**
   * Get members of a group (returns account IDs).
   */
  async getGroupMembers(groupId: number): Promise<number[]> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<{ accountIds: number[] }>(
          `/api/v1/account-groups/${groupId}/members`,
        ),
      );
      return response.data.accountIds || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch group members');
    }
  }
}

export const accountGroupCrudService = new AccountGroupCrudService();
