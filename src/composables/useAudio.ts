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

  /** 播放版本号，每次 stopAll 递增，用于取消过期的异步播放 */
  let _playVersion = 0

  /** 播放当前题目的声音 */
  async function play() {
    const question = store.currentQuestion
    if (!question) return

    // 记录当前版本
    const version = _playVersion

    isPlaying.value = true
    try {
      const url = await getSoundUrl(question)

      // 版本已变，说明 stopAll 已被调用，放弃播放
      if (version !== _playVersion) return

      const preset = getSynthPreset(question)
      await playAudio(url, preset)
    } finally {
      // 仅在版本未变时重置状态
      if (version === _playVersion) {
        isPlaying.value = false
      }
    }
  }

  /** 重播 */
  function replay() {
    stopAll()
    play()
  }

  /** 停止所有声音 */
  function stopAll() {
    _playVersion++
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
