import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import AccountDocumentsSection from '@/views/AccountHub/AccountDocumentsSection.vue';

vi.mock('@/services/AccountDocumentService', () => ({
  accountDocumentService: {
    listDocuments: vi.fn(),
    uploadDocument: vi.fn(),
    downloadDocument: vi.fn(),
    deleteDocument: vi.fn(),
  },
}));

vi.mock('@/utils/imageCompression', () => ({
  compressFile: vi.fn().mockImplementation((f: File) => Promise.resolve(f)),
}));

vi.mock('@/utils/debug', () => ({ debug: { log: vi.fn(), error: vi.fn() } }));

import { accountDocumentService } from '@/services/AccountDocumentService';

const mockDoc = {
  id: 1, accountId: 5, filename: 'report.pdf',
  description: null, contentType: null, createdAt: '2025-03-15T10:00:00Z',
};

const mockApi = vi.mocked(accountDocumentService);

describe('AccountDocumentsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.listDocuments.mockResolvedValue([mockDoc]);
    mockApi.uploadDocument.mockResolvedValue(mockDoc);
    mockApi.downloadDocument.mockResolvedValue(new Blob(['data']));
    mockApi.deleteDocument.mockResolvedValue(undefined as never);
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  describe('loadDocuments', () => {
    it('fetches documents on mount', async () => {
      mount(AccountDocumentsSection, { props: { accountId: 5 } });
      await flushPromises();
      expect(mockApi.listDocuments).toHaveBeenCalledWith(5);
    });

    it('skips loading when accountId is 0', async () => {
      mount(AccountDocumentsSection, { props: { accountId: 0 } });
      await flushPromises();
      expect(mockApi.listDocuments).not.toHaveBeenCalled();
    });

    it('shows error message on load failure', async () => {
      mockApi.listDocuments.mockRejectedValue(new Error('Network error'));
      const wrapper = mount(AccountDocumentsSection, { props: { accountId: 5 } });
      await flushPromises();
      expect(wrapper.text()).toContain('Network error');
    });

    it('reloads when accountId prop changes', async () => {
      const wrapper = mount(AccountDocumentsSection, { props: { accountId: 5 } });
      await flushPromises();
      await wrapper.setProps({ accountId: 7 });
      await flushPromises();
      expect(mockApi.listDocuments).toHaveBeenCalledWith(7);
    });
  });

  describe('formatDate', () => {
    it('formats createdAt as readable locale date', async () => {
      const wrapper = mount(AccountDocumentsSection, { props: { accountId: 5 } });
      await flushPromises();
      expect(wrapper.text()).toMatch(/Mar|15|2025/);
    });
  });

  describe('downloadDoc', () => {
    it('calls downloadDocument service and creates blob URL', async () => {
      const wrapper = mount(AccountDocumentsSection, { props: { accountId: 5 } });
      await flushPromises();
      await wrapper.find('button[title="Download"]').trigger('click');
      await flushPromises();
      expect(mockApi.downloadDocument).toHaveBeenCalledWith(1);
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    });

    it('shows error on download failure', async () => {
      mockApi.downloadDocument.mockRejectedValue(new Error('Download failed'));
      const wrapper = mount(AccountDocumentsSection, { props: { accountId: 5 } });
      await flushPromises();
      await wrapper.find('button[title="Download"]').trigger('click');
      await flushPromises();
      expect(wrapper.text()).toContain('Download failed');
    });
  });

  describe('deleteDoc', () => {
    it('removes document from list after successful delete', async () => {
      const wrapper = mount(AccountDocumentsSection, { props: { accountId: 5 } });
      await flushPromises();
      expect(wrapper.text()).toContain('report.pdf');
      await wrapper.find('button[title="Delete"]').trigger('click');
      await flushPromises();
      expect(mockApi.deleteDocument).toHaveBeenCalledWith(1);
      expect(wrapper.text()).not.toContain('report.pdf');
    });

    it('shows error on delete failure', async () => {
      mockApi.deleteDocument.mockRejectedValue(new Error('Delete failed'));
      const wrapper = mount(AccountDocumentsSection, { props: { accountId: 5 } });
      await flushPromises();
      await wrapper.find('button[title="Delete"]').trigger('click');
      await flushPromises();
      expect(wrapper.text()).toContain('Delete failed');
    });
  });

  describe('onFileChange', () => {
    it('uploads file and adds it to the document list', async () => {
      mockApi.listDocuments.mockResolvedValue([]);
      const wrapper = mount(AccountDocumentsSection, { props: { accountId: 5 } });
      await flushPromises();

      const newDoc = { ...mockDoc, id: 2, filename: 'new.pdf' };
      mockApi.uploadDocument.mockResolvedValue(newDoc);

      const file = new File(['content'], 'new.pdf', { type: 'application/pdf' });
      const input = wrapper.find('input[type="file"]').element as HTMLInputElement;
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      await wrapper.find('input[type="file"]').trigger('change');
      await flushPromises();

      expect(mockApi.uploadDocument).toHaveBeenCalledWith(5, file);
      expect(wrapper.text()).toContain('new.pdf');
    });

    it('shows error on upload failure', async () => {
      mockApi.listDocuments.mockResolvedValue([]);
      mockApi.uploadDocument.mockRejectedValue(new Error('Upload failed'));
      const wrapper = mount(AccountDocumentsSection, { props: { accountId: 5 } });
      await flushPromises();

      const file = new File(['content'], 'bad.pdf', { type: 'application/pdf' });
      const input = wrapper.find('input[type="file"]').element as HTMLInputElement;
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      await wrapper.find('input[type="file"]').trigger('change');
      await flushPromises();

      expect(wrapper.text()).toContain('Upload failed');
    });
  });
});
