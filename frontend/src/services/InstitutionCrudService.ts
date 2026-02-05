/**
 * Institution service for CRUD operations on financial institutions.
 */
import type { Institution, InstitutionCreateRequest, InstitutionUpdateRequest } from '@models/Portfolio';
import { BaseApiClient } from '@services/BaseApiClient';

class InstitutionCrudService extends BaseApiClient {
  /**
   * Get all institutions.
   */
  async getInstitutions(): Promise<Institution[]> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<Institution[]>('/api/v1/institutions'),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch institutions');
    }
  }

  /**
   * Get a specific institution by ID.
   */
  async getInstitution(institutionId: number): Promise<Institution> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<Institution>(`/api/v1/institutions/${institutionId}`),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch institution');
    }
  }

  /**
   * Create a new institution.
   */
  async createInstitution(data: InstitutionCreateRequest): Promise<Institution> {
    try {
      const response = await this.retryRequest(() =>
        this.client.post<Institution>('/api/v1/institutions', data),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create institution');
    }
  }

  /**
   * Update an existing institution.
   */
  async updateInstitution(
    institutionId: number,
    data: InstitutionUpdateRequest,
  ): Promise<Institution> {
    try {
      const response = await this.retryRequest(() =>
        this.client.put<Institution>(`/api/v1/institutions/${institutionId}`, data),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update institution');
    }
  }

  /**
   * Delete an institution.
   */
  async deleteInstitution(institutionId: number): Promise<void> {
    try {
      await this.retryRequest(() =>
        this.client.delete(`/api/v1/institutions/${institutionId}`),
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to delete institution');
    }
  }
}

export const institutionCrudService = new InstitutionCrudService();
