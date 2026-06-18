/**
 * 图片加载 hook
 */

import { ref, type Ref } from 'vue'
import type { Question } from '@/data/types'
import { getImageUrl } from '@/services/image-source.service'
import type { ImageStatus } from '@/services/image-source.service'

export function useImage(question: Ref<Question> | (() => Question)) {
  const status = ref<ImageStatus>('loading')
  const url = ref('')

  async function load() {
    const q = typeof question === 'function' ? question() : question.value
    if (!q) {
      status.value = 'error'
      return
    }

    status.value = 'loading'
    try {
      const imgUrl = await getImageUrl(q)
      url.value = imgUrl
      status.value = 'ok'
    } catch {
      status.value = 'error'
    }
  }

  // 初始加载
  load()

  return { status, url, reload: load }
}

/** 简化版：直接传入 question 对象 */
export function useImageStatic(q: Question) {
  const status = ref<ImageStatus>('loading')
  const url = ref('')

  async function load() {
    status.value = 'loading'
    try {
      const imgUrl = await getImageUrl(q)
      url.value = imgUrl
      status.value = 'ok'
    } catch {
      status.value = 'error'
    }
  }

  load()

  return { status, url, reload: load }
}
