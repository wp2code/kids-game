<script setup lang="ts">
import type { Question } from '@/data/types'
import OptionCard from './OptionCard.vue'

defineProps<{
  options: Question[]
  disabled?: boolean
  resultState?: Record<string, 'correct' | 'wrong' | 'idle'>
}>()

defineEmits<{
  pick: [id: string]
}>()

function getState(id: string, resultState?: Record<string, 'correct' | 'wrong' | 'idle'>): 'idle' | 'correct' | 'wrong' {
  return resultState?.[id] ?? 'idle'
}
</script>

<template>
  <div class="options-grid">
    <OptionCard
      v-for="option in options"
      :key="option.id"
      :option="option"
      :disabled="disabled"
      :state="getState(option.id, resultState)"
      @pick="$emit('pick', $event)"
    />
  </div>
</template>

<style scoped>
.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 20px;
  width: 100%;
  max-width: 520px;
}
</style>
