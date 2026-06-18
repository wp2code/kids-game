/**
 * Supabase 客户端单例
 * 全量管理声音/图片资源、题目与分类数据
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Supabase] 环境变量未配置，将使用本地降级数据')
}

export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false }, // 纯公开读，不需要会话
      })
    : null

/** 环境变量配置的资源基础地址 */
export const SOUNDS_BASE_URL = import.meta.env.VITE_SOUNDS_BASE_URL as string | undefined
export const IMAGES_BASE_URL = import.meta.env.VITE_IMAGES_BASE_URL as string | undefined

/** 获取 Storage 公开文件的完整 URL */
export function getStorageUrl(
  bucket: 'sounds' | 'images',
  path: string,
): string {
  if (!path) return ''

  // 优先使用环境变量配置的地址
  const baseUrl = bucket === 'sounds' ? SOUNDS_BASE_URL : IMAGES_BASE_URL
  if (baseUrl) {
    const sep = baseUrl.endsWith('/') ? '' : '/'
    return `${baseUrl}${sep}${path}`
  }

  // 降级到 Supabase Storage 默认地址
  if (!supabase) return ''
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
