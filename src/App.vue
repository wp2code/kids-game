<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game.store'

const router = useRouter()
const store = useGameStore()

// 根据 phase 变化自动导航
watch(() => store.phase, (phase) => {
  switch (phase) {
    case 'IDLE':
      router.push('/')
      break
    case 'CATEGORY_SELECT':
      // 仍在首页，等待用户点击开始
      break
    case 'PLAYING':
    case 'FEEDBACK':
      router.push('/game')
      break
    case 'RESULT':
      router.push('/result')
      break
  }
})
</script>

<template>
  <router-view v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" />
    </Transition>
  </router-view>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
