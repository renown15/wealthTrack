import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig(async () => {
  const UnoCSS = (await import('unocss/vite')).default;

  return {
    plugins: [vue(), UnoCSS()],
    root: '.',
    publicDir: 'public',
    server: {
      port: 3001,
      host: true,
      strictPort: true,
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
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
