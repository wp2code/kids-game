<script setup lang="ts">
import { useGameStore } from '@/stores/game.store'
import ProgressBar from '@/components/common/ProgressBar.vue'
import IconButton from '@/components/common/IconButton.vue'

const store = useGameStore()
defineEmits<{
  back: []
  toggleMute: []
}>()
</script>

<template>
  <div class="game-header">
    <div class="header-left">
      <IconButton icon="🏠" label="首页" @click="$emit('back')" />
      <IconButton
        :icon="store.muted ? '🔇' : '🔊'"
        :label="store.muted ? '取消静音' : '静音'"
        @click="$emit('toggleMute')"
      />
    </div>

    <div class="header-center">
      <ProgressBar :current="store.currentRound" :total="store.totalRounds" />
    </div>

    <div class="header-right">
      <div class="score-badge correct">✅ {{ store.score }}</div>
      <div class="score-badge wrong">❌ {{ store.wrongCount }}</div>
    </div>
  </div>
</template>

<style scoped>
.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 0 0 24px 24px;
  gap: 12px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  gap: 8px;
}

.header-center {
  flex: 1;
  max-width: 350px;
  min-width: 150px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.score-badge {
  font-size: 20px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.8);
}

.score-badge.correct {
  color: #66BB6A;
}

.score-badge.wrong {
  color: #EF5350;
}
</style>
