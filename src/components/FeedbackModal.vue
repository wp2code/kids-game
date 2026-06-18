<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { ENCOURAGEMENTS } from '@/data/encouragements'

const props = defineProps<{
  show: boolean
  isCorrect: boolean
  itemName?: string
  isLastRound?: boolean
}>()

const emit = defineEmits<{
  next: []
  replay: []
}>()

const canClose = ref(false)
const showContent = ref(false)

// 避免连续重复
let lastCorrectIdx = -1
let lastWrongIdx = -1

const title = computed(() => props.isCorrect ? '恭喜你答对了！🎉' : '哎呀，听错了～😊')

const detailText = computed(() => {
  if (!props.itemName) return ''
  if (props.isCorrect) {
    const pool = ENCOURAGEMENTS.correct
    let idx: number
    do { idx = Math.floor(Math.random() * pool.length) } while (idx === lastCorrectIdx && pool.length > 1)
    lastCorrectIdx = idx
    return pool[idx]
  } else {
    const pool = ENCOURAGEMENTS.wrong
    let idx: number
    do { idx = Math.floor(Math.random() * pool.length) } while (idx === lastWrongIdx && pool.length > 1)
    lastWrongIdx = idx
    return `你听错了，这是${props.itemName}的声音哦！${pool[idx]}`
  }
})

let autoTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.show, (val) => {
  if (val) {
    canClose.value = false
    showContent.value = true
    if (props.isCorrect) {
      // 答对：1.5s 后自动进入下一题
      autoTimer = setTimeout(() => {
        showContent.value = false
        emit('next')
      }, 1500)
    } else {
      // 答错：800ms 后允许手动关闭
      setTimeout(() => { canClose.value = true }, 800)
    }
  } else {
    showContent.value = false
    canClose.value = false
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null }
  }
})

const emoji = computed(() => props.isCorrect ? '🎉' : '😊')
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show && showContent" class="modal-overlay" @click.self="canClose && $emit('next')">
        <div :class="['modal-card', { correct: isCorrect, wrong: !isCorrect }]">
          <div class="modal-emoji">{{ emoji }}</div>
          <h2 class="modal-title">{{ title }}</h2>
          <p class="modal-detail">{{ detailText }}</p>

          <div class="modal-actions">
            <BaseButton
              v-if="!isCorrect"
              variant="ghost"
              @click="showContent = false; $emit('replay')"
            >
              🔄 再听一次
            </BaseButton>
            <BaseButton
              @click="canClose && $emit('next')"
              :disabled="!canClose"
            >
              {{ isLastRound ? '🏆 看结果' : '👉 下一题' }}
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 20px;
}

.modal-card {
  background: #fff;
  border-radius: 32px;
  padding: 40px 32px;
  text-align: center;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: pop-in 0.4s ease;
}

.modal-card.correct {
  border: 4px solid #66BB6A;
}

.modal-card.wrong {
  border: 4px solid #FFB74D;
}

.modal-emoji {
  font-size: 64px;
  margin-bottom: 8px;
}

.modal-title {
  font-size: 30px;
  font-weight: 800;
  margin: 0 0 12px 0;
}

.modal-card.correct .modal-title {
  color: #66BB6A;
}

.modal-card.wrong .modal-title {
  color: #FFB74D;
}

.modal-detail {
  font-size: 22px;
  color: #444;
  margin: 0 0 24px 0;
  font-weight: 600;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

@keyframes pop-in {
  0% { transform: scale(0.7); opacity: 0; }
  70% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

.modal-enter-active { transition: all 0.3s ease; }
.modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
