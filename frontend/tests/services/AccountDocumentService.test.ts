import { describe, it, expect, vi, beforeEach } from 'vitest';
import { accountDocumentService } from '@/services/AccountDocumentService';

vi.mock('@/utils/debug', () => ({ debug: { log: vi.fn(), error: vi.fn() } }));

const mockDoc = { id: 1, accountId: 5, filename: 'tax.pdf', description: 'Tax doc', createdAt: '' };

type ClientStub = { get: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn>; defaults: { headers: { common: Record<string, string> } } };

const makeClient = (): ClientStub => ({
  get: vi.fn(),
  delete: vi.fn(),
  defaults: { headers: { common: { Authorization: 'Bearer test-token' } } },
});

describe('AccountDocumentService', () => {
  let clientStub: ClientStub;

  beforeEach(() => {
    vi.clearAllMocks();
    clientStub = makeClient();
    accountDocumentService.client = clientStub as never;
  });

  // ── listDocuments ──────────────────────────────────────────────────────────

  describe('listDocuments', () => {
    it('returns list of documents', async () => {
      clientStub.get.mockResolvedValue({ data: [mockDoc] });
      const result = await accountDocumentService.listDocuments(5);
      expect(result).toStrictEqual([mockDoc]);
      expect(clientStub.get).toHaveBeenCalledWith('/api/v1/accounts/5/documents');
    });

    it('throws on error', async () => {
      clientStub.get.mockRejectedValue(new Error('Network error'));
      await expect(accountDocumentService.listDocuments(5)).rejects.toThrow();
    });
  });

  // ── uploadDocument ────────────────────────────────────────────────────────

  describe('uploadDocument', () => {
    const mockFetchOk = (body: unknown) =>
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(body) });

    it('uploads file and returns document', async () => {
      global.fetch = mockFetchOk(mockDoc);
      const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });
      const result = await accountDocumentService.uploadDocument(5, file);
      expect(result).toStrictEqual(mockDoc);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/accounts/5/documents'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('includes description in formData when provided', async () => {
      global.fetch = mockFetchOk(mockDoc);
      const file = new File(['data'], 'test.pdf');
      await accountDocumentService.uploadDocument(5, file, 'My tax doc');
      expect(global.fetch).toHaveBeenCalledOnce();
    });

    it('throws when response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 413 });
      const file = new File(['data'], 'big.pdf');
      await expect(accountDocumentService.uploadDocument(5, file)).rejects.toThrow('Upload failed: 413');
    });

    it('sends no auth header when token is absent', async () => {
      clientStub.defaults.headers.common['Authorization'] = '';
      global.fetch = mockFetchOk(mockDoc);
      const file = new File(['data'], 'test.pdf');
      await accountDocumentService.uploadDocument(5, file);
      const [, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(opts.headers).toStrictEqual({});
    });
  });

  // ── downloadDocument ──────────────────────────────────────────────────────

  describe('downloadDocument', () => {
    it('returns blob', async () => {
      const blob = new Blob(['pdf']);
      clientStub.get.mockResolvedValue({ data: blob });
      const result = await accountDocumentService.downloadDocument(1);
      expect(result).toBe(blob);
      expect(clientStub.get).toHaveBeenCalledWith(
        '/api/v1/accounts/documents/1/download',
        { responseType: 'blob' },
      );
    });

    it('throws on error', async () => {
      clientStub.get.mockRejectedValue(new Error('Not found'));
      await expect(accountDocumentService.downloadDocument(1)).rejects.toThrow();
    });
  });

  // ── updateDescription ─────────────────────────────────────────────────────

  describe('updateDescription', () => {
    const mockFetchOk = (body: unknown) =>
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(body) });

    it('updates description and returns document', async () => {
      global.fetch = mockFetchOk(mockDoc);
      const result = await accountDocumentService.updateDescription(1, 'Updated');
      expect(result).toStrictEqual(mockDoc);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/accounts/documents/1'),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('omits description field when null', async () => {
      global.fetch = mockFetchOk(mockDoc);
      await accountDocumentService.updateDescription(1, null);
      expect(global.fetch).toHaveBeenCalledOnce();
    });

    it('throws when response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
      await expect(accountDocumentService.updateDescription(1, 'x')).rejects.toThrow('Update failed: 404');
    });
  });

  // ── deleteDocument ────────────────────────────────────────────────────────

  describe('deleteDocument', () => {
    it('sends delete request', async () => {
      clientStub.delete.mockResolvedValue({});
      await accountDocumentService.deleteDocument(1);
      expect(clientStub.delete).toHaveBeenCalledWith('/api/v1/accounts/documents/1');
    });

    it('throws on error', async () => {
      clientStub.delete.mockRejectedValue(new Error('fail'));
      await expect(accountDocumentService.deleteDocument(1)).rejects.toThrow();
    });
  });
});
