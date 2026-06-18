<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  isPlaying?: boolean
}>()

defineEmits<{
  play: []
}>()

const rippleActive = ref(false)

function handleClick() {
  rippleActive.value = true
  setTimeout(() => {
    rippleActive.value = false
  }, 600)
}
</script>

<template>
  <div class="sound-player">
    <div class="play-btn-wrapper">
      <!-- 声波扩散环 -->
      <div class="sound-waves" :class="{ active: isPlaying }">
        <span class="ring" />
        <span class="ring" />
        <span class="ring" />
      </div>

      <!-- 播放按钮 -->
      <button
        :class="['play-btn', { playing: isPlaying }]"
        @click="handleClick(); $emit('play')"
      >
        <span class="play-icon">{{ isPlaying ? '🔊' : '👂' }}</span>
      </button>
    </div>

    <!-- 点击波纹 -->
    <div v-if="rippleActive" class="ripple-ring" />
  </div>
</template>

<style scoped>
.sound-player {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.play-btn-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== 播放按钮 ===== */
.play-btn {
  position: relative;
  z-index: 2;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FF6D00, #FF9100);
  box-shadow: 0 8px 24px rgba(255, 109, 0, 0.35);
  transition: transform 0.15s ease;
  animation: pulse 2s ease-in-out infinite;
  -webkit-tap-highlight-color: transparent;
}

.play-btn:active {
  transform: scale(0.9);
}

.play-btn.playing {
  animation: sound-wave 0.6s ease-in-out infinite;
  background: linear-gradient(135deg, #E65100, #FF6D00);
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 8px 24px rgba(255, 109, 0, 0.35); }
  50% { box-shadow: 0 8px 36px rgba(255, 109, 0, 0.55); }
}

@keyframes sound-wave {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

/* ===== 图标 ===== */
.play-icon {
  font-size: 44px;
  line-height: 1;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.15));
}

/* ===== 声波扩散环 ===== */
.sound-waves {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
  display: none;
}

.sound-waves.active {
  display: block;
}

.sound-waves .ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 3px solid rgba(255, 109, 0, 0.3);
  animation: ring-expand 1.5s ease-out infinite;
}

.sound-waves .ring:nth-child(2) { animation-delay: 0.5s; }
.sound-waves .ring:nth-child(3) { animation-delay: 1s; }

@keyframes ring-expand {
  0% {
    width: 80px;
    height: 80px;
    opacity: 0.8;
  }
  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
  }
}

/* ===== 点击波纹 ===== */
.ripple-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  margin-left: -60px;
  margin-top: -60px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 109, 0, 0.15) 0%, transparent 70%);
  animation: ripple 0.7s ease-out;
  pointer-events: none;
}

@keyframes ripple {
  0% {
    transform: scale(0.4);
    opacity: 1;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}
</style>
