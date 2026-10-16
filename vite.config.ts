import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // NEXT_PUBLIC_* lets the Vercel Supabase integration's public variables reach the app unchanged
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  build: {
    rollupOptions: {
      output: {
        // keep the admin's code out of the visitor's first download
        manualChunks(id) {
          if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) return 'motion'
          if (id.includes('node_modules/react')) return 'react'
        },
      },
    },
  },
})
