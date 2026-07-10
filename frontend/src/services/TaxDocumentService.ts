/**
 * Service for tax document API operations (per-account docs + hub library).
 */
import type { TaxDocument, TaxDocumentLibraryItem } from '@models/TaxModels';
import { BaseApiClient } from '@services/BaseApiClient';
import { debug } from '@utils/debug';

const BASE = '/api/v1/tax';

class TaxDocumentService extends BaseApiClient {
  async listAllDocuments(): Promise<TaxDocumentLibraryItem[]> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<TaxDocumentLibraryItem[]>(`${BASE}/documents`),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch document library');
    }
  }

  async uploadLibraryDocument(file: File, description?: string): Promise<TaxDocumentLibraryItem> {
    try {
      // Raw fetch, matching uploadDocument: the axios client mangles FormData.
      const formData = new FormData();
      formData.append('file', file);
      if (description) formData.append('description', description);
      const token = this.getAuthToken();
      const res = await fetch(
        `${this.baseURL}${BASE}/documents`,
        { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: formData },
      );
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      return await res.json() as TaxDocumentLibraryItem;
    } catch (error) {
      throw this.handleError(error, 'Failed to upload document');
    }
  }

  async listDocuments(periodId: number, accountId: number): Promise<TaxDocument[]> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<TaxDocument[]>(
          `${BASE}/periods/${periodId}/accounts/${accountId}/documents`,
        ),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch documents');
    }
  }

  async uploadDocument(periodId: number, accountId: number, file: File, description?: string): Promise<TaxDocument> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (description) formData.append('description', description);
      debug.log('[TaxDocumentService] uploadDocument', { periodId, accountId, fileName: file.name, fileType: file.type, fileSize: file.size });
      const token = this.getAuthToken();
      const res = await fetch(
        `${this.baseURL}${BASE}/periods/${periodId}/accounts/${accountId}/documents`,
        { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: formData },
      );
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json() as TaxDocument;
      debug.log('[TaxDocumentService] uploadDocument success', data);
      return data;
    } catch (error) {
      debug.error('[TaxDocumentService] uploadDocument error', error);
      throw this.handleError(error, 'Failed to upload document');
    }
  }

  async updateDescription(docId: number, description: string | null): Promise<TaxDocument> {
    try {
      const formData = new FormData();
      if (description !== null) formData.append('description', description);
      const response = await this.client.patch<TaxDocument>(`${BASE}/documents/${docId}`, formData);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update description');
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

export const taxDocumentService = new TaxDocumentService();
