/**
 * 单题逻辑 hook
 */

import { useGameStore } from '@/stores/game.store'

export function useQuestion() {
  const store = useGameStore()

  function getCurrentQuestion() {
    return store.currentQuestion
  }

  function getCurrentOptions() {
    return store.currentOptions
  }

  function isCorrectOption(id: string): boolean {
    return store.currentQuestion?.id === id
  }

  return {
    getCurrentQuestion,
    getCurrentOptions,
    isCorrectOption,
  }
}
