import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import TaxDocumentsModal from '@/views/TaxHub/TaxDocumentsModal.vue';
import DocumentUploadPanel from '@/views/TaxHub/DocumentUploadPanel.vue';
import type { EligibleAccount } from '@models/TaxModels';

vi.mock('@/utils/imageCompression', () => ({
  compressFile: vi.fn().mockImplementation((f: File) => Promise.resolve(f)),
}));

const mockDoc = {
  id: 1, taxReturnId: 10, filename: 'statement.pdf', description: 'My doc', contentType: 'application/pdf',
  createdAt: '2025-03-15T09:00:00Z',
};

const makeAccount = (overrides: Partial<EligibleAccount> = {}): EligibleAccount => ({
  accountId: 5,
  accountName: 'Savings Account',
  accountType: 'Cash ISA',
  institutionName: 'Barclays',
  interestRate: null,
  accountStatus: null,
  accountNumber: null,
  sortCode: null,
  documents: [mockDoc],
  ...overrides,
});

describe('TaxDocumentsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders account name in title', () => {
    const wrapper = mount(TaxDocumentsModal, {
      props: { open: true, account: makeAccount() },
    });
    expect(wrapper.text()).toContain('Savings Account');
  });

  it('shows account type and institution', () => {
    const wrapper = mount(TaxDocumentsModal, {
      props: { open: true, account: makeAccount() },
    });
    expect(wrapper.text()).toContain('Cash ISA');
    expect(wrapper.text()).toContain('Barclays');
  });

  it('shows empty state when account has no documents', () => {
    const wrapper = mount(TaxDocumentsModal, {
      props: { open: true, account: makeAccount({ documents: [] }) },
    });
    expect(wrapper.text()).toContain('No documents uploaded yet');
  });

  it('shows document list when documents exist', () => {
    const wrapper = mount(TaxDocumentsModal, {
      props: { open: true, account: makeAccount() },
    });
    expect(wrapper.text()).toContain('statement.pdf');
  });

  describe('formatDate', () => {
    it('formats ISO date string as locale date', () => {
      const wrapper = mount(TaxDocumentsModal, {
        props: { open: true, account: makeAccount() },
      });
      expect(wrapper.text()).toMatch(/Mar|2025/);
    });

    it('returns empty string for empty date', () => {
      const doc = { ...mockDoc, createdAt: '' };
      const wrapper = mount(TaxDocumentsModal, {
        props: { open: true, account: makeAccount({ documents: [doc] }) },
      });
      const rows = wrapper.findAll('tbody tr');
      expect(rows[0].findAll('td')[2].text()).toBe('');
    });
  });

  describe('upload panel', () => {
    it('renders the DocumentUploadPanel', () => {
      const wrapper = mount(TaxDocumentsModal, {
        props: { open: true, account: makeAccount() },
      });
      expect(wrapper.findComponent(DocumentUploadPanel).exists()).toBe(true);
    });

    it("re-emits the panel's upload event to its parent", async () => {
      const wrapper = mount(TaxDocumentsModal, {
        props: { open: true, account: makeAccount() },
      });
      const file = new File(['pdf'], 'combined.pdf', { type: 'application/pdf' });
      await wrapper.findComponent(DocumentUploadPanel).vm.$emit('upload', file, 'Statement');
      expect(wrapper.emitted('upload')?.[0]).toEqual([file, 'Statement']);
    });
  });

  describe('document action buttons', () => {
    it('emits preview when view button clicked', async () => {
      const wrapper = mount(TaxDocumentsModal, {
        props: { open: true, account: makeAccount() },
      });
      await wrapper.find('button[title="View"]').trigger('click');
      expect(wrapper.emitted('preview')?.[0]).toEqual([1, 'statement.pdf', 'application/pdf']);
    });

    it('emits download when download button clicked', async () => {
      const wrapper = mount(TaxDocumentsModal, {
        props: { open: true, account: makeAccount() },
      });
      await wrapper.find('button[title="Download"]').trigger('click');
      expect(wrapper.emitted('download')?.[0]).toEqual([1, 'statement.pdf']);
    });

    it('emits deleteDoc when delete button clicked', async () => {
      const wrapper = mount(TaxDocumentsModal, {
        props: { open: true, account: makeAccount() },
      });
      await wrapper.find('button[title="Delete"]').trigger('click');
      expect(wrapper.emitted('deleteDoc')?.[0]).toEqual([1]);
    });
  });

  describe('description editing', () => {
    it('shows description text in table', () => {
      const wrapper = mount(TaxDocumentsModal, {
        props: { open: true, account: makeAccount() },
      });
      expect(wrapper.text()).toContain('My doc');
    });

    it('shows — when description is null', () => {
      const doc = { ...mockDoc, description: null };
      const wrapper = mount(TaxDocumentsModal, {
        props: { open: true, account: makeAccount({ documents: [doc] }) },
      });
      const rows = wrapper.findAll('tbody tr');
      expect(rows[0].findAll('td')[1].text()).toContain('—');
    });

    it('shows edit input when edit description button clicked', async () => {
      const wrapper = mount(TaxDocumentsModal, {
        props: { open: true, account: makeAccount() },
      });
      await wrapper.find('button[title="Edit description"]').trigger('click');
      expect(wrapper.find('input[type="text"]').exists()).toBe(true);
    });

    it('emits updateDescription when save clicked', async () => {
      const wrapper = mount(TaxDocumentsModal, {
        props: { open: true, account: makeAccount() },
      });
      await wrapper.find('button[title="Edit description"]').trigger('click');
      const input = wrapper.find('td input[type="text"]');
      await input.setValue('Updated desc');
      await wrapper.find('button[title="Save"]').trigger('click');
      expect(wrapper.emitted('updateDescription')?.[0]).toEqual([1, 'Updated desc']);
    });

    it('cancels edit when cancel button clicked', async () => {
      const wrapper = mount(TaxDocumentsModal, {
        props: { open: true, account: makeAccount() },
      });
      await wrapper.find('button[title="Edit description"]').trigger('click');
      await wrapper.find('button[title="Cancel"]').trigger('click');
      expect(wrapper.find('td input[type="text"]').exists()).toBe(false);
    });
  });

  describe('emits close', () => {
    it('emits close when Close button clicked', async () => {
      const wrapper = mount(TaxDocumentsModal, {
        props: { open: true, account: makeAccount() },
      });
      await wrapper.find('button.btn-modal-secondary').trigger('click');
      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });
});
