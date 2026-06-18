<script setup lang="ts">
import { ref, onMounted } from 'vue'

const stars = ref<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([])

onMounted(() => {
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const distance = 60 + Math.random() * 40
    stars.value.push({
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 16 + Math.random() * 16,
      delay: Math.random() * 0.15,
    })
  }
})
</script>

<template>
  <div class="star-burst">
    <div
      v-for="star in stars"
      :key="star.id"
      class="star"
      :style="{
        '--x': star.x + 'px',
        '--y': star.y + 'px',
        '--size': star.size + 'px',
        '--delay': star.delay + 's',
      }"
    >
      ⭐
    </div>
  </div>
</template>

<style scoped>
.star-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
  z-index: 10;
}

.star {
  position: absolute;
  font-size: var(--size);
  animation: star-pop 0.5s var(--delay) ease-out both;
}

@keyframes star-pop {
  0% {
    transform: translate(0, 0) scale(0);
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--x), var(--y)) scale(1.2);
    opacity: 0;
  }
}
</style>
