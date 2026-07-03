import { describe, it, expect, beforeEach, vi } from 'vitest';

const addImage = vi.fn();
const addPage = vi.fn();
const output = vi.fn(() => new Blob(['pdf'], { type: 'application/pdf' }));

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    internal: { pageSize: { getWidth: () => 595, getHeight: () => 842 } },
    addImage,
    addPage,
    output,
  })),
}));

import { imagesToPdf } from '@/utils/imagesToPdf';

beforeEach(() => {
  vi.clearAllMocks();
  class FR {
    onload: (() => void) | null = null;
    result = '';
    readAsDataURL(): void { this.result = 'data:image/jpeg;base64,xxx'; this.onload?.(); }
  }
  class Img {
    onload: (() => void) | null = null;
    naturalWidth = 1000;
    naturalHeight = 500;
    set src(_v: string) { this.onload?.(); }
  }
  vi.stubGlobal('FileReader', FR);
  vi.stubGlobal('Image', Img);
});

const jpg = (name: string) => new File(['x'], name, { type: 'image/jpeg' });

describe('imagesToPdf', () => {
  it('creates a single page for one image (no extra pages) and returns a PDF File', async () => {
    const out = await imagesToPdf([jpg('a.jpg')], 'doc.pdf');
    expect(addImage).toHaveBeenCalledTimes(1);
    expect(addPage).not.toHaveBeenCalled();
    expect(out.name).toBe('doc.pdf');
    expect(out.type).toBe('application/pdf');
  });

  it('adds one page per additional image', async () => {
    await imagesToPdf([jpg('a.jpg'), jpg('b.jpg'), jpg('c.jpg')], 'multi.pdf');
    expect(addImage).toHaveBeenCalledTimes(3);
    expect(addPage).toHaveBeenCalledTimes(2);
  });

  it('embeds PNG inputs as PNG', async () => {
    await imagesToPdf([new File(['x'], 'a.png', { type: 'image/png' })], 'p.pdf');
    expect(addImage.mock.calls[0][1]).toBe('PNG');
  });
});
