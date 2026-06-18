<script setup lang="ts">
defineProps<{
  current: number
  total: number
}>()
</script>

<template>
  <div class="progress-bar">
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: total > 0 ? (current / total) * 100 + '%' : '0%' }" />
      <div class="progress-dot" :style="{ left: total > 0 ? (current / total) * 100 + '%' : '0%' }">🐛</div>
    </div>
    <span class="progress-text">{{ current }} / {{ total }}</span>
  </div>
</template>

<style scoped>
.progress-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 400px;
}

.progress-track {
  flex: 1;
  height: 16px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  position: relative;
  overflow: visible;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4FC3F7, #81C784, #FFD54F);
  border-radius: 8px;
  transition: width 0.4s ease;
}

.progress-dot {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 22px;
  transition: left 0.4s ease;
  line-height: 1;
  margin-top: -1px;
}

.progress-text {
  font-size: 18px;
  font-weight: 700;
  color: #777;
  white-space: nowrap;
}
</style>
