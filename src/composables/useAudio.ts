/**
 * 音频播放 hook
 */

import { ref } from 'vue'
import { useGameStore } from '@/stores/game.store'
import { playAudio, stopAll as stopAllPlayer, setMuted } from '@/services/audio-player'
import { getSoundUrl, getSynthPreset } from '@/services/sound-source.service'

export function useAudio() {
  const store = useGameStore()
  const isPlaying = ref(false)

  /** 播放当前题目的声音 */
  async function play() {
    const question = store.currentQuestion
    if (!question) return

    isPlaying.value = true
    try {
      const url = await getSoundUrl(question)
      const preset = getSynthPreset(question)
      await playAudio(url, preset)
    } finally {
      isPlaying.value = false
    }
  }

  /** 重播 */
  function replay() {
    stopAllPlayer()
    play()
  }

  /** 停止所有声音 */
  function stopAll() {
    stopAllPlayer()
    isPlaying.value = false
  }

  /** 切换静音 */
  function toggleMute() {
    store.toggleMute()
    setMuted(store.muted)
  }

  return {
    isPlaying,
    play,
    replay,
    stopAll,
    toggleMute,
  }
}
