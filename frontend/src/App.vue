<template>
  <div class="app-shell">
    <AppHeader />
    <main class="main">
      <div class="main-inner">
        <router-view />
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@components/AppHeader.vue';
import AppFooter from '@components/AppFooter.vue';
</script>
