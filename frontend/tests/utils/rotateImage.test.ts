import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rotateImage } from '@/utils/rotateImage';

const jpg = (name = 'a.jpg'): File => new File(['x'], name, { type: 'image/jpeg' });

beforeEach(() => {
  vi.restoreAllMocks();
  class Img {
    onload: (() => void) | null = null;
    naturalWidth = 1000;
    naturalHeight = 400;
    set src(_v: string) { this.onload?.(); }
  }
  vi.stubGlobal('Image', Img);
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:x', revokeObjectURL: () => undefined });
});

describe('rotateImage', () => {
  it('passes a 0° rotation straight through (no canvas work)', async () => {
    const f = jpg();
    expect(await rotateImage(f, 0)).toBe(f);
  });

  it('passes non-image files through unchanged', async () => {
    const pdf = new File(['x'], 'a.pdf', { type: 'application/pdf' });
    expect(await rotateImage(pdf, 90)).toBe(pdf);
  });

  it('swaps canvas dimensions for a 90° rotation and returns a new File', async () => {
    const ctx = { translate: vi.fn(), rotate: vi.fn(), drawImage: vi.fn() };
    const canvas = {
      width: 0, height: 0,
      getContext: () => ctx,
      toBlob: (cb: (b: Blob) => void, type: string) => cb(new Blob(['r'], { type })),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLCanvasElement);

    const out = await rotateImage(jpg(), 90);

    expect(canvas.width).toBe(400); // naturalHeight — swapped
    expect(canvas.height).toBe(1000);
    expect(ctx.rotate).toHaveBeenCalledWith((90 * Math.PI) / 180);
    expect(out).toBeInstanceOf(File);
    expect(out.type).toBe('image/jpeg');
  });

  it('normalises negative angles (-90 == 270)', async () => {
    const ctx = { translate: vi.fn(), rotate: vi.fn(), drawImage: vi.fn() };
    const canvas = {
      width: 0, height: 0, getContext: () => ctx,
      toBlob: (cb: (b: Blob) => void, type: string) => cb(new Blob(['r'], { type })),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLCanvasElement);
    await rotateImage(jpg(), -90);
    expect(canvas.width).toBe(400); // still a quarter-turn → dims swapped
  });
});
