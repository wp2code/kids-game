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
    <button
      :class="['play-btn', { playing: isPlaying }]"
      @click="handleClick(); $emit('play')"
    >
      <!-- 旋转光环 -->
      <span class="glow-ring" />
      <!-- 按钮主体 -->
      <span class="btn-body">
        <span class="play-icon">{{ isPlaying ? '🔊' : '👂' }}</span>
      </span>
    </button>
    <!-- 波纹扩散 -->
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

/* ===== 按钮容器 ===== */
.play-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition: transform 0.3s ease;
  -webkit-tap-highlight-color: transparent;
  z-index: 1;
}

.play-btn:hover {
  transform: translateY(-4px) scale(1.05);
}

.play-btn:active {
  transform: scale(0.9);
}

/* ===== 旋转光环 ===== */
.glow-ring {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    #4FC3F7, #81D4FA, #B3E5FC, #4FC3F7,
    #81D4FA, #B3E5FC, #4FC3F7
  );
  animation: ring-spin 4s linear infinite;
  opacity: 0.7;
  filter: blur(2px);
}

/* 外层呼吸光晕 */
.glow-ring::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(79, 195, 247, 0.3) 40%, transparent 70%);
  animation: breathe 2.5s ease-in-out infinite;
}

.play-btn.playing .glow-ring {
  background: conic-gradient(
    from 0deg,
    #FF7043, #FF8A65, #FFAB91, #FF7043,
    #FF8A65, #FFAB91, #FF7043
  );
  opacity: 0.9;
  animation: ring-spin 2s linear infinite;
}

.play-btn.playing .glow-ring::after {
  background: radial-gradient(circle, rgba(255, 112, 67, 0.3) 40%, transparent 70%);
  animation: breathe 1.5s ease-in-out infinite;
}

@keyframes ring-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.25); opacity: 1; }
}

/* ===== 按钮主体 ===== */
.btn-body {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: linear-gradient(180deg, #E3F2FD 0%, #BBDEFB 40%, #90CAF9 100%);
  box-shadow:
    0 8px 0 #64B5F6,
    0 10px 24px rgba(79, 195, 247, 0.4),
    inset 0 3px 0 rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
}

.play-btn.playing .btn-body {
  background: linear-gradient(180deg, #FFF3E0 0%, #FFE0B2 40%, #FFCC80 100%);
  box-shadow:
    0 8px 0 #FF8A65,
    0 10px 24px rgba(255, 112, 67, 0.4),
    inset 0 3px 0 rgba(255, 255, 255, 0.7);
  animation: press-bounce 0.8s infinite;
}

@keyframes press-bounce {
  0%, 100% {
    box-shadow:
      0 8px 0 #FF8A65,
      0 10px 24px rgba(255, 112, 67, 0.4),
      inset 0 3px 0 rgba(255, 255, 255, 0.7);
  }
  50% {
    box-shadow:
      0 3px 0 #FF8A65,
      0 5px 12px rgba(255, 112, 67, 0.25),
      inset 0 3px 0 rgba(255, 255, 255, 0.7);
    transform: translateY(5px);
  }
}

/* ===== 图标 ===== */
.play-icon {
  font-size: 46px;
  line-height: 1;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.1));
  transition: transform 0.3s ease;
}

.play-btn:hover .play-icon {
  transform: scale(1.15);
}

.play-btn.playing .play-icon {
  animation: wiggle 0.5s ease-in-out infinite;
}

@keyframes wiggle {
  0%, 100% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(-8deg) scale(1.08); }
  75% { transform: rotate(8deg) scale(1.08); }
}

/* ===== 波纹扩散 ===== */
.ripple-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 140px;
  height: 140px;
  margin-left: -70px;
  margin-top: -70px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(79, 195, 247, 0.15) 0%, transparent 70%);
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
