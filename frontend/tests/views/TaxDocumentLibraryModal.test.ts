import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import TaxDocumentLibraryModal from '@views/TaxHub/TaxDocumentLibraryModal.vue';
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

describe('TaxDocumentLibraryModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiService.getTaxDocumentLibrary).mockResolvedValue(mockDocs);
    vi.mocked(apiService.deleteTaxDocument).mockResolvedValue(undefined);
  });

  it('does not render when closed', () => {
    const wrapper = mount(TaxDocumentLibraryModal, { props: { open: false } });
    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
    expect(apiService.getTaxDocumentLibrary).not.toHaveBeenCalled();
  });

  it('loads and lists documents with period and account columns when opened', async () => {
    const wrapper = mount(TaxDocumentLibraryModal, { props: { open: true } });
    await flushPromises();
    expect(apiService.getTaxDocumentLibrary).toHaveBeenCalled();
    const text = wrapper.text();
    expect(text).toContain('Document Library');
    expect(text).toContain('cert.pdf');
    expect(text).toContain('Cahoot Savings');
    expect(text).toContain('2026/27');
    expect(text).toContain('Chase Saver');
    expect(text).toContain('2025/26');
  });

  it('shows the empty state when there are no documents', async () => {
    vi.mocked(apiService.getTaxDocumentLibrary).mockResolvedValue([]);
    const wrapper = mount(TaxDocumentLibraryModal, { props: { open: true } });
    await flushPromises();
    expect(wrapper.text()).toContain('No documents uploaded yet');
  });

  it('deletes a document and drops its row', async () => {
    const wrapper = mount(TaxDocumentLibraryModal, { props: { open: true } });
    await flushPromises();
    await wrapper.find('button[title="Delete"]').trigger('click');
    await flushPromises();
    expect(apiService.deleteTaxDocument).toHaveBeenCalledWith(1);
    expect(wrapper.text()).not.toContain('cert.pdf');
    expect(wrapper.text()).toContain('p60.pdf');
  });

  it('emits close from the footer button', async () => {
    const wrapper = mount(TaxDocumentLibraryModal, { props: { open: true } });
    await flushPromises();
    await wrapper.find('.btn-modal-secondary').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
