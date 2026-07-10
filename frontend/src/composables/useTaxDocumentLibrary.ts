import { ref, type Ref } from 'vue';
import { apiService } from '@services/ApiService';
import type { TaxDocumentLibraryItem } from '@models/TaxModels';
import { debug } from '@utils/debug';

export interface UseTaxDocumentLibraryReturn {
  documents: Ref<TaxDocumentLibraryItem[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  previewOpen: Ref<boolean>;
  previewUrl: Ref<string | null>;
  previewFilename: Ref<string>;
  previewContentType: Ref<string | null>;
  loadLibrary: () => Promise<void>;
  download: (docId: number, filename: string) => Promise<void>;
  preview: (docId: number, filename: string, contentType: string | null) => Promise<void>;
  closePreview: () => void;
  removeDocument: (docId: number) => Promise<void>;
  updateDescription: (docId: number, description: string | null) => Promise<void>;
}

/** Hub-level tax document library: all documents across periods and accounts. */
export function useTaxDocumentLibrary(): UseTaxDocumentLibraryReturn {
  const documents = ref<TaxDocumentLibraryItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const previewOpen = ref(false);
  const previewUrl = ref<string | null>(null);
  const previewFilename = ref('');
  const previewContentType = ref<string | null>(null);

  async function loadLibrary(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      documents.value = await apiService.getTaxDocumentLibrary();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load document library';
      debug.error('[useTaxDocumentLibrary] load error', e);
    } finally {
      loading.value = false;
    }
  }

  async function download(docId: number, filename: string): Promise<void> {
    try {
      const blob = await apiService.downloadTaxDocument(docId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      debug.error('[useTaxDocumentLibrary] download error', e);
    }
  }

  async function preview(
    docId: number, filename: string, contentType: string | null,
  ): Promise<void> {
    try {
      const blob = await apiService.downloadTaxDocument(docId);
      if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = URL.createObjectURL(blob);
      previewFilename.value = filename;
      previewContentType.value = contentType;
      previewOpen.value = true;
    } catch (e) {
      debug.error('[useTaxDocumentLibrary] preview error', e);
    }
  }

  function closePreview(): void {
    previewOpen.value = false;
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = null;
    }
    previewFilename.value = '';
    previewContentType.value = null;
  }

  async function removeDocument(docId: number): Promise<void> {
    try {
      await apiService.deleteTaxDocument(docId);
      documents.value = documents.value.filter((d) => d.id !== docId);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete document';
      debug.error('[useTaxDocumentLibrary] delete error', e);
    }
  }

  async function updateDescription(docId: number, description: string | null): Promise<void> {
    try {
      const updated = await apiService.updateTaxDocumentDescription(docId, description);
      documents.value = documents.value.map((d) =>
        d.id === docId ? { ...d, description: updated.description } : d);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update description';
      debug.error('[useTaxDocumentLibrary] update error', e);
    }
  }

  return {
    documents, loading, error,
    previewOpen, previewUrl, previewFilename, previewContentType,
    loadLibrary, download, preview, closePreview, removeDocument, updateDescription,
  };
}
