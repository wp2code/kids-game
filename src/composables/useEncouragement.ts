/**
 * 随机鼓励语 hook
 * 确保不会连续出现相同的鼓励语
 */

import { ENCOURAGEMENTS } from '@/data/encouragements'

let lastCorrectIdx = -1
let lastWrongIdx = -1

export function useEncouragement() {
  function getCorrect(): string {
    const pool = ENCOURAGEMENTS.correct
    let idx: number
    do {
      idx = Math.floor(Math.random() * pool.length)
    } while (idx === lastCorrectIdx && pool.length > 1)
    lastCorrectIdx = idx
    return pool[idx]
  }

  function getWrong(): string {
    const pool = ENCOURAGEMENTS.wrong
    let idx: number
    do {
      idx = Math.floor(Math.random() * pool.length)
    } while (idx === lastWrongIdx && pool.length > 1)
    lastWrongIdx = idx
    return pool[idx]
  }

  return { getCorrect, getWrong }
}
