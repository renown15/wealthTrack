import { ref, type Ref } from 'vue';
import { compressFile } from '@/utils/imageCompression';
import { imagesToPdf } from '@/utils/imagesToPdf';
import { rotateImage } from '@/utils/rotateImage';

export interface PendingUpload {
  file: File;
  url: string;
  isImage: boolean;
  rotation: number;
}

function safeName(description: string): string {
  const base = description.trim().slice(0, 80).replace(/[^\w\- ]+/g, '_').trim();
  return `${base || 'document'}.pdf`;
}

/**
 * Staging area for the document upload panel: collect several photos, reorder
 * them, then build a single upload. One file uploads as-is (compressed if an
 * image); two or more images are combined into one multi-page PDF.
 */
export function useDocumentUpload(): {
  items: Ref<PendingUpload[]>;
  addFiles: (list: FileList | null) => void;
  removeAt: (index: number) => void;
  move: (index: number, direction: -1 | 1) => void;
  rotate: (index: number) => void;
  reset: () => void;
  buildDocument: (description: string) => Promise<File | null>;
} {
  const items = ref<PendingUpload[]>([]);

  function addFiles(list: FileList | null): void {
    for (const file of Array.from(list ?? [])) {
      items.value.push({
        file, url: URL.createObjectURL(file), isImage: file.type.startsWith('image/'), rotation: 0,
      });
    }
  }

  function rotate(index: number): void {
    const item = items.value[index];
    if (item) item.rotation = (item.rotation + 90) % 360;
  }

  function removeAt(index: number): void {
    const [removed] = items.value.splice(index, 1);
    if (removed) URL.revokeObjectURL(removed.url);
  }

  function move(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= items.value.length) return;
    const next = [...items.value];
    [next[index], next[target]] = [next[target], next[index]];
    items.value = next;
  }

  function reset(): void {
    items.value.forEach((it) => URL.revokeObjectURL(it.url));
    items.value = [];
  }

  async function buildDocument(description: string): Promise<File | null> {
    if (items.value.length === 0) return null;
    const files = await Promise.all(
      items.value.map(async (it) => compressFile(await rotateImage(it.file, it.rotation))),
    );
    if (files.length === 1) return files[0];
    return imagesToPdf(files, safeName(description));
  }

  return { items, addFiles, removeAt, move, rotate, reset, buildDocument };
}
