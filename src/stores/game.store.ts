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
  const totalRounds = ref(5)
  const currentRound = ref(0)
  const score = ref(0)
  const wrongCount = ref(0)
  const currentQuestion = ref<Question | null>(null)
  const currentOptions = ref<Question[]>([])
  const lastResult = ref<{ correct: boolean; pickedId: string } | null>(null)
  const bestScore = ref(getItem<number>('best-score', 0))
  const muted = ref(false)
  const history = ref<RoundRecord[]>([])

  // ---- 派生 ----
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
    score.value = 0
    wrongCount.value = 0
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

    // 检查是否已答过此题（再听一次后重答）
    const existingIdx = history.value.findIndex(
      (h) => h.questionId === currentQuestion.value!.id
    )

    if (existingIdx === -1) {
      // 第一次答题：正常计分
      if (isCorrect) {
        score.value++
      } else {
        wrongCount.value++
      }
      history.value.push({
        questionId: currentQuestion.value.id,
        pickedId,
        isCorrect,
      })
    }
    // 再听一次后重答：不重复计分，只更新反馈

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
    score.value = 0
    wrongCount.value = 0
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
