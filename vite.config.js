import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Retire console.* et debugger du code de production uniquement
  // (remplace drop_console de terser ; les messages restent visibles en développement).
  esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : {},
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/ws/': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws/, '/ws')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // esbuild est intégré à Vite : terser et lightningcss n'étaient pas
    // installés, ce qui faisait échouer la construction de production.
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          ui: ['lucide-react', 'leaflet', 'react-leaflet'],
          axios: ['axios'],
        },
      },
    },
    reportCompressedSize: true,
  },
  // Tests du frontend (npm test) : navigateur simulé par jsdom.
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
}));
