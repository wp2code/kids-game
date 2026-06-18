/**
 * 音频获取服务
 * VITE_FREESOUND_TOKEN — Freesound API Key（在 https://freesound.org/apiv2/apply/ 获取）
 * Fallback：Web Audio 合成器
 */

import type { Question, SynthPreset } from '@/data/types'
import { getItem, setItem } from '@/utils/storage'

const FREESOUND_TOKEN = import.meta.env.VITE_FREESOUND_TOKEN as string | undefined

/** 获取题目的声音 URL（null → 合成器） */
export async function getSoundUrl(question: Question): Promise<string | null> {
  const cacheKey = `sound-${question.id}`

  // 1. 查缓存
  const cached = getItem<string | null>(cacheKey, null)
  if (cached) return cached

  // 2. Freesound 在线搜索
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
