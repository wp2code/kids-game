/**
 * 音频播放 hook
 */

import { ref } from 'vue'
import { useGameStore } from '@/stores/game.store'
import { playAudio, stopAll, setMuted as setPlayerMuted } from '@/services/audio-player'
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
    stopAll()
    play()
  }

  /** 切换静音 */
  function toggleMute() {
    store.toggleMute()
    setPlayerMuted(store.muted)
  }

  return {
    isPlaying,
    play,
    replay,
    toggleMute,
  }
}
