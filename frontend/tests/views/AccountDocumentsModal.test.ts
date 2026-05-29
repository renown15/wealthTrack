import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import AccountDocumentsModal from '@/views/AccountHub/AccountDocumentsModal.vue';

vi.mock('@/services/AccountDocumentService', () => ({
  accountDocumentService: {
    listDocuments: vi.fn(),
    uploadDocument: vi.fn(),
    downloadDocument: vi.fn(),
    updateDescription: vi.fn(),
    deleteDocument: vi.fn(),
  },
}));

vi.mock('@/utils/imageCompression', () => ({
  compressFile: vi.fn().mockImplementation((f: File) => Promise.resolve(f)),
}));

vi.mock('@/utils/debug', () => ({ debug: { log: vi.fn(), error: vi.fn() } }));

import { accountDocumentService } from '@/services/AccountDocumentService';

const mockDoc = {
  id: 1, accountId: 10, filename: 'tax2025.pdf',
  description: 'Tax doc', contentType: null, createdAt: '2025-04-10T08:00:00Z',
};

const mockApi = vi.mocked(accountDocumentService);

async function mountOpen() {
  mockApi.listDocuments.mockResolvedValue([mockDoc]);
  const wrapper = mount(AccountDocumentsModal, {
    props: { open: false, accountId: 10, accountName: 'My Account' },
  });
  await wrapper.setProps({ open: true });
  await flushPromises();
  return wrapper;
}

describe('AccountDocumentsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.listDocuments.mockResolvedValue([]);
    mockApi.uploadDocument.mockResolvedValue(mockDoc);
    mockApi.downloadDocument.mockResolvedValue(new Blob(['data']));
    mockApi.updateDescription.mockResolvedValue({ ...mockDoc, description: 'Updated' });
    mockApi.deleteDocument.mockResolvedValue(undefined as never);
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  describe('load (via watch on open)', () => {
    it('loads documents when modal opens', async () => {
      await mountOpen();
      expect(mockApi.listDocuments).toHaveBeenCalledWith(10);
    });

    it('shows error when load fails', async () => {
      mockApi.listDocuments.mockRejectedValue(new Error('Load failed'));
      const wrapper = mount(AccountDocumentsModal, {
        props: { open: false, accountId: 10, accountName: 'My Account' },
      });
      await wrapper.setProps({ open: true });
      await flushPromises();
      expect(wrapper.text()).toContain('Load failed');
    });
  });

  describe('formatDate', () => {
    it('formats document createdAt as locale date', async () => {
      const wrapper = await mountOpen();
      expect(wrapper.text()).toMatch(/Apr|2025/);
    });
  });

  describe('onFileChange', () => {
    it('enables upload button when file selected', async () => {
      const wrapper = await mountOpen();
      const file = new File(['data'], 'upload.pdf', { type: 'application/pdf' });
      const input = wrapper.find('input[type="file"]').element as HTMLInputElement;
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      await wrapper.find('input[type="file"]').trigger('change');
      const uploadBtn = wrapper.find('button.btn-primary');
      expect(uploadBtn.attributes('disabled')).toBeUndefined();
    });
  });

  describe('handleUpload', () => {
    it('uploads file, appends to list, and emits uploaded', async () => {
      const wrapper = await mountOpen();
      const newDoc = { ...mockDoc, id: 2, filename: 'new.pdf' };
      mockApi.uploadDocument.mockResolvedValue(newDoc);

      const file = new File(['data'], 'new.pdf', { type: 'application/pdf' });
      const input = wrapper.find('input[type="file"]').element as HTMLInputElement;
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      await wrapper.find('input[type="file"]').trigger('change');
      await wrapper.find('button.btn-primary').trigger('click');
      await flushPromises();

      expect(mockApi.uploadDocument).toHaveBeenCalled();
      expect(wrapper.emitted('uploaded')).toBeTruthy();
    });

    it('shows error on upload failure', async () => {
      mockApi.uploadDocument.mockRejectedValue(new Error('Upload failed'));
      const wrapper = await mountOpen();

      const file = new File(['data'], 'bad.pdf', { type: 'application/pdf' });
      const input = wrapper.find('input[type="file"]').element as HTMLInputElement;
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      await wrapper.find('input[type="file"]').trigger('change');
      await wrapper.find('button.btn-primary').trigger('click');
      await flushPromises();

      expect(wrapper.text()).toContain('Upload failed');
    });
  });

  describe('downloadDoc', () => {
    it('downloads document and creates blob URL', async () => {
      const wrapper = await mountOpen();
      await wrapper.find('button[title="Download"]').trigger('click');
      await flushPromises();
      expect(mockApi.downloadDocument).toHaveBeenCalledWith(1);
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    });

    it('shows error on download failure', async () => {
      mockApi.downloadDocument.mockRejectedValue(new Error('Download failed'));
      const wrapper = await mountOpen();
      await wrapper.find('button[title="Download"]').trigger('click');
      await flushPromises();
      expect(wrapper.text()).toContain('Download failed');
    });
  });

  describe('startEdit / saveDescription', () => {
    it('shows edit input when edit button clicked', async () => {
      const wrapper = await mountOpen();
      await wrapper.find('button[title="Edit description"]').trigger('click');
      expect(wrapper.find('input.form-input.text-xs').exists()).toBe(true);
    });

    it('saves updated description', async () => {
      const wrapper = await mountOpen();
      await wrapper.find('button[title="Edit description"]').trigger('click');
      await wrapper.find('input.form-input.text-xs').setValue('New description');
      await wrapper.find('button[title="Save"]').trigger('click');
      await flushPromises();
      expect(mockApi.updateDescription).toHaveBeenCalledWith(1, 'New description');
    });

    it('shows error when save fails', async () => {
      mockApi.updateDescription.mockRejectedValue(new Error('Save failed'));
      const wrapper = await mountOpen();
      await wrapper.find('button[title="Edit description"]').trigger('click');
      await wrapper.find('button[title="Save"]').trigger('click');
      await flushPromises();
      expect(wrapper.text()).toContain('Save failed');
    });
  });

  describe('deleteDoc', () => {
    it('removes document from list', async () => {
      const wrapper = await mountOpen();
      expect(wrapper.text()).toContain('tax2025.pdf');
      await wrapper.find('button[title="Delete"]').trigger('click');
      await flushPromises();
      expect(mockApi.deleteDocument).toHaveBeenCalledWith(1);
      expect(wrapper.emitted('deleted')).toBeTruthy();
    });

    it('shows error on delete failure', async () => {
      mockApi.deleteDocument.mockRejectedValue(new Error('Delete failed'));
      const wrapper = await mountOpen();
      await wrapper.find('button[title="Delete"]').trigger('click');
      await flushPromises();
      expect(wrapper.text()).toContain('Delete failed');
    });
  });
});
