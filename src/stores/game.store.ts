/**
 * Pinia 全局游戏状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Phase, CategoryId, Question, RoundRecord } from '@/data/types'
import { getItem, setItem } from '@/utils/storage'

export const useGameStore = defineStore('game', () => {
  // ---- 状态 ----
  const phase = ref<Phase>('IDLE')
  const category = ref<CategoryId | null>(null)
  const POINTS_PER_QUESTION = 10
  const totalRounds = ref(10)
  const currentRound = ref(0)
  const currentQuestion = ref<Question | null>(null)
  const currentOptions = ref<Question[]>([])
  const lastResult = ref<{ correct: boolean; pickedId: string } | null>(null)
  // 兼容旧版 bestScore（旧版按题数 0-5 存储，新版按分数 0-100）
  const _rawBest = getItem<number>('best-score', 0)
  const bestScore = ref(_rawBest <= 5 ? _rawBest * POINTS_PER_QUESTION : _rawBest)
  const muted = ref(false)
  const history = ref<RoundRecord[]>([])

  // ---- 派生 ----
  // score / wrongCount 从 history 派生，保证 score + wrongCount 始终等于 history.length * POINTS_PER_QUESTION
  const score = computed(() =>
    history.value.filter((h) => h.isCorrect).length * POINTS_PER_QUESTION
  )
  const wrongCount = computed(() =>
    history.value.filter((h) => !h.isCorrect).length * POINTS_PER_QUESTION
  )
  const progress = computed(() =>
    totalRounds.value > 0 ? currentRound.value / totalRounds.value : 0
  )
  const isLastRound = computed(() => currentRound.value >= totalRounds.value)

  // ---- Actions ----
  function selectCategory(cat: CategoryId) {
    category.value = cat
    phase.value = 'CATEGORY_SELECT'
  }

  function startGame() {
    currentRound.value = 0
    history.value = []
    lastResult.value = null
    phase.value = 'PLAYING'
  }

  function setQuestion(question: Question, options: Question[]) {
    currentQuestion.value = question
    currentOptions.value = options
  }

  function answer(pickedId: string): boolean {
    if (!currentQuestion.value) return false
    const isCorrect = pickedId === currentQuestion.value.id
    lastResult.value = { correct: isCorrect, pickedId }

    // 用轮次索引定位，避免同一题在不同轮出现时误改上一轮记录
    const roundIdx = currentRound.value
    const isReplay = roundIdx < history.value.length

    if (!isReplay) {
      // 第一次答题：新增记录，score/wrongCount 由 computed 自动更新
      history.value.push({
        questionId: currentQuestion.value.id,
        pickedId,
        isCorrect,
      })
    } else {
      // 再听一次后重答：仅更新当前轮记录，不影响之前轮次
      history.value[roundIdx] = {
        questionId: currentQuestion.value.id,
        pickedId,
        isCorrect,
      }
    }

    phase.value = 'FEEDBACK'
    return isCorrect
  }

  function nextRound() {
    currentRound.value++
    if (isLastRound.value) {
      // 更新最高分
      if (score.value > bestScore.value) {
        bestScore.value = score.value
        setItem('best-score', bestScore.value)
      }
      phase.value = 'RESULT'
    } else {
      phase.value = 'PLAYING'
    }
  }

  function reset() {
    phase.value = 'IDLE'
    category.value = null
    currentRound.value = 0
    currentQuestion.value = null
    currentOptions.value = []
    lastResult.value = null
    history.value = []
  }

  function toggleMute() {
    muted.value = !muted.value
  }

  return {
    // state
    phase,
    category,
    totalRounds,
    currentRound,
    score,
    wrongCount,
    currentQuestion,
    currentOptions,
    lastResult,
    bestScore,
    muted,
    history,
    // getters
    progress,
    isLastRound,
    // actions
    selectCategory,
    startGame,
    setQuestion,
    answer,
    nextRound,
    reset,
    toggleMute,
  }
})
