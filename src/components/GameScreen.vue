<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
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

// 游戏开始 → 播放声音
onMounted(() => {
  engine.startGame()
  setTimeout(() => audio.play(), 500)
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
    // 最后一题 → 进入结果页
    engine.goNext()
  } else {
    engine.goNext()
    // 自动播放新题声音
    setTimeout(() => audio.play(), 400)
  }
}

function handleReplay() {
  audio.replay()
}

function handleBack() {
  engine.goHome()
}

function handleToggleMute() {
  audio.toggleMute()
}
</script>

<template>
  <div class="game-screen">
    <Confetti ref="confetti" :duration="3000" />

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
</style>
