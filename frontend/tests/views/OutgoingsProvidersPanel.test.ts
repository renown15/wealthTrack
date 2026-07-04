import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount, flushPromises } from '@vue/test-utils';
import OutgoingsProvidersPanel from '@views/OutgoingsHub/OutgoingsProvidersPanel.vue';
import InstitutionModal from '@views/AccountHub/InstitutionModal.vue';
import InstitutionCredentialsModal from '@views/AccountHub/InstitutionCredentialsModal.vue';
import DeleteConfirmModal from '@views/AccountHub/DeleteConfirmModal.vue';
import { apiService } from '@services/ApiService';

vi.mock('@services/ApiService', () => ({
  apiService: {
    createInstitution: vi.fn().mockResolvedValue({ id: 9 }),
    updateInstitution: vi.fn().mockResolvedValue({ id: 1 }),
    deleteInstitution: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/services/InstitutionCredentialsService', () => ({
  institutionCredentialsService: {
    listCredentials: vi.fn().mockResolvedValue([]),
    createCredential: vi.fn(),
    updateCredential: vi.fn(),
    deleteCredential: vi.fn(),
  },
}));

vi.mock('@composables/useToast', () => ({
  useToast: () => ({ showSuccess: vi.fn(), showError: vi.fn() }),
}));

const providers = [
  { id: 1, name: 'British Gas', institutionType: 'Utility Provider', parentId: null },
  { id: 2, name: 'BG Sub', institutionType: 'Household', parentId: 1 },
] as never[];

function mountPanel() {
  return shallowMount(OutgoingsProvidersPanel, {
    props: { providers, institutionTypes: [], credentialTypes: [] },
  });
}

describe('OutgoingsProvidersPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders a row per provider with type and resolved parent name', () => {
    const w = mountPanel();
    expect(w.text()).toContain('British Gas');
    expect(w.text()).toContain('Household');
    expect(w.text()).toContain('BG Sub');
  });

  it('openCreate (exposed) opens the modal in create mode', async () => {
    const w = mountPanel();
    (w.vm as unknown as { openCreate: () => void }).openCreate();
    await w.vm.$nextTick();
    const modal = w.findComponent(InstitutionModal);
    expect(modal.props('open')).toBe(true);
    expect(modal.props('type')).toBe('create');
  });

  it('creates a provider on save and emits changed', async () => {
    const w = mountPanel();
    (w.vm as unknown as { openCreate: () => void }).openCreate();
    w.findComponent(InstitutionModal).vm.$emit('save', { name: 'New', institutionType: 'Household' });
    await flushPromises();
    expect(apiService.createInstitution).toHaveBeenCalledWith(
      { name: 'New', parentId: null, institutionType: 'Household' });
    expect(w.emitted('changed')).toBeTruthy();
  });

  it('updates a provider on edit save and emits changed', async () => {
    const w = mountPanel();
    await w.findAll('button').find((b) => b.attributes('title') === 'Edit')!.trigger('click');
    const modal = w.findComponent(InstitutionModal);
    expect(modal.props('type')).toBe('edit');
    modal.vm.$emit('save', { name: 'BG 2', institutionType: 'Utility Provider', parentId: 2 });
    await flushPromises();
    expect(apiService.updateInstitution).toHaveBeenCalledWith(
      1, { name: 'BG 2', parentId: 2, institutionType: 'Utility Provider' });
    expect(w.emitted('changed')).toBeTruthy();
  });

  it('opens the credentials modal for a provider', async () => {
    const w = mountPanel();
    await w.findAll('button').find((b) => b.text() === 'Creds')!.trigger('click');
    await flushPromises();
    expect(w.findComponent(InstitutionCredentialsModal).props('open')).toBe(true);
  });

  it('deletes a provider after confirm and emits changed', async () => {
    const w = mountPanel();
    await w.findAll('button').find((b) => b.attributes('title') === 'Delete')!.trigger('click');
    w.findComponent(DeleteConfirmModal).vm.$emit('confirm');
    await flushPromises();
    expect(apiService.deleteInstitution).toHaveBeenCalledWith(1);
    expect(w.emitted('changed')).toBeTruthy();
  });
});
