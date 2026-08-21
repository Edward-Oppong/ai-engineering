import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Vercel-compatible absolute base; Electron loads dist/index.html directly
  server: {
    port: 3000,
    open: false,
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 3000,
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
