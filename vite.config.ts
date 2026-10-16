import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * The Supabase project URL and its public key, from whichever names are set: our VITE_* names, the
 * NEXT_PUBLIC_* copies, or the plain SUPABASE_* ones the Vercel integration creates. Only these two
 * public values reach the browser — and the build stops if the key is anything but a public one.
 */
function supabasePublic(env: Record<string, string | undefined>) {
  const url = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || ''
  const key =
    env.VITE_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    ''
  if (key && !isPublicKey(key)) {
    throw new Error('The Supabase key for the browser must be the anon/publishable key, never a secret or service_role key.')
  }
  return { url: url.replace(/\/$/, ''), key: url ? key : '' }
}

function isPublicKey(key: string) {
  if (key.startsWith('sb_publishable_')) return true
  if (key.startsWith('sb_')) return false
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1] ?? '', 'base64url').toString())
    return payload.role === 'anon'
  } catch {
    return false
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const supabase = supabasePublic({ ...loadEnv(mode, process.cwd(), ''), ...process.env })
  return {
    plugins: [react(), tailwindcss()],
    define: {
      __SUPABASE_URL__: JSON.stringify(supabase.url),
      __SUPABASE_KEY__: JSON.stringify(supabase.key),
    },
    build: {
      rollupOptions: {
        output: {
          // keep the admin's code out of the visitor's first download
          manualChunks(id: string) {
            if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) return 'motion'
            if (id.includes('node_modules/react')) return 'react'
          },
        },
      },
    },
  }
})
