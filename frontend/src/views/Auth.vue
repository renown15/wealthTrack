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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AuthTabs from '@views/AuthTabs.vue';
import AuthMessage from '@views/AuthMessage.vue';
import AuthForm from '@views/AuthForm.vue';
import { useAuthFormState } from '@/composables/useAuthFormState';
import { useAuthMessages } from '@/composables/useAuthMessages';
import { useAuthService } from '@/composables/useAuthService';

const router = useRouter();
type AuthMode = 'login' | 'register';

interface Props {
  initialMode?: AuthMode;
}

const props = withDefaults(defineProps<Props>(), {
  initialMode: 'login',
});

const mode = ref<AuthMode>(props.initialMode);

// Use split composables
const { form, errors, resetForm } = useAuthFormState();
const { message, clearMessage, showError, showSuccess } = useAuthMessages();
const { isSubmitting, handleLogin, handleRegister } = useAuthService();

const handleSubmit = async (formData: typeof form) => {
  if (isSubmitting.value) return;

  clearMessage();

  try {
    if (mode.value === 'login') {
      const result = await handleLogin({
        email: formData.email,
        password: formData.password,
      });
      if (result.success) {
        await router.push({ name: 'dashboard' });
      } else {
        showError(result.error || 'Login failed');
      }
    } else {
      const result = await handleRegister({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      if (result.success) {
        showSuccess('Registration successful! Redirecting...');
        setTimeout(() => {
          mode.value = 'login';
          resetForm();
        }, 2000);
      } else {
        showError(result.error || 'Registration failed');
      }
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    showError(errorMessage);
  }
};
</script>