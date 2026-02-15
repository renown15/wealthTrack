import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['node_modules/**', 'tests/e2e/**'],
    isolate: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'vite.config.ts',
        'vitest.config.ts',
        'uno.config.ts',
        '*.config.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 55,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@controllers': resolve(__dirname, './src/controllers'),
      '@services': resolve(__dirname, './src/services'),
      '@views': resolve(__dirname, './src/views'),
      '@models': resolve(__dirname, './src/models'),
      '@composables': resolve(__dirname, './src/composables'),
      '@styles': resolve(__dirname, './src/styles'),
      '@utils': resolve(__dirname, './src/utils'),
      '@modules': resolve(__dirname, './src/modules'),
      'virtual:uno.css': resolve(__dirname, './vitest.empty.css'),
    },
  },
});
