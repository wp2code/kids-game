/**
 * 语音朗读 hook（Web Speech API）
 * 朗读物品名称，辅助不识字儿童
 */

import { ref } from 'vue'

export function useSpeech() {
  const speaking = ref(false)

  function speak(text: string, lang = 'zh-CN') {
    if (!('speechSynthesis' in window)) return

    // 取消当前朗读
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.9 // 稍慢，适合儿童
    utterance.pitch = 1.1 // 稍高，更亲和

    speaking.value = true
    utterance.onend = () => {
      speaking.value = false
    }
    utterance.onerror = () => {
      speaking.value = false
    }

    window.speechSynthesis.speak(utterance)
  }

  function cancel() {
    window.speechSynthesis.cancel()
    speaking.value = false
  }

  return { speaking, speak, cancel }
}
