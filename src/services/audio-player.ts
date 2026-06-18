/**
 * 统一音频播放器
 * 管理 HTMLAudioElement 和 WebAudio 的播放、停止、重播
 */

import { playSynth } from '@/utils/sound-synth'
import type { SynthPreset } from '@/data/types'

let currentAudio: HTMLAudioElement | null = null
let _muted = false

/** 播放音频 */
export async function playAudio(url: string | null, preset?: SynthPreset): Promise<void> {
  if (_muted) return

  // 停止当前播放
  stopAll()

  if (url) {
    // 在线音频 —— 先预加载再播放
    try {
      const audio = new Audio()
      audio.preload = 'auto'
      audio.volume = 0.8

      // 等待音频可播放
      await new Promise<void>((resolve, reject) => {
        audio.oncanplaythrough = () => resolve()
        audio.onerror = () => reject(new Error('audio load failed'))
        audio.src = url
        audio.load()
        // 超时 10 秒
        setTimeout(() => resolve(), 10000)
      })

      currentAudio = audio
      await audio.play()
    } catch (err) {
      console.warn('Freesound audio playback failed, falling back to synth:', err)
      // 播放失败，降级到合成器
      if (preset) {
        await playSynth(preset)
      }
    }
  } else if (preset) {
    // 直接合成
    await playSynth(preset)
  }
}

/** 停止所有播放 */
export function stopAll(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio.src = ''
    currentAudio = null
  }
}

/** 设置静音 */
export function setMuted(muted: boolean): void {
  _muted = muted
  if (muted) stopAll()
}

/** 获取静音状态 */
export function isMuted(): boolean {
  return _muted
}
