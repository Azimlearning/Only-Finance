import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// Env files live at the repo root (one level above app/).
const repoRoot = fileURLToPath(new URL('..', import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Empty prefix: load every variable, including non-VITE_ ones such as the
  // OpenRouter key. This file runs in Node only, so the key never reaches src/.
  const env = loadEnv(mode, repoRoot, '')
  const apiKey = env.OPENROUTER_API_KEY ?? ''

  return {
    envDir: '..',
    plugins: [react(), tailwindcss()],
    define: {
      __LLM_ENABLED__: JSON.stringify(Boolean(apiKey)),
    },
    server: {
      proxy: {
        // Browser -> /api/llm -> OpenRouter chat completions. The key is added
        // server-side here, so it is never shipped to the client bundle.
        '/api/llm': {
          target: 'https://openrouter.ai',
          changeOrigin: true,
          rewrite: () => '/api/v1/chat/completions',
          // Vite docs: proxyReq listeners are attached via `configure`.
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (apiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`)
              }
              proxyReq.setHeader('HTTP-Referer', 'http://localhost')
              proxyReq.setHeader('X-Title', 'OnlyFinance')
            })
          },
        },
      },
    },
    test: {
      include: ['src/**/*.test.ts'],
      environment: 'node',
    },
  }
})
