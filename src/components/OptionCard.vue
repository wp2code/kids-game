<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Question } from '@/data/types'
import { getImageUrl } from '@/services/image-source.service'

const props = defineProps<{
  option: Question
  disabled?: boolean
  state?: 'idle' | 'correct' | 'wrong'
}>()

defineEmits<{
  pick: [id: string]
}>()

const imgUrl = ref('')
const imgLoaded = ref(false)
const imgError = ref(false)

const categoryEmojis: Record<string, Record<string, string>> = {
  vehicle: {
    car: '🚗', train: '🚂', airplane: '✈️', bicycle: '🚲', ship: '🚢',
    motorcycle: '🏍️', helicopter: '🚁', police: '🚔', fire: '🚒',
    ambulance: '🚑', bus: '🚌', tractor: '🚜',
  },
  animal: {
    cat: '🐱', dog: '🐶', cow: '🐮', sheep: '🐑', chicken: '🐔',
    duck: '🦆', bird: '🐦', frog: '🐸', lion: '🦁', elephant: '🐘',
    horse: '🐴', pig: '🐷',
  },
}

function getEmoji(): string {
  const parts = props.option.id.split('-')
  const cat = parts[0]
  const name = parts.slice(1).join('-')
  return categoryEmojis[cat]?.[name] ?? (cat === 'vehicle' ? '🚗' : '🐾')
}

onMounted(async () => {
  try {
    const url = await getImageUrl(props.option)
    if (url && !url.startsWith('/src/')) {
      imgUrl.value = url
      const img = new Image()
      img.onload = () => { imgLoaded.value = true }
      img.onerror = () => { imgError.value = true }
      img.src = url
    } else {
      imgError.value = true
    }
  } catch {
    imgError.value = true
  }
})
</script>

<template>
  <button
    :class="['option-card', state ?? 'idle']"
    :disabled="disabled"
    @click="$emit('pick', option.id)"
  >
    <!-- Pexels 图片背景 -->
    <img v-if="imgLoaded" :src="imgUrl" :alt="option.name" class="card-bg" />
    <!-- Emoji 兜底背景 -->
    <div v-else-if="imgError" class="card-bg card-emoji-bg">{{ getEmoji() }}</div>
    <!-- 加载中 -->
    <div v-else class="card-bg card-skeleton" />

    <!-- 底部渐变遮罩 + 名称 -->
    <div class="card-overlay">
      <span class="card-name">{{ option.name }}</span>
    </div>
  </button>
</template>

<style scoped>
.option-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 180px;
  border: 4px solid rgba(0, 0, 0, 0.08);
  border-radius: 28px;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}

.option-card:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
  border-color: #4FC3F7;
}

.option-card:active:not(:disabled) {
  transform: scale(0.95);
}

.option-card:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.option-card.correct {
  border-color: #66BB6A !important;
  animation: bounce-in 0.5s ease;
  box-shadow: 0 8px 30px rgba(102, 187, 106, 0.4);
}

.option-card.wrong {
  border-color: #EF5350 !important;
  animation: shake 0.5s ease;
  box-shadow: 0 8px 30px rgba(239, 83, 80, 0.3);
}

/* 背景图片 */
.card-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

/* Emoji 兜底 */
.card-emoji-bg {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 90px;
  line-height: 1;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

/* 骨架屏 */
.card-skeleton {
  background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* 底部渐变遮罩 */
.card-overlay {
  position: relative;
  z-index: 1;
  padding: 40px 12px 14px;
  background: linear-gradient(transparent 0%, rgba(0, 0, 0, 0.35) 50%, rgba(0, 0, 0, 0.55) 100%);
}

.card-name {
  display: block;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  text-align: center;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}

@keyframes bounce-in {
  0% { transform: scale(1); }
  30% { transform: scale(1.12); }
  60% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-6px); }
  80% { transform: translateX(6px); }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
