import { ref, reactive, type Ref } from 'vue';
import { apiService } from '@/services/ApiService';
import { ValidationService } from '@/services/ValidationService';
import { authModule } from '@/modules/auth';
import { debug } from '@/utils/debug';
import type { UserLogin, UserRegistration } from '@/models/User';

interface Form {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface MessageState {
  text: string;
  type: 'error' | 'success';
}

export function useBasicAuthForm(): {
  isSubmitting: Ref<boolean>;
  form: Form;
  errors: Record<string, string>;
  message: MessageState;
  clearMessage: () => void;
  showError: (text: string) => void;
  showSuccess: (text: string) => void;
  clearErrors: () => void;
  setErrors: (fieldErrors: Record<string, string>) => void;
  resetForm: () => void;
  handleLogin: () => Promise<{ success: boolean; user?: unknown }>;
  handleRegister: () => Promise<{ success: boolean }>;
} {
  const isSubmitting = ref(false);

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

  const message = reactive<MessageState>({
    text: '',
    type: 'error',
  });

  const clearMessage = (): void => {
    message.text = '';
  };

  const showError = (text: string): void => {
    message.text = text;
    message.type = 'error';
    setTimeout(clearMessage, 5000);
  };

  const showSuccess = (text: string): void => {
    message.text = text;
    message.type = 'success';
    setTimeout(clearMessage, 5000);
  };

  const clearErrors = (): void => {
    errors.firstName = '';
    errors.lastName = '';
    errors.email = '';
    errors.password = '';
  };

  const setErrors = (fieldErrors: Record<string, string>): void => {
    clearErrors();
    Object.entries(fieldErrors).forEach(([key, value]) => {
      errors[key] = value;
    });
  };

  const resetForm = (): void => {
    form.firstName = '';
    form.lastName = '';
    form.email = '';
    form.password = '';
  };

  const handleLogin = async (): Promise<{
    success: boolean;
    user?: unknown;
  }> => {
    const validation = ValidationService.validateLoginForm(form);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return { success: false };
    }

    const loginData: UserLogin = {
      email: form.email,
      password: form.password,
    };

    const authToken = await apiService.loginUser(loginData);
    debug.log('[Auth] Login response received:', authToken);

    if (authToken.accessToken) {
      debug.log(
        '[Auth] Storing token:',
        authToken.accessToken.substring(0, 20) + '...'
      );
      authModule.setToken(authToken.accessToken);
    } else {
      debug.error('[Auth] No accessToken in response:', authToken);
      throw new Error('No access token in login response');
    }

    const user = await apiService.getCurrentUser();
    authModule.setUser(user);
    return { success: true, user };
  };

  const handleRegister = async (): Promise<{ success: boolean }> => {
    const validation = ValidationService.validateRegistrationForm(form);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return { success: false };
    }

    const registrationData: UserRegistration = {
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      password: form.password,
    };

    await apiService.registerUser(registrationData);
    debug.log('[Auth] Registration successful');
    showSuccess('Registration successful! Redirecting to login...');
    return { success: true };
  };

  return {
    isSubmitting,
    form,
    errors,
    message,
    clearMessage,
    showError,
    showSuccess,
    clearErrors,
    setErrors,
    resetForm,
    handleLogin,
    handleRegister,
  };
}
