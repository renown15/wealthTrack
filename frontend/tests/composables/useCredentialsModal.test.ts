import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCredentialsModal } from '@composables/useCredentialsModal';
import { institutionCredentialsService } from '@services/InstitutionCredentialsService';

vi.mock('@/services/InstitutionCredentialsService', () => ({
  institutionCredentialsService: {
    listCredentials: vi.fn(),
    createCredential: vi.fn(),
    updateCredential: vi.fn(),
    deleteCredential: vi.fn(),
  },
}));

const mockSvc = vi.mocked(institutionCredentialsService);

const mockInstitution = {
  id: 5, userId: 1, name: 'Test Bank', parentId: null, institutionType: null,
  createdAt: '', updatedAt: '',
};
const mockCredential = {
  id: 10, institutionId: 5, typeId: 1, key: 'user', value: 'secret',
  createdAt: '', updatedAt: '',
};

describe('useCredentialsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSvc.listCredentials.mockResolvedValue([]);
  });

  describe('openCredentialsModal', () => {
    it('sets institution, opens modal, and loads credentials', async () => {
      mockSvc.listCredentials.mockResolvedValue([mockCredential]);
      const m = useCredentialsModal();
      await m.openCredentialsModal(mockInstitution);
      expect(m.credentialModalOpen.value).toBe(true);
      expect(m.credentialInstitution.value).toStrictEqual(mockInstitution);
      expect(m.credentials.value).toEqual([mockCredential]);
      expect(m.credentialLoading.value).toBe(false);
    });

    it('sets credentialError when fetch fails', async () => {
      mockSvc.listCredentials.mockRejectedValue(new Error('Forbidden'));
      const m = useCredentialsModal();
      await m.openCredentialsModal(mockInstitution);
      expect(m.credentialError.value).toBe('Forbidden');
    });
  });

  describe('closeCredentialsModal', () => {
    it('resets all state', async () => {
      mockSvc.listCredentials.mockResolvedValue([mockCredential]);
      const m = useCredentialsModal();
      await m.openCredentialsModal(mockInstitution);
      m.closeCredentialsModal();
      expect(m.credentialModalOpen.value).toBe(false);
      expect(m.credentialInstitution.value).toBeNull();
      expect(m.credentials.value).toEqual([]);
      expect(m.credentialError.value).toBeNull();
    });
  });

  describe('handleCredentialSave', () => {
    it('calls createCredential when no editingCredential', async () => {
      mockSvc.createCredential.mockResolvedValue(undefined);
      const m = useCredentialsModal();
      m.credentialInstitution.value = mockInstitution;
      await m.handleCredentialSave({ typeId: 1, value: 'secret' });
      expect(mockSvc.createCredential).toHaveBeenCalledWith(5, { typeId: 1, value: 'secret' });
      expect(mockSvc.listCredentials).toHaveBeenCalled();
    });

    it('calls updateCredential when editingCredential is set', async () => {
      mockSvc.updateCredential.mockResolvedValue(undefined);
      const m = useCredentialsModal();
      m.credentialInstitution.value = mockInstitution;
      m.editingCredential.value = mockCredential;
      await m.handleCredentialSave({ typeId: 1, value: 'new' });
      expect(mockSvc.updateCredential).toHaveBeenCalledWith(5, 10, { typeId: 1, value: 'new' });
      expect(m.editingCredential.value).toBeNull();
    });

    it('does nothing when no institution', async () => {
      const m = useCredentialsModal();
      await m.handleCredentialSave({ typeId: 1, value: 'x' });
      expect(mockSvc.createCredential).not.toHaveBeenCalled();
    });

    it('sets credentialError on save failure', async () => {
      mockSvc.createCredential.mockRejectedValue(new Error('Bad request'));
      const m = useCredentialsModal();
      m.credentialInstitution.value = mockInstitution;
      await m.handleCredentialSave({ typeId: 1, value: 'x' });
      expect(m.credentialError.value).toBe('Bad request');
    });
  });

  describe('handleCredentialEdit', () => {
    it('sets editingCredential', () => {
      const m = useCredentialsModal();
      m.handleCredentialEdit(mockCredential);
      expect(m.editingCredential.value).toStrictEqual(mockCredential);
    });
  });

  describe('cancelCredentialEdit', () => {
    it('clears editingCredential', () => {
      const m = useCredentialsModal();
      m.editingCredential.value = mockCredential;
      m.cancelCredentialEdit();
      expect(m.editingCredential.value).toBeNull();
    });
  });

  describe('handleCredentialDelete', () => {
    it('deletes and reloads credentials', async () => {
      mockSvc.deleteCredential.mockResolvedValue(undefined);
      const m = useCredentialsModal();
      m.credentialInstitution.value = mockInstitution;
      await m.handleCredentialDelete(10);
      expect(mockSvc.deleteCredential).toHaveBeenCalledWith(5, 10);
      expect(mockSvc.listCredentials).toHaveBeenCalled();
      expect(m.credentialDeletingId.value).toBeNull();
    });

    it('does nothing when no institution', async () => {
      const m = useCredentialsModal();
      await m.handleCredentialDelete(10);
      expect(mockSvc.deleteCredential).not.toHaveBeenCalled();
    });

    it('sets error on delete failure', async () => {
      mockSvc.deleteCredential.mockRejectedValue(new Error('Not found'));
      const m = useCredentialsModal();
      m.credentialInstitution.value = mockInstitution;
      await m.handleCredentialDelete(10);
      expect(m.credentialError.value).toBe('Not found');
    });
  });
});
