import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  // Svelte 5's package exports map `default` (and `worker`) to the SSR stub.
  // Pin browser conditions so `mount()` resolves to the client runtime.
  resolve: {
    conditions: ['browser', 'module', 'import', 'default'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
