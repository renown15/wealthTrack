/** API client for family management endpoints */
import type { Family, UserSummary } from '@models/family';
import type { Portfolio } from '@models/WealthTrackDataModels';
import { BaseApiClient } from '@services/BaseApiClient';

class FamilyService extends BaseApiClient {
  async getFamilies(): Promise<Family[]> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<Family[]>('/api/v1/families'),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch families');
    }
  }

  async createFamily(name: string): Promise<Family> {
    try {
      const response = await this.retryRequest(() =>
        this.client.post<Family>('/api/v1/families', { name }),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create family');
    }
  }

  async renameFamily(familyId: number, name: string): Promise<Family> {
    try {
      const response = await this.retryRequest(() =>
        this.client.put<Family>(`/api/v1/families/${familyId}`, { name }),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to rename family');
    }
  }

  async deleteFamily(familyId: number): Promise<void> {
    try {
      await this.retryRequest(() => this.client.delete(`/api/v1/families/${familyId}`));
    } catch (error) {
      throw this.handleError(error, 'Failed to delete family');
    }
  }

  async getAvailableMembers(familyId: number): Promise<UserSummary[]> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<UserSummary[]>(`/api/v1/families/${familyId}/available-members`),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch available members');
    }
  }

  async addMember(familyId: number, accountId: number): Promise<Family> {
    try {
      const response = await this.retryRequest(() =>
        this.client.post<Family>(`/api/v1/families/${familyId}/members`, { accountId }),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to add member');
    }
  }

  async removeMember(familyId: number, memberId: number): Promise<Family> {
    try {
      const response = await this.retryRequest(() =>
        this.client.delete<Family>(`/api/v1/families/${familyId}/members/${memberId}`),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to remove member');
    }
  }

  async createMemberEvent(
    familyId: number, memberId: number, accountId: number,
    data: { event_type: string; value: string },
  ): Promise<void> {
    try {
      await this.retryRequest(() =>
        this.client.post(
          `/api/v1/families/${familyId}/members/${memberId}/accounts/${accountId}/events`,
          data,
        ),
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to update member balance');
    }
  }

  async getMemberPortfolio(familyId: number, memberId: number): Promise<Portfolio> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<Portfolio>(
          `/api/v1/families/${familyId}/members/${memberId}/portfolio`,
        ),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch member portfolio');
    }
  }
}

export const familyService = new FamilyService();
