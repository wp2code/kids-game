/**
 * 分类数据服务
 * 优先从 Supabase 获取，降级到本地硬编码
 */
import type { Category, CategoryId } from '@/data/types'
import { CATEGORIES } from '@/data/categories'
import { supabase } from './supabase.client'

interface CategoryRow {
  id: string
  name: string
  name_en: string
  emoji: string
  color: string
  description: string
  sort_order: number
}

function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id as CategoryId,
    name: row.name,
    nameEn: row.name_en,
    emoji: row.emoji,
    color: row.color,
    description: row.description,
  }
}

let _cache: Category[] | null = null

/** 获取全部分类（带内存缓存） */
export async function fetchCategories(): Promise<Category[]> {
  if (_cache) return _cache

  if (!supabase) {
    console.warn('[CategoriesService] Supabase 未初始化，使用本地数据')
    _cache = CATEGORIES
    return CATEGORIES
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error || !data || data.length === 0) {
      console.warn('[CategoriesService] 降级到本地分类数据')
      _cache = CATEGORIES
      return CATEGORIES
    }

    _cache = (data as CategoryRow[]).map(rowToCategory)
    return _cache
  } catch {
    console.warn('[CategoriesService] 网络异常，降级到本地分类数据')
    _cache = CATEGORIES
    return CATEGORIES
  }
}

/** 清除内存缓存 */
export function clearCategoriesCache(): void {
  _cache = null
}
