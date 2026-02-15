<template>
  <header class="blue-banner">
    <div class="banner-container">
      <div class="brand-stack">
        <h1 class="logo">WealthTrack</h1>
        <p class="tagline">Strategic wealth intelligence</p>
      </div>
      <nav v-if="isAuth" class="nav">
        <span class="text-sm font-medium text-white">{{ userName }}</span>
        <router-link
          to="/dashboard"
          class="nav-btn"
          :class="{ active: isRoute('dashboard') }"
        >
          Account Hub
        </router-link>
        <router-link
          to="/reference-data"
          class="nav-btn"
          :class="{ active: isRoute('reference-data') }"
        >
          Reference Data
        </router-link>
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
