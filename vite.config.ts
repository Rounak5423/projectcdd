import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('node_modules')) {
            if (normalized.includes('three') || normalized.includes('@react-three')) {
              return 'vendor-three';
            }
            if (normalized.includes('recharts')) {
              return 'vendor-charts';
            }
            if (normalized.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (normalized.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (normalized.includes('react') || normalized.includes('react-dom') || normalized.includes('react-router')) {
              return 'vendor-react';
            }
            return 'vendor-libs';
          }
          if (normalized.includes('src/features/council/three')) {
            return 'feature-council-3d';
          }
          if (normalized.includes('src/features/council')) {
            return 'feature-council';
          }
        },
      },
    },
  },
});
