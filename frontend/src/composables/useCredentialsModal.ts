import { ref, type Ref } from 'vue';
import type { Institution } from '@/models/Portfolio';
import type { InstitutionCredential } from '@/models/InstitutionCredential';
import { institutionCredentialsService } from '@/services/InstitutionCredentialsService';

export interface CredentialFormPayload {
  typeId: number;
  value: string;
}

export interface UseCredentialsModalReturn {
  credentialModalOpen: Ref<boolean>;
  credentialInstitution: Ref<Institution | null>;
  credentials: Ref<InstitutionCredential[]>;
  credentialLoading: Ref<boolean>;
  credentialSaving: Ref<boolean>;
  credentialDeletingId: Ref<number | null>;
  credentialError: Ref<string | null>;
  editingCredential: Ref<InstitutionCredential | null>;
  openCredentialsModal: (institution: Institution) => Promise<void>;
  closeCredentialsModal: () => void;
  handleCredentialSave: (payload: CredentialFormPayload) => Promise<void>;
  handleCredentialEdit: (credential: InstitutionCredential) => void;
  cancelCredentialEdit: () => void;
  handleCredentialDelete: (credentialId: number) => Promise<void>;
}

export function useCredentialsModal(): UseCredentialsModalReturn {
  const credentialModalOpen = ref(false);
  const credentialInstitution = ref<Institution | null>(null);
  const credentials = ref<InstitutionCredential[]>([]);
  const credentialLoading = ref(false);
  const credentialSaving = ref(false);
  const credentialDeletingId = ref<number | null>(null);
  const credentialError = ref<string | null>(null);
  const editingCredential = ref<InstitutionCredential | null>(null);

  const fetchCredentials = async (institutionId: number): Promise<void> => {
    credentialLoading.value = true;
    credentialError.value = null;
    try {
      credentials.value = await institutionCredentialsService.listCredentials(institutionId);
    } catch (error) {
      credentialError.value = error instanceof Error ? error.message : 'Unable to load credentials';
    } finally {
      credentialLoading.value = false;
    }
  };

  const openCredentialsModal = async (institution: Institution): Promise<void> => {
    credentialInstitution.value = institution;
    credentialModalOpen.value = true;
    editingCredential.value = null;
    await fetchCredentials(institution.id);
  };

  const closeCredentialsModal = (): void => {
    credentialModalOpen.value = false;
    credentialInstitution.value = null;
    credentials.value = [];
    credentialError.value = null;
    editingCredential.value = null;
    credentialDeletingId.value = null;
  };

  const handleCredentialSave = async (payload: CredentialFormPayload): Promise<void> => {
    if (!credentialInstitution.value) return;
    credentialSaving.value = true;
    credentialError.value = null;
    try {
      if (editingCredential.value) {
        await institutionCredentialsService.updateCredential(
          credentialInstitution.value.id,
          editingCredential.value.id,
          payload,
        );
      } else {
        await institutionCredentialsService.createCredential(
          credentialInstitution.value.id,
          payload,
        );
      }
      await fetchCredentials(credentialInstitution.value.id);
      editingCredential.value = null;
    } catch (error) {
      credentialError.value = error instanceof Error ? error.message : 'Unable to save credential';
    } finally {
      credentialSaving.value = false;
    }
  };

  const handleCredentialEdit = (credential: InstitutionCredential): void => {
    editingCredential.value = credential;
  };

  const cancelCredentialEdit = (): void => {
    editingCredential.value = null;
  };

  const handleCredentialDelete = async (credentialId: number): Promise<void> => {
    if (!credentialInstitution.value) return;
    credentialDeletingId.value = credentialId;
    credentialError.value = null;
    try {
      await institutionCredentialsService.deleteCredential(
        credentialInstitution.value.id,
        credentialId,
      );
      await fetchCredentials(credentialInstitution.value.id);
    } catch (error) {
      credentialError.value = error instanceof Error ? error.message : 'Unable to delete credential';
    } finally {
      credentialDeletingId.value = null;
    }
  };

  return {
    credentialModalOpen,
    credentialInstitution,
    credentials,
    credentialLoading,
    credentialSaving,
    credentialDeletingId,
    credentialError,
    editingCredential,
    openCredentialsModal,
    closeCredentialsModal,
    handleCredentialSave,
    handleCredentialEdit,
    cancelCredentialEdit,
    handleCredentialDelete,
  };
}
