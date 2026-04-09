/**
 * Service for account document upload, download, and delete operations.
 */
import type { AccountDocument } from '@models/WealthTrackDataModels';
import { BaseApiClient } from '@services/BaseApiClient';

const BASE = '/api/v1/accounts';

class AccountDocumentService extends BaseApiClient {
  async listDocuments(accountId: number): Promise<AccountDocument[]> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<AccountDocument[]>(`${BASE}/${accountId}/documents`),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch documents');
    }
  }

  async uploadDocument(accountId: number, file: File, description?: string): Promise<AccountDocument> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (description) formData.append('description', description);
      const response = await this.client.post<AccountDocument>(
        `${BASE}/${accountId}/documents`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to upload document');
    }
  }

  async downloadDocument(docId: number): Promise<Blob> {
    try {
      const response = await this.client.get<Blob>(
        `${BASE}/documents/${docId}/download`,
        { responseType: 'blob' },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to download document');
    }
  }

  async updateDescription(docId: number, description: string | null): Promise<AccountDocument> {
    try {
      const formData = new FormData();
      if (description !== null) formData.append('description', description);
      const response = await this.client.patch<AccountDocument>(
        `${BASE}/documents/${docId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update description');
    }
  }

  async deleteDocument(docId: number): Promise<void> {
    try {
      await this.retryRequest(() =>
        this.client.delete(`${BASE}/documents/${docId}`),
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to delete document');
    }
  }
}

export const accountDocumentService = new AccountDocumentService();
