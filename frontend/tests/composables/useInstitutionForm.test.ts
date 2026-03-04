/**
 * Tests for useInstitutionForm composable.
 */
import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useInstitutionForm } from '@composables/useInstitutionForm';
import type { InstitutionFormProps } from '@composables/useInstitutionForm';

describe('useInstitutionForm', () => {
  it('initialises form data from props', () => {
    const props = ref<InstitutionFormProps>({
      open: false,
      initialName: 'My Bank',
      initialParentId: 5,
      initialInstitutionType: 'Bank',
    });
    const { formData } = useInstitutionForm(props);
    expect(formData.value.name).toBe('My Bank');
    expect(formData.value.parentId).toBe(5);
    expect(formData.value.institutionType).toBe('Bank');
  });

  it('uses defaults when optional props are absent', () => {
    const props = ref<InstitutionFormProps>({ open: false });
    const { formData } = useInstitutionForm(props);
    expect(formData.value.name).toBe('');
    expect(formData.value.parentId).toBe(0);
    expect(formData.value.institutionType).toBeNull();
  });

  it('resetForm clears the form data', () => {
    const props = ref<InstitutionFormProps>({ open: false, initialName: 'My Bank' });
    const { formData, resetForm } = useInstitutionForm(props);
    resetForm();
    expect(formData.value.name).toBe('');
    expect(formData.value.parentId).toBe(0);
    expect(formData.value.institutionType).toBeNull();
  });

  it('resets form with initial values when modal opens', async () => {
    const props = ref<InstitutionFormProps>({
      open: false,
      initialName: 'Updated Bank',
      initialInstitutionType: 'Building Society',
    });
    const { formData } = useInstitutionForm(props);

    // Simulate modal opening
    props.value = { ...props.value, open: true };
    await Promise.resolve(); // allow watch to run

    expect(formData.value.name).toBe('Updated Bank');
    expect(formData.value.institutionType).toBe('Building Society');
  });
});
