/**
 * Web Audio API 声音合成器
 * 用 OscillatorNode 合成简单音效，作为最终 fallback
 */

import type { SynthPreset } from '@/data/types'

let audioCtx: AudioContext | null = null

/** 所有正在播放的音频节点，用于统一停止 */
const activeNodes: Set<OscillatorNode | AudioBufferSourceNode> = new Set()

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

/** 播放合成声音 */
export function playSynth(preset: SynthPreset): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getCtx()
      const { type, freq = 440, durationMs = 800, sweep = false } = preset
      const duration = durationMs / 1000

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      // 追踪节点以便统一停止
      activeNodes.add(osc)
      osc.onended = () => {
        activeNodes.delete(osc)
        resolve()
      }

      // 基础频率
      osc.frequency.setValueAtTime(sweep ? freq * 0.6 : freq, ctx.currentTime)

      switch (type) {
        case 'meow':
          osc.type = 'sawtooth'
          osc.frequency.linearRampToValueAtTime(freq * 1.5, ctx.currentTime + duration * 0.3)
          osc.frequency.linearRampToValueAtTime(freq * 0.8, ctx.currentTime + duration)
          gain.gain.setValueAtTime(0.3, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
          break

        case 'bark':
          osc.type = 'square'
          osc.frequency.setValueAtTime(freq, ctx.currentTime)
          gain.gain.setValueAtTime(0.4, ctx.currentTime)
          gain.gain.setValueAtTime(0, ctx.currentTime + 0.15)
          gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.2)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
          break

        case 'moo':
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(freq, ctx.currentTime)
          gain.gain.setValueAtTime(0.3, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
          break

        case 'baa':
          osc.type = 'triangle'
          osc.frequency.linearRampToValueAtTime(freq * 1.3, ctx.currentTime + duration * 0.5)
          osc.frequency.linearRampToValueAtTime(freq * 0.8, ctx.currentTime + duration)
          gain.gain.setValueAtTime(0.25, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
          break

        case 'cluck':
          osc.type = 'square'
          osc.frequency.setValueAtTime(freq, ctx.currentTime)
          gain.gain.setValueAtTime(0.2, ctx.currentTime)
          gain.gain.setValueAtTime(0, ctx.currentTime + 0.1)
          gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.15)
          gain.gain.setValueAtTime(0, ctx.currentTime + 0.25)
          break

        case 'quack':
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(freq, ctx.currentTime)
          osc.frequency.linearRampToValueAtTime(freq * 0.7, ctx.currentTime + duration)
          gain.gain.setValueAtTime(0.25, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
          break

        case 'chirp':
          osc.type = 'sine'
          osc.frequency.linearRampToValueAtTime(freq * 1.5, ctx.currentTime + duration * 0.2)
          osc.frequency.linearRampToValueAtTime(freq * 0.5, ctx.currentTime + duration)
          gain.gain.setValueAtTime(0.15, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
          break

        case 'ribbit':
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(freq, ctx.currentTime)
          gain.gain.setValueAtTime(0.2, ctx.currentTime)
          gain.gain.setValueAtTime(0, ctx.currentTime + 0.1)
          gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.2)
          gain.gain.setValueAtTime(0, ctx.currentTime + 0.3)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
          break

        case 'roar':
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(freq * 0.8, ctx.currentTime)
          osc.frequency.linearRampToValueAtTime(freq * 0.5, ctx.currentTime + duration)
          gain.gain.setValueAtTime(0.35, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
          // 添加噪声
          addNoise(ctx, gain, duration, 0.2)
          break

        case 'trumpet':
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(freq * 0.5, ctx.currentTime)
          osc.frequency.linearRampToValueAtTime(freq * 1.5, ctx.currentTime + duration * 0.4)
          osc.frequency.linearRampToValueAtTime(freq * 0.6, ctx.currentTime + duration)
          gain.gain.setValueAtTime(0.3, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
          break

        case 'neigh':
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(freq, ctx.currentTime)
          osc.frequency.linearRampToValueAtTime(freq * 1.6, ctx.currentTime + duration * 0.5)
          osc.frequency.linearRampToValueAtTime(freq * 0.7, ctx.currentTime + duration)
          gain.gain.setValueAtTime(0.25, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
          break

        case 'oink':
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(freq, ctx.currentTime)
          osc.frequency.linearRampToValueAtTime(freq * 1.2, ctx.currentTime + duration * 0.3)
          osc.frequency.linearRampToValueAtTime(freq * 0.5, ctx.currentTime + duration)
          gain.gain.setValueAtTime(0.25, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
          break

        case 'engine':
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(freq, ctx.currentTime)
          gain.gain.setValueAtTime(0.15, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
          addNoise(ctx, gain, duration, 0.12)
          break

        case 'horn':
          osc.type = 'square'
          osc.frequency.setValueAtTime(freq, ctx.currentTime)
          gain.gain.setValueAtTime(0.3, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
          // 叠加一个泛音
          addOvertone(ctx, freq * 1.5, gain, duration, 0.15)
          break

        case 'siren':
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(freq * 0.8, ctx.currentTime)
          osc.frequency.linearRampToValueAtTime(freq * 1.3, ctx.currentTime + duration * 0.5)
          osc.frequency.linearRampToValueAtTime(freq * 0.8, ctx.currentTime + duration)
          gain.gain.setValueAtTime(0.25, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
          break

        case 'motorcycle':
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(freq, ctx.currentTime)
          osc.frequency.linearRampToValueAtTime(freq * 2, ctx.currentTime + duration * 0.3)
          osc.frequency.linearRampToValueAtTime(freq * 0.5, ctx.currentTime + duration)
          gain.gain.setValueAtTime(0.18, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
          addNoise(ctx, gain, duration, 0.1)
          break

        case 'helicopter':
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(freq, ctx.currentTime)
          // 周期性频率调制模拟旋翼
          const now = ctx.currentTime
          for (let t = 0; t < duration; t += 0.1) {
            osc.frequency.setValueAtTime(freq + Math.sin(t * 30) * 50, now + t)
          }
          gain.gain.setValueAtTime(0.18, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
          addNoise(ctx, gain, duration, 0.15)
          break

        case 'bell':
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, ctx.currentTime)
          gain.gain.setValueAtTime(0.3, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
          break

        case 'boat':
          osc.type = 'square'
          osc.frequency.setValueAtTime(freq, ctx.currentTime)
          gain.gain.setValueAtTime(0.35, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
          addOvertone(ctx, freq * 2, gain, duration, 0.1)
          break

        default:
          osc.type = 'sine'
          gain.gain.setValueAtTime(0.2, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
      }

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration + 0.1)
    } catch (e) {
      console.warn('Web Audio synthesis failed:', e)
      resolve()
    }
  })
}

/** 添加白噪声 */
function addNoise(ctx: AudioContext, dest: AudioNode, duration: number, volume: number) {
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * volume
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(volume, ctx.currentTime)
  noiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
  noise.connect(noiseGain)
  noiseGain.connect(dest)
  noise.start()
  noise.stop(ctx.currentTime + duration + 0.1)
  // 追踪噪声节点
  activeNodes.add(noise)
  noise.onended = () => activeNodes.delete(noise)
}

/** 添加泛音 */
function addOvertone(ctx: AudioContext, freq: number, dest: AudioNode, duration: number, volume: number) {
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(dest)
  osc.start()
  osc.stop(ctx.currentTime + duration + 0.1)
  // 追踪泛音节点
  activeNodes.add(osc)
  osc.onended = () => activeNodes.delete(osc)
}

/** 停止所有正在播放的合成声音 */
export function stopAllSynth(): void {
  activeNodes.forEach((node) => {
    try {
      node.stop()
    } catch {
      // 节点可能已经停止，忽略错误
    }
  })
  activeNodes.clear()
}

/** 播放简短正确提示音 */
export function playCorrectSound(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getCtx()
      const notes = [523, 659, 784] // C5 E5 G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12)
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12)
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.12 + 0.05)
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.12 + 0.2)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + i * 0.12)
        osc.stop(ctx.currentTime + i * 0.12 + 0.25)
        if (i === notes.length - 1) {
          osc.onended = () => resolve()
        }
      })
    } catch {
      resolve()
    }
  })
}

/** 播放简短错误提示音 */
export function playWrongSound(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(300, ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.35)
      osc.onended = () => resolve()
    } catch {
      resolve()
    }
  })
}
