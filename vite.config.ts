import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' ? '/ai-engineering/' : './', // '/ai-engineering/' for GitHub Pages, './' for Electron/Vercel
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
