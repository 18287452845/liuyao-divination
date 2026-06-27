import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
          if (id.includes('react-markdown') || id.includes('remark-') || id.includes('rehype-') || id.includes('unified')) {
            return 'markdown';
          }
          if (id.includes('lunar-javascript')) return 'calendar';
          return 'vendor';
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
