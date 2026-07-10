import { describe, it, expect, vi, beforeEach } from 'vitest';
import { taxDocumentService } from '@services/TaxDocumentService';
import type { TaxDocument } from '@models/TaxModels';

const mockDoc: TaxDocument = {
  id: 20, taxReturnId: 10, filename: 'cert.pdf',
  contentType: 'application/pdf', createdAt: '2024-04-06T00:00:00',
};

describe('TaxDocumentService', () => {
  let clientStub: Record<string, unknown>;

  beforeEach(() => {
    clientStub = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      defaults: { headers: { common: { Authorization: 'Bearer test-token' } } },
    };
    taxDocumentService['client'] = clientStub as never;
  });

  it('listDocuments returns docs for an account/period', async () => {
    (clientStub.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [mockDoc] });
    const result = await taxDocumentService.listDocuments(1, 5);
    expect(result).toStrictEqual([mockDoc]);
    expect(clientStub.get as ReturnType<typeof vi.fn>).toHaveBeenCalledWith('/api/v1/tax/periods/1/accounts/5/documents');
  });

  it('listAllDocuments fetches the hub-level library', async () => {
    const libDoc = { ...mockDoc, taxReturnId: null, accountName: null, periodName: null };
    (clientStub.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [libDoc] });
    const result = await taxDocumentService.listAllDocuments();
    expect(result).toStrictEqual([libDoc]);
    expect(clientStub.get as ReturnType<typeof vi.fn>).toHaveBeenCalledWith('/api/v1/tax/documents');
  });

  it('listAllDocuments throws on error', async () => {
    (clientStub.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    await expect(taxDocumentService.listAllDocuments()).rejects.toThrow();
  });

  it('uploadLibraryDocument posts multipart via fetch and returns the item', async () => {
    const created = { ...mockDoc, taxReturnId: null };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => created });
    vi.stubGlobal('fetch', fetchMock);
    const file = new File(['x'], 'SA100.pdf', { type: 'application/pdf' });
    const result = await taxDocumentService.uploadLibraryDocument(file, 'archived');
    expect(result).toStrictEqual(created);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/v1/tax/documents');
    expect(opts.method).toBe('POST');
    expect(opts.body).toBeInstanceOf(FormData);
    vi.unstubAllGlobals();
  });

  it('uploadLibraryDocument throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 413 }));
    await expect(
      taxDocumentService.uploadLibraryDocument(new File(['x'], 'a.pdf')),
    ).rejects.toThrow();
    vi.unstubAllGlobals();
  });

  it('updateDescription patches form data', async () => {
    (clientStub.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockDoc });
    const result = await taxDocumentService.updateDescription(20, 'desc');
    expect(result).toStrictEqual(mockDoc);
    expect(clientStub.patch as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      '/api/v1/tax/documents/20', expect.any(FormData),
    );
  });

  it('downloadDocument returns a blob', async () => {
    const blob = new Blob(['x']);
    (clientStub.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: blob });
    const result = await taxDocumentService.downloadDocument(20);
    expect(result).toBe(blob);
  });

  it('deleteDocument calls delete', async () => {
    (clientStub.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null });
    await taxDocumentService.deleteDocument(20);
    expect(clientStub.delete as ReturnType<typeof vi.fn>).toHaveBeenCalledWith('/api/v1/tax/documents/20');
  });
});
