import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    // Quick tunnels (trycloudflare.com) present a hostname Vite doesn't
    // recognize by default; without this it 403s every request.
    allowedHosts: ['.trycloudflare.com'],
  },
})
