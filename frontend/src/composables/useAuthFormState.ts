import { reactive } from 'vue';

interface Form {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface UseAuthFormStateReturn {
  form: Form;
  errors: Record<string, string>;
  clearErrors: () => void;
  setErrors: (fieldErrors: Record<string, string>) => void;
  resetForm: () => void;
}

/**
 * Pure form state management composable
 * No dependencies on services or API
 */
export function useAuthFormState(): UseAuthFormStateReturn {
  const form = reactive<Form>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const errors = reactive<Record<string, string>>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const clearErrors = (): void => {
    Object.keys(errors).forEach((key) => {
      errors[key] = '';
    });
  };

  const setErrors = (fieldErrors: Record<string, string>): void => {
    clearErrors();
    Object.entries(fieldErrors).forEach(([key, value]) => {
      if (key in errors) {
        errors[key] = value;
      }
    });
  };

  const resetForm = (): void => {
    form.firstName = '';
    form.lastName = '';
    form.email = '';
    form.password = '';
    clearErrors();
  };

  return {
    form,
    errors,
    clearErrors,
    setErrors,
    resetForm,
  };
}
