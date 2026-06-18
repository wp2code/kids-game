/**
 * 统一音频播放器
 * 管理 HTMLAudioElement 和 WebAudio 的播放、停止、重播
 */

import { playSynth, stopAllSynth } from '@/utils/sound-synth'
import type { SynthPreset } from '@/data/types'

let currentAudio: HTMLAudioElement | null = null
let _muted = false

/** 播放版本号，每次 stopAll 递增，用于取消过期的异步播放 */
let _playVersion = 0

/** 播放音频 */
export async function playAudio(url: string | null, preset?: SynthPreset): Promise<void> {
  if (_muted) return

  // 停止当前播放
  stopAll()

  // 记录当前版本
  const version = _playVersion

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

      // 版本已变，说明 stopAll 已被调用，放弃播放
      if (version !== _playVersion) return

      currentAudio = audio
      await audio.play()

      // 等待播放真正结束，而非 play() resolve（play() 仅表示开始播放）
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve()
        // 安全超时，防止 onended 不触发
        setTimeout(() => resolve(), 30000)
      })
    } catch (err) {
      // 版本已变，不再降级
      if (version !== _playVersion) return
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
  // 递增版本号，使正在进行的异步播放放弃执行
  _playVersion++

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio.src = ''
    currentAudio = null
  }
  // 同时停止合成器声音
  stopAllSynth()
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
