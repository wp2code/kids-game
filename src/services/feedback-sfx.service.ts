/**
 * 反馈提示音服务
 * 播放答对/答错/点击等反馈音效
 */

import { playCorrectSound, playWrongSound } from '@/utils/sound-synth'

let muted = false

export function setMuted(val: boolean): void {
  muted = val
}

export async function playCorrect(): Promise<void> {
  if (muted) return
  await playCorrectSound()
}

export async function playWrong(): Promise<void> {
  if (muted) return
  await playWrongSound()
}

export async function playClick(): Promise<void> {
  if (muted) return
  // 简单的点击音效：短促 sine 波
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  } catch {
    // 静默
  }
}
