/**
 * 资源管理服务
 * 管理 Supabase Storage 中声音/图片的上传、替换、状态查询
 */
import { supabase, getStorageUrl } from './supabase.client'
import { clearQuestionsCache } from './questions.service'

/** 题目资源状态（管理页面使用） */
export interface QuestionResource {
  id: string
  category_id: string
  name: string
  name_en: string
  sound_keywords: string[]
  image_keywords: string[]
  difficulty: 1 | 2 | 3
  sound_path: string | null
  image_path: string | null
  /** 是否启用 */
  is_active: boolean
  /** 声音是否已上传 */
  soundUploaded: boolean
  /** 图片是否已上传 */
  imageUploaded: boolean
  /** 声音完整 URL */
  soundUrl: string
  /** 图片完整 URL */
  imageUrl: string
}

/** 获取所有题目的资源状态 */
export async function fetchResourceStatus(): Promise<QuestionResource[]> {
  if (!supabase) return []
  // 时间戳用于破除浏览器对 imageUrl 的 HTTP 缓存（每次加载都取最新图片）
  const ts = Date.now()

  const { data, error } = await supabase
    .from('questions')
    .select('id, category_id, name, name_en, sound_keywords, image_keywords, difficulty, is_active, sound_path, image_path')
    .order('sort_order', { ascending: true })

  if (error || !data) {
    console.warn('[ResourceAdmin] 查询失败', error?.message)
    return []
  }

  return (data as Array<{
    id: string
    category_id: string
    name: string
    name_en: string
    sound_keywords: string[]
    image_keywords: string[]
    difficulty: 1 | 2 | 3
    is_active: boolean
    sound_path: string | null
    image_path: string | null
  }>).map((row) => ({
    id: row.id,
    category_id: row.category_id,
    name: row.name,
    name_en: row.name_en,
    sound_keywords: row.sound_keywords ?? [],
    image_keywords: row.image_keywords ?? [],
    difficulty: row.difficulty,
    is_active: row.is_active ?? true,
    sound_path: row.sound_path,
    image_path: row.image_path,
    soundUploaded: !!row.sound_path,
    imageUploaded: !!row.image_path,
    soundUrl: row.sound_path ? getStorageUrl('sounds', row.sound_path) : '',
    imageUrl: row.image_path ? `${getStorageUrl('images', row.image_path)}?t=${ts}` : '',
  }))
}

/** 上传声音文件到 Supabase Storage 并更新数据库 */
export async function uploadSound(
  questionId: string,
  file: File,
): Promise<boolean> {
  if (!supabase) return false

  const ext = file.name.split('.').pop() || 'mp3'
  const path = `${questionId}.${ext}`

  // 上传到 Storage（upsert 替换已有文件）
  const { error: uploadError } = await supabase.storage
    .from('sounds')
    .upload(path, file, { upsert: true, contentType: file.type || 'audio/mpeg' })

  if (uploadError) {
    console.error('[ResourceAdmin] 声音上传失败', uploadError.message)
    return false
  }

  // 更新数据库 sound_path
  const { error: updateError } = await supabase
    .from('questions')
    .update({ sound_path: path })
    .eq('id', questionId)

  if (updateError) {
    console.error('[ResourceAdmin] 更新 sound_path 失败', updateError.message)
    return false
  }

  // 清除题目缓存，下次获取时重新查询
  clearQuestionsCache()
  return true
}

/** 新增题目入参 */
export interface CreateQuestionInput {
  category_id: string
  name: string
  name_en: string
  difficulty: 1 | 2 | 3
  sound_keywords?: string[]
  image_keywords?: string[]
}

/** 新增题目到数据库 */
export async function createQuestion(input: CreateQuestionInput): Promise<QuestionResource | null> {
  if (!supabase) return null

  // 生成 id：{category}-{name_en}，转小写、空格替换为连字符
  const id = `${input.category_id}-${input.name_en.toLowerCase().replace(/\s+/g, '-')}`

  // 查询当前最大 sort_order
  const { data: maxRow } = await supabase
    .from('questions')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSort = (maxRow?.[0]?.sort_order ?? 0) + 1

  const row = {
    id,
    category_id: input.category_id,
    name: input.name,
    name_en: input.name_en,
    sound_keywords: input.sound_keywords ?? [],
    image_keywords: input.image_keywords ?? [],
    difficulty: input.difficulty,
    sort_order: nextSort,
  }

  const { data, error } = await supabase
    .from('questions')
    .insert(row)
    .select('id, category_id, name, name_en, sound_keywords, image_keywords, difficulty, is_active, sound_path, image_path')
    .single()

  if (error || !data) {
    console.error('[ResourceAdmin] 新增题目失败', error?.message)
    return null
  }

  const d = data as {
    id: string
    category_id: string
    name: string
    name_en: string
    sound_keywords: string[]
    image_keywords: string[]
    difficulty: 1 | 2 | 3
    is_active: boolean
    sound_path: string | null
    image_path: string | null
  }

  clearQuestionsCache()

  return {
    id: d.id,
    category_id: d.category_id,
    name: d.name,
    name_en: d.name_en,
    sound_keywords: d.sound_keywords ?? [],
    image_keywords: d.image_keywords ?? [],
    difficulty: d.difficulty,
    is_active: d.is_active ?? true,
    sound_path: d.sound_path,
    image_path: d.image_path,
    soundUploaded: !!d.sound_path,
    imageUploaded: !!d.image_path,
    soundUrl: d.sound_path ? getStorageUrl('sounds', d.sound_path) : '',
    imageUrl: d.image_path ? getStorageUrl('images', d.image_path) : '',
  }
}

/** 更新题目入参 */
export interface UpdateQuestionInput {
  name?: string
  name_en?: string
  category_id?: string
  difficulty?: 1 | 2 | 3
  is_active?: boolean
  sound_keywords?: string[]
  image_keywords?: string[]
}

/** 更新题目信息 */
export async function updateQuestion(
  questionId: string,
  input: UpdateQuestionInput,
): Promise<QuestionResource | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('questions')
    .update(input)
    .eq('id', questionId)
    .select('id, category_id, name, name_en, sound_keywords, image_keywords, difficulty, is_active, sound_path, image_path')
    .single()

  if (error || !data) {
    console.error('[ResourceAdmin] 更新题目失败', error?.message)
    return null
  }

  const d = data as {
    id: string
    category_id: string
    name: string
    name_en: string
    sound_keywords: string[]
    image_keywords: string[]
    difficulty: 1 | 2 | 3
    is_active: boolean
    sound_path: string | null
    image_path: string | null
  }

  clearQuestionsCache()

  return {
    id: d.id,
    category_id: d.category_id,
    name: d.name,
    name_en: d.name_en,
    sound_keywords: d.sound_keywords ?? [],
    image_keywords: d.image_keywords ?? [],
    difficulty: d.difficulty,
    is_active: d.is_active ?? true,
    sound_path: d.sound_path,
    image_path: d.image_path,
    soundUploaded: !!d.sound_path,
    imageUploaded: !!d.image_path,
    soundUrl: d.sound_path ? getStorageUrl('sounds', d.sound_path) : '',
    imageUrl: d.image_path ? getStorageUrl('images', d.image_path) : '',
  }
}

/** 切换题目启用/停用状态 */
export async function toggleQuestionActive(
  questionId: string,
  isActive: boolean,
): Promise<boolean> {
  if (!supabase) return false

  const { error } = await supabase
    .from('questions')
    .update({ is_active: isActive })
    .eq('id', questionId)

  if (error) {
    console.error('[ResourceAdmin] 切换状态失败', error.message)
    return false
  }

  clearQuestionsCache()
  return true
}

/** 删除题目 */
export async function deleteQuestion(questionId: string): Promise<boolean> {
  if (!supabase) return false

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId)

  if (error) {
    console.error('[ResourceAdmin] 删除题目失败', error.message)
    return false
  }

  clearQuestionsCache()
  return true
}

/** 上传图片文件到 Supabase Storage 并更新数据库 */
export async function uploadImage(
  questionId: string,
  file: File,
): Promise<boolean> {
  if (!supabase) return false

  const ext = file.name.split('.').pop() || 'webp'
  const path = `${questionId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(path, file, { upsert: true, contentType: file.type || 'image/webp' })

  if (uploadError) {
    console.error('[ResourceAdmin] 图片上传失败', uploadError.message)
    return false
  }

  const { error: updateError } = await supabase
    .from('questions')
    .update({ image_path: path })
    .eq('id', questionId)

  if (updateError) {
    console.error('[ResourceAdmin] 更新 image_path 失败', updateError.message)
    return false
  }

  // 清除该题目在 localStorage 中的图片缓存，避免浏览器显示旧图
  clearImageCache(questionId)
  clearQuestionsCache()
  return true
}

/** 清除指定题目的 localStorage 图片缓存（所有可能的缓存 key 前缀） */
export function clearImageCache(questionId: string): void {
  try {
    const prefixes = ['img-v3-cdn-', 'img-v3-sb-']
    for (const prefix of prefixes) {
      localStorage.removeItem(`${prefix}${questionId}`)
    }
  } catch {
    // 静默失败（隐私模式等）
  }
}
