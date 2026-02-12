import { ref, watch, type Ref } from 'vue';

export interface InstitutionFormData {
  name: string;
  parentId: number;
}

export interface InstitutionFormProps {
  open: boolean;
  initialName?: string;
  initialParentId?: number | null;
}

export function useInstitutionForm(props: Ref<InstitutionFormProps>): { formData: Ref<InstitutionFormData>; resetForm: () => void } {
  const formData = ref<InstitutionFormData>({
    name: props.value.initialName || '',
    parentId: props.value.initialParentId || 0,
  });

  const resetForm = (): void => {
    formData.value = {
      name: '',
      parentId: 0,
    };
  };

  watch(
    () => props.value.open,
    (open) => {
      if (open) {
        formData.value.name = props.value.initialName || '';
        formData.value.parentId = props.value.initialParentId || 0;
      }
    },
  );

  return { formData, resetForm };
}
