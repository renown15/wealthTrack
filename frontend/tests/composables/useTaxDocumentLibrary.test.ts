import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTaxDocumentLibrary } from '@composables/useTaxDocumentLibrary';
import { apiService } from '@services/ApiService';

vi.mock('@services/ApiService', () => ({
  apiService: {
    getTaxDocumentLibrary: vi.fn(),
    downloadTaxDocument: vi.fn(),
    deleteTaxDocument: vi.fn(),
    updateTaxDocumentDescription: vi.fn(),
  },
}));

const mockDocs = [
  { id: 1, taxReturnId: 5, filename: 'cert.pdf', description: 'interest cert',
    contentType: 'application/pdf', createdAt: '2026-06-01T10:00:00',
    accountName: 'Cahoot Savings', periodName: '2026/27' },
  { id: 2, taxReturnId: 6, filename: 'p60.pdf', description: null,
    contentType: 'application/pdf', createdAt: '2026-05-01T10:00:00',
    accountName: 'Chase Saver', periodName: '2025/26' },
];

describe('useTaxDocumentLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiService.getTaxDocumentLibrary).mockResolvedValue(mockDocs);
    vi.mocked(apiService.downloadTaxDocument).mockResolvedValue(new Blob(['x']));
    vi.mocked(apiService.deleteTaxDocument).mockResolvedValue(undefined);
    vi.mocked(apiService.updateTaxDocumentDescription).mockResolvedValue({
      ...mockDocs[1], description: 'now described',
    } as never);
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:url');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('loads the library', async () => {
    const { documents, loading, loadLibrary } = useTaxDocumentLibrary();
    await loadLibrary();
    expect(documents.value).toStrictEqual(mockDocs);
    expect(loading.value).toBe(false);
  });

  it('sets error when loading fails', async () => {
    vi.mocked(apiService.getTaxDocumentLibrary).mockRejectedValue(new Error('boom'));
    const { error, loadLibrary } = useTaxDocumentLibrary();
    await loadLibrary();
    expect(error.value).toBe('boom');
  });

  it('opens and closes a preview with object URL lifecycle', async () => {
    const lib = useTaxDocumentLibrary();
    await lib.preview(1, 'cert.pdf', 'application/pdf');
    expect(lib.previewOpen.value).toBe(true);
    expect(lib.previewUrl.value).toBe('blob:url');
    expect(lib.previewFilename.value).toBe('cert.pdf');
    lib.closePreview();
    expect(lib.previewOpen.value).toBe(false);
    expect(lib.previewUrl.value).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
  });

  it('removes a document from local state on delete', async () => {
    const { documents, loadLibrary, removeDocument } = useTaxDocumentLibrary();
    await loadLibrary();
    await removeDocument(1);
    expect(apiService.deleteTaxDocument).toHaveBeenCalledWith(1);
    expect(documents.value.map((d) => d.id)).toStrictEqual([2]);
  });

  it('updates a description in place', async () => {
    const { documents, loadLibrary, updateDescription } = useTaxDocumentLibrary();
    await loadLibrary();
    await updateDescription(2, 'now described');
    expect(apiService.updateTaxDocumentDescription).toHaveBeenCalledWith(2, 'now described');
    expect(documents.value.find((d) => d.id === 2)?.description).toBe('now described');
  });

  it('downloads via an object URL', async () => {
    const { download } = useTaxDocumentLibrary();
    const click = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({ click, set href(_: string) {}, set download(_: string) {} } as never);
    await download(1, 'cert.pdf');
    expect(apiService.downloadTaxDocument).toHaveBeenCalledWith(1);
    expect(click).toHaveBeenCalled();
  });
});
