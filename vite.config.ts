import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFileSync } from 'fs'

const VITE_KEYS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_FREESOUND_TOKEN',
  'VITE_PEXELS_KEY',
  'VITE_SOUNDS_BASE_URL',
  'VITE_IMAGES_BASE_URL',
] as const

// 手动加载环境变量：优先系统环境变量（CI/GitHub Actions），回退读 .env 文件（本地开发）
function loadDotEnv(): Record<string, string> {
  const result: Record<string, string> = {}

  // 1. 优先读系统环境变量（GitHub Actions 通过 Secrets 注入）
  for (const key of VITE_KEYS) {
    if (process.env[key]) result[key] = process.env[key]!
  }

  // 2. 回退：读 .env 文件（本地开发，且系统环境变量未提供时）
  if (Object.keys(result).length === 0) {
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
  }

  return result
}

const env = loadDotEnv()

// 部署到 GitHub Pages 时需设置 base 路径
const base = process.env.GITHUB_ACTIONS ? '/kids-game/' : '/'

export default defineConfig({
  plugins: [vue()],
  base,
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    'import.meta.env.VITE_FREESOUND_TOKEN': JSON.stringify(env.VITE_FREESOUND_TOKEN || ''),
    'import.meta.env.VITE_PEXELS_KEY': JSON.stringify(env.VITE_PEXELS_KEY || ''),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
    'import.meta.env.VITE_SOUNDS_BASE_URL': JSON.stringify(env.VITE_SOUNDS_BASE_URL || ''),
    'import.meta.env.VITE_IMAGES_BASE_URL': JSON.stringify(env.VITE_IMAGES_BASE_URL || ''),
  },
})
