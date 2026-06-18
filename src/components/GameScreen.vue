<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/game.store'
import { useGameEngine } from '@/composables/useGameEngine'
import { useAudio } from '@/composables/useAudio'
import { useSpeech } from '@/composables/useSpeech'
import { playCorrect, playWrong } from '@/services/feedback-sfx.service'
import GameHeader from './GameHeader.vue'
import SoundPlayer from './SoundPlayer.vue'
import OptionsGrid from './OptionsGrid.vue'
import FeedbackModal from './FeedbackModal.vue'
import Confetti from '@/components/common/Confetti.vue'

const store = useGameStore()
const engine = useGameEngine()
const audio = useAudio()
const speech = useSpeech()

const confetti = ref<InstanceType<typeof Confetti>>()

// 反馈弹窗状态
const feedbackShow = ref(false)
const feedbackCorrect = ref(false)
const resultState = ref<Record<string, 'correct' | 'wrong' | 'idle'>>({})
const answered = ref(false)

// 游戏开始 → 加载题库并播放声音
onMounted(async () => {
  await engine.startGame()
  setTimeout(() => audio.play(), 500)
})

// 离开答题界面 → 停止声音
onUnmounted(() => {
  audio.stopAll()
  speech.cancel()
})

// 监听 phase 变化（来自 answer action）
watch(() => store.phase, (newPhase) => {
  if (newPhase === 'FEEDBACK') {
    handleFeedback()
  }
})

function handlePick(id: string) {
  if (answered.value) return
  answered.value = true

  const isCorrect = engine.submitAnswer(id)

  // 设置每个选项的状态
  const states: Record<string, 'correct' | 'wrong' | 'idle'> = {}
  store.currentOptions.forEach((opt) => {
    if (opt.id === store.currentQuestion?.id) {
      states[opt.id] = 'correct'
    } else if (opt.id === id && !isCorrect) {
      states[opt.id] = 'wrong'
    } else {
      states[opt.id] = 'idle'
    }
  })
  resultState.value = states
}

function handleFeedback() {
  const result = store.lastResult
  if (!result) return

  // 停止题目声音播放
  audio.stopAll()

  feedbackCorrect.value = result.correct
  if (result.correct) {
    playCorrect()
    confetti.value?.start()
    if (store.currentQuestion) {
      setTimeout(() => speech.speak(store.currentQuestion!.name), 300)
    }
  } else {
    playWrong()
  }

  feedbackShow.value = true
}

function handleNext() {
  feedbackShow.value = false
  answered.value = false
  resultState.value = {}

  if (store.isLastRound) {
    // 最后一题 → 停止声音 → 进入结果页
    audio.stopAll()
    speech.cancel()
    engine.goNext()
  } else {
    engine.goNext()
    // 自动播放新题声音
    setTimeout(() => audio.play(), 400)
  }
}

function handleReplay() {
  // 关闭弹窗，重置答题状态，允许重新选择
  feedbackShow.value = false
  answered.value = false
  resultState.value = {}
  // phase 改回 PLAYING，使重新答题时 watch 能触发 FEEDBACK
  store.phase = 'PLAYING'
  audio.replay()
}

function handleBack() {
  audio.stopAll()
  speech.cancel()
  engine.goHome()
}

function handleToggleMute() {
  audio.toggleMute()
}
</script>

<template>
  <div class="game-screen">
    <Confetti ref="confetti" :duration="3000" />

    <!-- 题库加载中 -->
    <div v-if="engine.isLoadingQuestions.value" class="game-body">
      <div class="loading-hint">🔄 题目加载中...</div>
    </div>

    <template v-else>
    <GameHeader
      @back="handleBack"
      @toggle-mute="handleToggleMute"
    />

    <div class="game-body">
      <OptionsGrid
        :options="store.currentOptions"
        :disabled="answered"
        :result-state="resultState"
        @pick="handlePick"
      />

      <div class="play-area">
        <SoundPlayer
          :is-playing="audio.isPlaying.value"
          @play="audio.replay()"
        />
      </div>
    </div>

    <FeedbackModal
      :show="feedbackShow"
      :is-correct="feedbackCorrect"
      :item-name="store.currentQuestion?.name"
      :is-last-round="store.isLastRound"
      @next="handleNext"
      @replay="handleReplay"
    />
    </template>
  </div>
</template>

<style scoped>
.game-screen {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(180deg, #FFF8E1 0%, #FFECB3 50%, #FFF8E1 100%);
}

.game-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 28px 16px;
}

.play-area {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-hint {
  font-size: 28px;
  font-weight: 700;
  color: #999;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
