import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import DocumentUploadPanel from '@/views/TaxHub/DocumentUploadPanel.vue';

vi.mock('@/utils/imageCompression', () => ({
  compressFile: vi.fn((f: File) => Promise.resolve(f)),
}));
vi.mock('@/utils/imagesToPdf', () => ({
  imagesToPdf: vi.fn((_f: File[], name: string) =>
    Promise.resolve(new File(['pdf'], name, { type: 'application/pdf' }))),
}));
vi.mock('@/utils/rotateImage', () => ({
  rotateImage: vi.fn((f: File) => Promise.resolve(f)),
}));

const img = (name: string) => new File(['x'], name, { type: 'image/jpeg' });

async function selectFiles(wrapper: ReturnType<typeof mount>, files: File[]): Promise<void> {
  const input = wrapper.find('input[type="file"]');
  Object.defineProperty(input.element, 'files', { value: files, configurable: true });
  await input.trigger('change');
}

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:x');
  globalThis.URL.revokeObjectURL = vi.fn();
});

describe('DocumentUploadPanel', () => {
  it('accepts multiple images and camera capture on the input', () => {
    const wrapper = mount(DocumentUploadPanel);
    const input = wrapper.find('input[type="file"]');
    expect(input.attributes('multiple')).toBeDefined();
    expect(input.attributes('accept')).toContain('image/');
    expect(input.attributes('capture')).toBe('environment');
  });

  it('disables Upload until files are staged', async () => {
    const wrapper = mount(DocumentUploadPanel);
    expect(wrapper.find('button.btn-primary').attributes('disabled')).toBeDefined();
    await selectFiles(wrapper, [img('a.jpg')]);
    expect(wrapper.find('button.btn-primary').attributes('disabled')).toBeUndefined();
  });

  it('renders a numbered thumbnail per staged photo', async () => {
    const wrapper = mount(DocumentUploadPanel);
    await selectFiles(wrapper, [img('a.jpg'), img('b.jpg')]);
    expect(wrapper.findAll('img')).toHaveLength(2);
    expect(wrapper.text()).toContain('Combine 2 into PDF');
  });

  it('rotates a photo 90° via the rotate button (preview transform)', async () => {
    const wrapper = mount(DocumentUploadPanel);
    await selectFiles(wrapper, [img('a.jpg')]);
    const rotateBtn = wrapper.find('button[title="Rotate 90°"]');
    expect(rotateBtn.exists()).toBe(true);
    await rotateBtn.trigger('click');
    expect(wrapper.find('img').attributes('style')).toContain('rotate(90deg)');
  });

  it('removes a thumbnail', async () => {
    const wrapper = mount(DocumentUploadPanel);
    await selectFiles(wrapper, [img('a.jpg'), img('b.jpg')]);
    await wrapper.findAll('button[title="Remove"]')[0].trigger('click');
    expect(wrapper.findAll('img')).toHaveLength(1);
  });

  it('emits upload with the built file and resets after submit', async () => {
    const wrapper = mount(DocumentUploadPanel);
    await selectFiles(wrapper, [img('a.jpg'), img('b.jpg')]);
    await wrapper.find('button.btn-primary').trigger('click');
    await flushPromises();
    const uploaded = wrapper.emitted('upload')?.[0] as [File, string?];
    expect(uploaded[0].type).toBe('application/pdf');
    expect(wrapper.findAll('img')).toHaveLength(0); // reset
  });
});
