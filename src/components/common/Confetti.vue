<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  duration?: number
}>()

const canvas = ref<HTMLCanvasElement>()
let animId = 0

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number
  maxLife: number
  rotation: number
  rotationSpeed: number
}

const particles: Particle[] = []
const colors = ['#FF7043', '#FFD54F', '#4FC3F7', '#81C784', '#BA68C8', '#FF8A65', '#AED581', '#FFB74D']

function resize() {
  if (canvas.value) {
    canvas.value.width = window.innerWidth
    canvas.value.height = window.innerHeight
  }
}

function spawnParticles() {
  const w = canvas.value?.width ?? window.innerWidth
  const count = 80
  for (let i = 0; i < count; i++) {
    particles.push({
      x: w / 2 + (Math.random() - 0.5) * 200,
      y: -20,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      life: 0,
      maxLife: Math.random() * 100 + 100,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    })
  }
}

function animate() {
  if (!canvas.value) return
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.life++
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.03 // 重力
    p.rotation += p.rotationSpeed

    const alpha = 1 - p.life / p.maxLife
    if (alpha <= 0) {
      particles.splice(i, 1)
      continue
    }

    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate((p.rotation * Math.PI) / 180)
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
    ctx.restore()
  }

  if (particles.length > 0) {
    animId = requestAnimationFrame(animate)
  }
}

function start() {
  resize()
  spawnParticles()
  animate()
  setTimeout(() => {
    if (animId) cancelAnimationFrame(animId)
    particles.length = 0
  }, props.duration ?? 3500)
}

onMounted(() => {
  window.addEventListener('resize', resize)
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
  window.removeEventListener('resize', resize)
})

defineExpose({ start })
</script>

<template>
  <canvas ref="canvas" class="confetti-canvas" />
</template>

<style scoped>
.confetti-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 1000;
}
</style>
