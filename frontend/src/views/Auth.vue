<template>
  <div class="min-h-screen w-full bg-gradient-to-b from-gray-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      <!-- Header -->
      <div class="bg-gradient-to-br from-blue-600 to-blue-700 px-8 py-12 text-center">
        <h1 class="text-white text-3xl font-bold m-0 mb-2 tracking-tight">WealthTrack</h1>
        <p class="text-blue-100 text-sm font-medium m-0">
          {{ mode === 'login' ? 'Welcome back' : 'Create your account' }}
        </p>
      </div>

      <!-- Tabs -->
      <AuthTabs v-model:mode="mode" />

      <!-- Form Section -->
      <div class="px-8 py-10">
        <AuthMessage :message="message" />

        <AuthForm
          :mode="mode"
          :is-submitting="isSubmitting"
          :errors="errors"
          :form-data="form"
          @submit="handleSubmit"
        />

        <!-- Switch Link -->
        <p class="text-center text-gray-600 text-sm mt-8 mb-0">
          <span v-if="mode === 'login'">
            Don't have an account?
            <button
              type="button"
              class="text-blue-600 font-semibold no-underline hover:text-blue-700 hover:underline transition-colors border-none bg-transparent cursor-pointer"
              @click="mode = 'register'"
            >
              Register
            </button>
          </span>
          <span v-else>
            Already have an account?
            <button
              type="button"
              class="text-blue-600 font-semibold no-underline hover:text-blue-700 hover:underline transition-colors border-none bg-transparent cursor-pointer"
              @click="mode = 'login'"
            >
              Login
            </button>
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { apiService } from '@/services/ApiService';
import { ValidationService } from '@/services/ValidationService';
import { authModule } from '@/modules/auth';
import { debug } from '@/utils/debug';
import AuthTabs from '@views/AuthTabs.vue';
import AuthMessage from '@views/AuthMessage.vue';
import AuthForm from '@views/AuthForm.vue';
import type { UserLogin, UserRegistration } from '@/models/User';

const router = useRouter();

type AuthMode = 'login' | 'register';

interface Props {
  initialMode?: AuthMode;
}

const props = withDefaults(defineProps<Props>(), {
  initialMode: 'login',
});

const mode = ref<AuthMode>(props.initialMode);
const isSubmitting = ref(false);

const form = reactive({
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

const message = reactive<{ text: string; type: 'error' | 'success' }>({
  text: '',
  type: 'error',
});

const clearMessage = () => {
  message.text = '';
};

const showError = (text: string) => {
  message.text = text;
  message.type = 'error';
  setTimeout(clearMessage, 5000);
};

const showSuccess = (text: string) => {
  message.text = text;
  message.type = 'success';
  setTimeout(clearMessage, 5000);
};

const clearErrors = () => {
  errors.firstName = '';
  errors.lastName = '';
  errors.email = '';
  errors.password = '';
};

const setErrors = (fieldErrors: Record<string, string>) => {
  clearErrors();
  Object.entries(fieldErrors).forEach(([key, value]) => {
    errors[key] = value;
  });
};

const handleSubmit = async (formData: typeof form) => {
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  clearMessage();
  clearErrors();

  try {
    if (mode.value === 'login') {
      const validation = ValidationService.validateLoginForm(formData);

      if (!validation.isValid) {
        setErrors(validation.errors);
        isSubmitting.value = false;
        return;
      }

      const loginData: UserLogin = {
        email: formData.email,
        password: formData.password,
      };

      const authToken = await apiService.loginUser(loginData);
      debug.log('[Auth] Login response received:', authToken);

      if (authToken.accessToken) {
        debug.log('[Auth] Storing token:', authToken.accessToken.substring(0, 20) + '...');
        authModule.setToken(authToken.accessToken);
        debug.log('[Auth] Token stored successfully');
      } else {
        debug.error('[Auth] No accessToken in response:', authToken);
        throw new Error('No access token in login response');
      }

      // Fetch and store current user info (auth state is reactive, header auto-updates)
      const user = await apiService.getCurrentUser();
      authModule.setUser(user);
      router.push({ name: 'dashboard' });
    } else {
      const validation = ValidationService.validateRegistrationForm(formData);

      if (!validation.isValid) {
        setErrors(validation.errors);
        isSubmitting.value = false;
        return;
      }

      const registrationData: UserRegistration = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
      };

      const user = await apiService.registerUser(registrationData);
      debug.log('[Auth] Registration response:', user);

      showSuccess('Registration successful! Redirecting to login...');

      setTimeout(() => {
        mode.value = 'login';
        form.firstName = '';
        form.lastName = '';
        form.email = '';
        form.password = '';
      }, 1500);
    }
  } catch (error) {
    let errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage || errorMessage.trim().length === 0) {
      errorMessage = mode.value === 'login' ? 'Login failed. Please try again.' : 'Registration failed. Please try again.';
    }
    showError(errorMessage);
  } finally {
    isSubmitting.value = false;
  }
};
</script>
