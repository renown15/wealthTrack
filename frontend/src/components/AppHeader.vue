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

<style scoped>
.nav-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
}
.nav-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}
.nav-btn:active,
.nav-btn.active {
  background: rgba(255, 255, 255, 0.2);
  border-color: white;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
