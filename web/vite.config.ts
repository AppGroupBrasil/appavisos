import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: 'auto',
      manifest: {
        name: 'App Avisos',
        short_name: 'App Avisos',
        description: 'Avisos do seu condomínio',
        theme_color: '#0F172A',
        background_color: '#F8FAFC',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'https://api.appavisos.com.br', changeOrigin: true, secure: true },
      '/uploads': { target: 'https://api.appavisos.com.br', changeOrigin: true, secure: true },
      '/q': { target: 'https://api.appavisos.com.br', changeOrigin: true, secure: true },
    },
  },
})
