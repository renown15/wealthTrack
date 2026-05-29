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
    poolOptions: {
      forks: { maxForks: 4 },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'vite.config.ts',
        'vitest.config.ts',
        'uno.config.ts',
        '*.config.ts',
        // Entry points and infrastructure (not unit-testable)
        'src/index.ts',
        'src/App.vue',
        'src/router/index.ts',
        'src/components/AppFooter.vue',
        // Chart/browser-API components (not unit-testable)
        'src/views/Analytics.vue',
        'src/views/AnalyticsBreakdown.vue',
        'src/views/AnalyticsHistory.vue',
        'src/utils/exportToExcel.ts',
        // Complex orchestration components covered by integration tests
        'src/views/AccountHub/ShareSaleModal.vue',
        'src/views/TaxHub/TaxHub.vue',
        'src/views/AccountHub/AccountHubModals.vue',
        // Analytics sub-components (parent views already excluded above)
        'src/views/AnalyticsDetailPane.vue',
        'src/views/AnalyticsEditModal.vue',
        // Browser-API-only utilities (Canvas/File APIs not available in happy-dom)
        'src/utils/imageCompression.ts',
        // Pure constant/icon exports — no functions to test
        'src/constants/**',
        // TaxHub modal sub-components (parent TaxHub.vue already excluded)
        'src/views/TaxHub/AddTaxPeriodModal.vue',
        'src/views/TaxHub/DocumentPreviewModal.vue',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
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

