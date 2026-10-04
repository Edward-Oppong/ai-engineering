import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Connect } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Redirect raw project-root file requests (e.g. /README.md) back to the
    // SPA so the React router handles them instead of Vite serving the file.
    {
      name: 'spa-fallback-guard',
      configureServer(server) {
        server.middlewares.use((req: Connect.IncomingMessage, res, next) => {
          const url = req.url ?? '/';
          // Let Vite internals, HMR websocket, and real /assets/* through
          if (
            url.startsWith('/@') ||
            url.startsWith('/assets/') ||
            url.startsWith('/public/') ||
            url.startsWith('/src/') ||
            url === '/' ||
            url === '/index.html'
          ) {
            return next();
          }
          // If the URL looks like a raw file (has an extension that isn't a
          // known web asset), redirect to the SPA root
          const ext = url.split('?')[0].split('#')[0].split('.').pop() ?? '';
          const webAssetExts = new Set([
            'js', 'ts', 'tsx', 'jsx', 'css', 'png', 'jpg', 'jpeg',
            'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'otf',
            'webp', 'avif', 'mp4', 'webm', 'json', 'map',
          ]);
          if (ext && !webAssetExts.has(ext)) {
            res.writeHead(302, { Location: '/' });
            return res.end();
          }
          next();
        });
      },
    },
  ],
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
