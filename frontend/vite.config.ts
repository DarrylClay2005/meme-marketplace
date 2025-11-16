import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Meme Marketplace',
        short_name: 'Memes',
        start_url: '/',
        display: 'standalone',
        background_color: '#0b1220',
        theme_color: '#10b981',
        icons: []
      }
    })
  ]
})
