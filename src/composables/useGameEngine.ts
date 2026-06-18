/**
 * 游戏引擎 —— 核心流程编排
 */

import { useGameStore } from '@/stores/game.store'
import { QUESTIONS } from '@/data/questions'
import { shuffle } from '@/utils/random'
import type { Question } from '@/data/types'

export function useGameEngine() {
  const store = useGameStore()

  /** 开始新一局 */
  function startGame() {
    store.startGame()
    setupRound()
  }

  /** 设置当前轮题目 */
  function setupRound() {
    const cat = store.category
    if (!cat) return

    // 过滤同类题目
    const pool = QUESTIONS.filter((q) => q.category === cat)

    // 随机选一题作为答案
    const shuffled = shuffle(pool)
    const answer = shuffled[0]

    // 从剩余中取 3 个干扰项 = 总共 4 个选项
    const restPool = shuffled.slice(1)
    let distractors: Question[]
    if (restPool.length >= 3) {
      distractors = restPool.slice(0, 3)
    } else {
      // 不够从全题库中补（不同类别）
      const otherPool = QUESTIONS.filter((q) => q.id !== answer.id)
      const others = shuffle(otherPool)
      distractors = others.slice(0, 3)
    }

    // 合并答案和干扰项，再 shuffle
    const options = shuffle([answer, ...distractors])

    store.setQuestion(answer, options)
  }

  /** 答题 */
  function submitAnswer(pickedId: string): boolean {
    return store.answer(pickedId)
  }

  /** 进入下一题 */
  function goNext() {
    store.nextRound()
    if (store.phase === 'PLAYING') {
      setupRound()
    }
  }

  /** 返回首页 */
  function goHome() {
    store.reset()
  }

  return {
    startGame,
    submitAnswer,
    goNext,
    goHome,
  }
}
