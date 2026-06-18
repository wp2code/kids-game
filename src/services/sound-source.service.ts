/**
 * 音频获取服务 — 三级 fallback
 * L1: Supabase Storage → L2: Freesound API → L3: Web Audio 合成器
 */

import type { Question, SynthPreset } from '@/data/types'
import { getItem, setItem } from '@/utils/storage'
import { getStorageUrl, SOUNDS_BASE_URL } from './supabase.client'
import { getQuestionPaths } from './questions.service'

const FREESOUND_TOKEN = import.meta.env.VITE_FREESOUND_TOKEN as string | undefined

/** 缓存版本标识，环境变量变更时缓存自动失效 */
const CACHE_VERSION = SOUNDS_BASE_URL ? 'cdn' : 'sb'

/** 获取题目的声音 URL（null → 合成器） */
export async function getSoundUrl(question: Question): Promise<string | null> {
  const cacheKey = `sound-v3-${CACHE_VERSION}-${question.id}`

  // 0. 查 localStorage 缓存
  const cached = getItem<string | null>(cacheKey, null)
  if (cached) return cached

  // 1. Supabase Storage（主源）
  try {
    const { soundPath } = await getQuestionPaths(question.id)
    if (soundPath) {
      const url = getStorageUrl('sounds', soundPath)
      if (url) {
        setItem(cacheKey, url)
        return url
      }
    }
  } catch {
    // 降级到下一级
  }

  // 2. Freesound 在线搜索（降级）
  if (FREESOUND_TOKEN) {
    const keywords = [
      question.nameEn,
      ...question.soundKeywords.filter((k) => /^[a-zA-Z]/.test(k)),
    ]
    for (const kw of keywords) {
      try {
        const url = await searchFreesound(kw, FREESOUND_TOKEN)
        if (url) {
          setItem(cacheKey, url)
          return url
        }
      } catch { /* 下一个关键词 */ }
    }
  }

  // 3. 返回 null → Web Audio 合成器
  return null
}

/** 获取合成预设 */
export function getSynthPreset(question: Question): SynthPreset | undefined {
  return question.synth
}

/** 搜索 Freesound */
async function searchFreesound(query: string, token: string): Promise<string | null> {
  const res = await fetch(
    `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&page_size=5&fields=previews,name`,
    { headers: { Authorization: `Token ${token}` } },
  )

  if (!res.ok) return null

  const data = (await res.json()) as {
    results?: Array<{ name?: string; previews?: { 'preview-hq-mp3'?: string; 'preview-lq-mp3'?: string } }>
  }

  const results = data.results
  if (!results || results.length === 0) return null

  for (const r of results) {
    const url = r.previews?.['preview-hq-mp3'] ?? r.previews?.['preview-lq-mp3']
    if (url) return url
  }

  return null
}
