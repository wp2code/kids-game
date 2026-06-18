/**
 * 图片获取服务 — 三级 fallback
 * L1: Supabase Storage → L2: Pexels API → L3: 本地 SVG
 */

import type { Question } from '@/data/types'
import { getItem, setItem } from '@/utils/storage'
import { getStorageUrl, IMAGES_BASE_URL } from './supabase.client'
import { getQuestionPaths } from './questions.service'

const PEXELS_KEY = import.meta.env.VITE_PEXELS_KEY as string | undefined

/** 图片加载状态 */
export type ImageStatus = 'loading' | 'ok' | 'error'

/** 缓存版本标识，环境变量变更时缓存自动失效 */
const CACHE_VERSION = IMAGES_BASE_URL ? 'cdn' : 'sb'

/** 获取题目的图片 URL */
export async function getImageUrl(question: Question): Promise<string> {
  const cacheKey = `img-v3-${CACHE_VERSION}-${question.id}`

  // 0. 查 localStorage 缓存
  const cached = getItem<string | null>(cacheKey, null)
  if (cached) return cached

  // 1. Supabase Storage（主源）
  try {
    const { imagePath } = await getQuestionPaths(question.id)
    if (imagePath) {
      const url = getStorageUrl('images', imagePath)
      if (url) {
        setItem(cacheKey, url)
        return url
      }
    }
  } catch {
    // 降级到下一级
  }

  // 2. Pexels API（降级）
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

  // 3. 本地 SVG 占位图
  return getFallbackImage(question)
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
