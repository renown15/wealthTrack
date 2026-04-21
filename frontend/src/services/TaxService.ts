/**
 * Service for Tax Hub API operations.
 */
import type {
  TaxDocument,
  TaxPeriod,
  TaxPeriodAccountsResponse,
  TaxPeriodCreateRequest,
  TaxReturn,
  TaxReturnUpsertRequest,
} from '@models/TaxModels';
import { BaseApiClient } from '@services/BaseApiClient';
import { debug } from '@utils/debug';

const BASE = '/api/v1/tax';

class TaxService extends BaseApiClient {
  async listPeriods(): Promise<TaxPeriod[]> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<TaxPeriod[]>(`${BASE}/periods`),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch tax periods');
    }
  }

  async createPeriod(data: TaxPeriodCreateRequest): Promise<TaxPeriod> {
    try {
      const response = await this.retryRequest(() =>
        this.client.post<TaxPeriod>(`${BASE}/periods`, data),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create tax period');
    }
  }

  async deletePeriod(periodId: number): Promise<void> {
    try {
      await this.retryRequest(() =>
        this.client.delete(`${BASE}/periods/${periodId}`),
      );
    } catch (error) {
      throw this.handleError(error, 'Failed to delete tax period');
    }
  }

  async getEligibleAccounts(periodId: number): Promise<TaxPeriodAccountsResponse> {
    try {
      const response = await this.retryRequest(() =>
        this.client.get<TaxPeriodAccountsResponse>(`${BASE}/periods/${periodId}/accounts`),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch eligible accounts');
    }
  }

  async upsertReturn(
    periodId: number,
    accountId: number,
    data: TaxReturnUpsertRequest,
  ): Promise<TaxReturn> {
    try {
      const response = await this.retryRequest(() =>
        this.client.put<TaxReturn>(
          `${BASE}/periods/${periodId}/accounts/${accountId}/return`,
          data,
        ),
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to save tax return');
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

  async uploadDocument(periodId: number, accountId: number, file: File): Promise<TaxDocument> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      debug.log('[TaxService] uploadDocument', { periodId, accountId, fileName: file.name, fileType: file.type, fileSize: file.size });
      const token = this.getAuthToken();
      const res = await fetch(
        `${this.baseURL}${BASE}/periods/${periodId}/accounts/${accountId}/documents`,
        { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: formData },
      );
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json() as TaxDocument;
      debug.log('[TaxService] uploadDocument success', data);
      return data;
    } catch (error) {
      debug.error('[TaxService] uploadDocument error', error);
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

export const taxService = new TaxService();
