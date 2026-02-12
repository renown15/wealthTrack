<template>
  <form class="flex flex-col gap-5" @submit.prevent="onSubmit">
    <!-- Name Fields (Register only) -->
    <div v-if="mode === 'register'" class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-2">
        <label for="firstName" class="text-sm font-semibold text-gray-700">First Name</label>
        <input
          id="firstName"
          v-model="form.firstName"
          type="text"
          name="firstName"
          placeholder="John"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-base bg-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-transparent"
        />
        <span v-if="errors.firstName" class="text-red-600 text-xs font-medium">
          {{ errors.firstName }}
        </span>
      </div>
      <div class="flex flex-col gap-2">
        <label for="lastName" class="text-sm font-semibold text-gray-700">Last Name</label>
        <input
          id="lastName"
          v-model="form.lastName"
          type="text"
          name="lastName"
          placeholder="Doe"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-base bg-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-transparent"
        />
        <span v-if="errors.lastName" class="text-red-600 text-xs font-medium">
          {{ errors.lastName }}
        </span>
      </div>
    </div>

    <!-- Email -->
    <div class="flex flex-col gap-2">
      <label for="email" class="text-sm font-semibold text-gray-700">Email</label>
      <input
        id="email"
        v-model="form.email"
        type="email"
        name="email"
        placeholder="you@example.com"
        class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-base bg-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-transparent"
      />
      <span v-if="errors.email" class="text-red-600 text-xs font-medium">
        {{ errors.email }}
      </span>
    </div>

    <!-- Password -->
    <div class="flex flex-col gap-2">
      <label for="password" class="text-sm font-semibold text-gray-700">Password</label>
      <input
        id="password"
        v-model="form.password"
        type="password"
        name="password"
        :placeholder="mode === 'register' ? 'Min 8 chars (Upper, Lower, Digit)' : 'Your password'"
        class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-base bg-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-transparent"
      />
      <span v-if="errors.password" class="text-red-600 text-xs font-medium">
        {{ errors.password }}
      </span>
    </div>

    <!-- Submit Button -->
    <button
      type="submit"
      class="w-full mt-6 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg border-none cursor-pointer hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      :disabled="isSubmitting"
    >
      {{ isSubmitting ? (mode === 'login' ? 'Logging in...' : 'Registering...') : (mode === 'login' ? 'Login' : 'Register') }}
    </button>
  </form>
</template>

<script setup lang="ts">
type AuthMode = 'login' | 'register';

interface Props {
  mode: AuthMode;
  isSubmitting: boolean;
  errors: Record<string, string>;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  };
}

const emit = defineEmits<{
  submit: [FormData];
}>();

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const props = defineProps<Props>();

const form = props.formData;

const onSubmit = () => {
  emit('submit', {
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    password: form.password,
  });
};
</script>
