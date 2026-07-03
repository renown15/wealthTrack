import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDocumentUpload } from '@/composables/useDocumentUpload';
import { imagesToPdf } from '@/utils/imagesToPdf';
import { compressFile } from '@/utils/imageCompression';
import { rotateImage } from '@/utils/rotateImage';

vi.mock('@/utils/imageCompression', () => ({
  compressFile: vi.fn((f: File) => Promise.resolve(f)),
}));
vi.mock('@/utils/imagesToPdf', () => ({
  imagesToPdf: vi.fn((_files: File[], name: string) =>
    Promise.resolve(new File(['pdf'], name, { type: 'application/pdf' }))),
}));
vi.mock('@/utils/rotateImage', () => ({
  rotateImage: vi.fn((f: File) => Promise.resolve(f)),
}));

const img = (name: string) => new File(['x'], name, { type: 'image/jpeg' });

const asList = (files: File[]): FileList => {
  const dt = { length: files.length, item: (i: number) => files[i] } as unknown as FileList;
  return Object.assign(files.slice(), dt);
};

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:x');
  globalThis.URL.revokeObjectURL = vi.fn();
});

describe('useDocumentUpload', () => {
  it('adds files with object-url previews and image flags', () => {
    const u = useDocumentUpload();
    u.addFiles(asList([img('a.jpg'), new File(['p'], 'b.pdf', { type: 'application/pdf' })]));
    expect(u.items.value).toHaveLength(2);
    expect(u.items.value[0].isImage).toBe(true);
    expect(u.items.value[1].isImage).toBe(false);
  });

  it('removes an item and revokes its url', () => {
    const u = useDocumentUpload();
    u.addFiles(asList([img('a.jpg')]));
    u.removeAt(0);
    expect(u.items.value).toHaveLength(0);
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('reorders items with move()', () => {
    const u = useDocumentUpload();
    u.addFiles(asList([img('a.jpg'), img('b.jpg'), img('c.jpg')]));
    u.move(0, 1);
    expect(u.items.value.map((i) => i.file.name)).toEqual(['b.jpg', 'a.jpg', 'c.jpg']);
    u.move(0, -1); // clamped at edge — no-op
    expect(u.items.value.map((i) => i.file.name)).toEqual(['b.jpg', 'a.jpg', 'c.jpg']);
  });

  it('cycles rotation in 90° steps and wraps at 360', () => {
    const u = useDocumentUpload();
    u.addFiles(asList([img('a.jpg')]));
    expect(u.items.value[0].rotation).toBe(0);
    u.rotate(0);
    expect(u.items.value[0].rotation).toBe(90);
    u.rotate(0); u.rotate(0);
    expect(u.items.value[0].rotation).toBe(270);
    u.rotate(0);
    expect(u.items.value[0].rotation).toBe(0);
  });

  it('bakes each item rotation into the build', async () => {
    const u = useDocumentUpload();
    u.addFiles(asList([img('a.jpg'), img('b.jpg')]));
    u.rotate(1); // b.jpg -> 90
    await u.buildDocument('doc');
    expect(rotateImage).toHaveBeenCalledWith(expect.any(File), 0);
    expect(rotateImage).toHaveBeenCalledWith(expect.any(File), 90);
  });

  it('returns null when nothing is staged', async () => {
    const u = useDocumentUpload();
    expect(await u.buildDocument('')).toBeNull();
  });

  it('passes a single file through compressFile (no PDF)', async () => {
    const u = useDocumentUpload();
    u.addFiles(asList([img('solo.jpg')]));
    const out = await u.buildDocument('anything');
    expect(compressFile).toHaveBeenCalledTimes(1);
    expect(imagesToPdf).not.toHaveBeenCalled();
    expect(out?.type).toBe('image/jpeg');
  });

  it('merges 2+ images into one PDF named from the description', async () => {
    const u = useDocumentUpload();
    u.addFiles(asList([img('p1.jpg'), img('p2.jpg')]));
    const out = await u.buildDocument('Barclays 2025 statement');
    expect(compressFile).toHaveBeenCalledTimes(2);
    expect(imagesToPdf).toHaveBeenCalledOnce();
    expect(out?.name).toBe('Barclays 2025 statement.pdf');
    expect(out?.type).toBe('application/pdf');
  });

  it('falls back to a default PDF name when description is blank', async () => {
    const u = useDocumentUpload();
    u.addFiles(asList([img('p1.jpg'), img('p2.jpg')]));
    const out = await u.buildDocument('   ');
    expect(out?.name).toBe('document.pdf');
  });
});
