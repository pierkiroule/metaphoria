import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/metaphoria/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.txt', 'robots.txt'],
      manifest: {
        name: 'Echo from Metaphoria',
        short_name: 'Metaphoria',
        start_url: '/metaphoria/',
        scope: '/metaphoria/',
        display: 'standalone',
        background_color: '#05060a',
        theme_color: '#7cf0ff',
        description: 'Déposez des mots, laissez la résonance métaphorique répondre.',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/metaphoria/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,txt}']
      }
    })
  ]
});
