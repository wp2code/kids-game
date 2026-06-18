/**
 * 数组工具函数
 */

/** Fisher-Yates 洗牌（原地） */
export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** 从数组中随机取 n 个不重复元素 */
export function pickN<T>(arr: T[], n: number): T[] {
  if (n >= arr.length) return [...arr]
  const result: T[] = []
  const pool = [...arr]
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result
}

/** 数组分组 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

/** 去重 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}
