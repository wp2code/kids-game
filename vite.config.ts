import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// 手动加载 .env 绕过 Vite 8 loadEnv 问题
function loadDotEnv(): Record<string, string> {
  const result: Record<string, string> = {}
  try {
    const content = readFileSync(resolve(__dirname, '.env'), 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      if (key.startsWith('VITE_') && val) {
        result[key] = val
      }
    }
  } catch { /* ignore */ }
  return result
}

const env = loadDotEnv()

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    'import.meta.env.VITE_FREESOUND_TOKEN': JSON.stringify(env.VITE_FREESOUND_TOKEN || ''),
    'import.meta.env.VITE_PEXELS_KEY': JSON.stringify(env.VITE_PEXELS_KEY || ''),
  },
})
