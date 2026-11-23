import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

function serveApkMiddleware(req: any, res: any, next: any) {
  if (req.url && (req.url === '/CardDrop.apk' || req.url.startsWith('/CardDrop.apk?'))) {
    const apkPath = path.resolve(__dirname, 'public/CardDrop.apk');
    if (fs.existsSync(apkPath)) {
      const stat = fs.statSync(apkPath);
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': stat.size,
        'Content-Disposition': 'attachment; filename="CardDrop.apk"',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      });
      fs.createReadStream(apkPath).pipe(res);
      return;
    }
  }
  next();
}

function apkServePlugin() {
  return {
    name: 'apk-serve-plugin',
    configureServer(server: any) {
      server.middlewares.use(serveApkMiddleware);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(serveApkMiddleware);
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    assetsInclude: ['**/*.apk'],
    plugins: [
      react(),
      tailwindcss(),
      apkServePlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          id: '/',
          name: 'CardDrop - VCard QR & Contact Scanner',
          short_name: 'CardDrop',
          description: 'Mobile Android app for QR code display from imported VCard vcf files, QR scanner, and local contacts.',
          theme_color: '#4f46e5',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          navigateFallbackDenylist: [/\.apk(\?.*)?$/i],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
