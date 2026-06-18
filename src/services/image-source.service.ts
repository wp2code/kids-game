/**
 * 图片获取服务
 * 三级 fallback：本地 SVG → Pexels API → Unsplash/Openverse
 * 默认使用本地卡通 SVG，.env 中填入 VITE_PEXELS_KEY 后启用在线搜索
 */

import type { Question } from '@/data/types'
import { getItem, setItem } from '@/utils/storage'

const PEXELS_KEY = import.meta.env.VITE_PEXELS_KEY as string | undefined

/** 图片加载状态 */
export type ImageStatus = 'loading' | 'ok' | 'error'

/** 获取题目的图片 URL */
export async function getImageUrl(question: Question): Promise<string> {
  // 1. 查缓存
  const cacheKey = `img-${question.id}`
  const cached = getItem<string | null>(cacheKey, null)
  if (cached) return cached

  // 2. 尝试在线 API
  if (PEXELS_KEY) {
    try {
      const url = await searchPexels(question.imageKeywords[0])
      if (url) {
        setItem(cacheKey, url)
        return url
      }
    } catch {
      // 静默降级
    }
  }

  // 3. 返回本地 SVG 占位图路径
  const fallback = getFallbackImage(question)
  return fallback
}

/** 获取兜底图片 */
function getFallbackImage(question: Question): string {
  const category = question.category
  const name = question.nameEn

  // 尝试用 nameEn 匹配本地 SVG
  const localPath = `/src/assets/placeholders/${category}/${name}.svg`
  return localPath
}

/** 搜索 Pexels API */
async function searchPexels(query: string): Promise<string | null> {
  const key = PEXELS_KEY
  if (!key) return null

  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&size=medium`,
    {
      headers: { Authorization: key },
    }
  )

  if (!res.ok) return null

  const data = await res.json() as { photos?: Array<{ src?: { medium?: string; large?: string } }> }
  const photos = data.photos
  if (!photos || photos.length === 0) return null

  return photos[0]?.src?.medium ?? photos[0]?.src?.large ?? null
}
