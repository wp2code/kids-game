/**
 * 题目数据服务
 * 优先从 Supabase 获取，降级到本地硬编码
 * 一次查询同时获取元数据 + sound_path/image_path，避免 N+1
 */
import type { Question, CategoryId, SynthPreset } from '@/data/types'
import { QUESTIONS } from '@/data/questions'
import { supabase } from './supabase.client'

/** Supabase questions 表行类型 */
interface QuestionRow {
  id: string
  category_id: string
  name: string
  name_en: string
  sound_keywords: string[]
  image_keywords: string[]
  synth: SynthPreset | null
  difficulty: 1 | 2 | 3
  sound_path: string | null
  image_path: string | null
  is_active: boolean
  sort_order: number
}

/** 带资源路径的题目（内部使用，不暴露给前端组件） */
interface QuestionWithPaths extends Question {
  _soundPath: string | null
  _imagePath: string | null
}

/** 将数据库行转换为 QuestionWithPaths */
function rowToQuestionWithPaths(row: QuestionRow): QuestionWithPaths {
  return {
    id: row.id,
    category: row.category_id as CategoryId,
    name: row.name,
    nameEn: row.name_en,
    soundKeywords: row.sound_keywords ?? [],
    imageKeywords: row.image_keywords ?? [],
    synth: row.synth ?? undefined,
    difficulty: row.difficulty,
    _soundPath: row.sound_path,
    _imagePath: row.image_path,
  }
}

/** 内存缓存 */
let _cache: QuestionWithPaths[] | null = null

/** 获取全部题目（带内存缓存） */
export async function fetchQuestions(): Promise<Question[]> {
  if (_cache) return _cache

  if (!supabase) {
    console.warn('[QuestionsService] Supabase 未初始化，使用本地数据')
    _cache = QUESTIONS.map((q) => ({ ...q, _soundPath: null, _imagePath: null }))
    return _cache
  }

  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error || !data || data.length === 0) {
      console.warn(
        '[QuestionsService] 数据库查询失败，降级到本地',
        error?.message,
      )
      _cache = QUESTIONS.map((q) => ({ ...q, _soundPath: null, _imagePath: null }))
      return _cache
    }

    _cache = (data as QuestionRow[]).map(rowToQuestionWithPaths)
    return _cache
  } catch (err) {
    console.warn('[QuestionsService] 网络异常，降级到本地', err)
    _cache = QUESTIONS.map((q) => ({ ...q, _soundPath: null, _imagePath: null }))
    return _cache
  }
}

/** 按分类过滤题目 */
export async function fetchQuestionsByCategory(
  category: CategoryId,
): Promise<Question[]> {
  const all = await fetchQuestions()
  return all.filter((q) => q.category === category)
}

/** 获取题目的 Storage 路径（从缓存直接取，无额外查询） */
export async function getQuestionPaths(
  questionId: string,
): Promise<{ soundPath: string | null; imagePath: string | null }> {
  const all = (await fetchQuestions()) as QuestionWithPaths[]
  const found = all.find((q) => q.id === questionId)
  if (!found) return { soundPath: null, imagePath: null }
  return { soundPath: found._soundPath, imagePath: found._imagePath }
}

/** 清除内存缓存（测试或热更新场景） */
export function clearQuestionsCache(): void {
  _cache = null
}
