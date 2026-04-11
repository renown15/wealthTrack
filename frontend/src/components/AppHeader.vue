<template>
  <header class="blue-banner">
    <div class="flex flex-wrap items-center justify-between gap-2 max-w-[1200px] mx-auto">
      <div class="flex items-center gap-3">
        <div class="brand-stack">
          <h1 class="logo">WealthTrack</h1>
          <p class="tagline hidden sm:block">Strategic wealth intelligence</p>
        </div>
        <div v-if="envLabel" class="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-yellow-400 text-gray-900">
          {{ envLabel }}
        </div>
      </div>
      <nav v-if="isAuth" class="flex flex-wrap items-center gap-1 sm:gap-2">
        <span class="text-xs font-medium text-white/70 mr-1">{{ userName }}</span>
        <router-link to="/dashboard" class="nav-btn" :class="{ active: isRoute('dashboard') }">Account Hub</router-link>
        <router-link to="/analytics" class="nav-btn" :class="{ active: isRoute('analytics') }">Analytics</router-link>
        <router-link to="/tax" class="nav-btn" :class="{ active: isRoute('tax') }">Tax Hub</router-link>
        <router-link to="/reference-data" class="nav-btn hidden md:inline-flex" :class="{ active: isRoute('reference-data') }">Reference Data</router-link>
        <button class="nav-btn" @click="logout">Logout</button>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { authState, authModule } from '@/modules/auth';

const router = useRouter();
const route = useRoute();

const isAuth = computed(() => authState.isAuthenticated && authState.token !== null);
const envLabel = computed(() => {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return null;
  return host;
});
const userName = computed(() => {
  const user = authState.user;
  return user ? `${user.firstName} ${user.lastName}`.trim() : '';
});

function isRoute(name: string): boolean {
  return route.name === name;
}

function logout(): void {
  authModule.clearToken();
  void router.push({ name: 'login' });
}
</script>
