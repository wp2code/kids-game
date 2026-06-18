/**
 * 彩带动画 hook
 */

import { ref } from 'vue'

export function useConfetti() {
  const show = ref(false)

  function burst() {
    show.value = true
    setTimeout(() => {
      show.value = false
    }, 3500)
  }

  function hide() {
    show.value = false
  }

  return { show, burst, hide }
}
