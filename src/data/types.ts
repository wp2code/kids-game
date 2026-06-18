/** 分类 ID */
export type CategoryId = 'vehicle' | 'animal'

/** 游戏阶段 */
export type Phase =
  | 'IDLE'
  | 'CATEGORY_SELECT'
  | 'PLAYING'
  | 'FEEDBACK'
  | 'RESULT'

/** 分类元信息 */
export interface Category {
  id: CategoryId
  name: string
  nameEn: string
  emoji: string
  color: string
  description: string
}

/** Web Audio 合成预设 */
export interface SynthPreset {
  type: 'meow' | 'bark' | 'moo' | 'baa' | 'cluck' | 'quack' | 'chirp' | 'ribbit' | 'roar' | 'trumpet' | 'neigh' | 'oink' | 'engine' | 'horn' | 'siren' | 'motorcycle' | 'helicopter' | 'bell' | 'boat'
  freq?: number
  durationMs?: number
  sweep?: boolean
}

/** 题目 */
export interface Question {
  id: string
  category: CategoryId
  name: string
  nameEn: string
  /** 多关键词用于在线音频搜索 */
  soundKeywords: string[]
  /** 多关键词用于在线图片搜索 */
  imageKeywords: string[]
  /** Web Audio 合成参数（兜底） */
  synth?: SynthPreset
  /** 难度 1-3 */
  difficulty?: 1 | 2 | 3
}

/** 鼓励语库 */
export interface EncouragementLib {
  correct: string[]
  wrong: string[]
}

/** 单轮答题记录 */
export interface RoundRecord {
  questionId: string
  pickedId: string
  isCorrect: boolean
}

/** 游戏统计 */
export interface GameStats {
  total: number
  correct: number
  wrong: number
  history: RoundRecord[]
}
