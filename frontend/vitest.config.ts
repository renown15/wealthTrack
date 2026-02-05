import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.test.ts', '**/*.spec.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@controllers': resolve(__dirname, './src/controllers'),
      '@services': resolve(__dirname, './src/services'),
      '@views': resolve(__dirname, './src/views'),
      '@models': resolve(__dirname, './src/models'),
      '@composables': resolve(__dirname, './src/composables'),
      '@styles': resolve(__dirname, './src/styles'),
    },
  },
});
