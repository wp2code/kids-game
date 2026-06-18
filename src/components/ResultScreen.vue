<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '@/stores/game.store'
import { useGameEngine } from '@/composables/useGameEngine'
import { stopAll as stopAllAudio } from '@/services/audio-player'
import BaseButton from '@/components/common/BaseButton.vue'
import Confetti from '@/components/common/Confetti.vue'

const store = useGameStore()
const engine = useGameEngine()

function handleRestart() {
  engine.startGame()
}

function handleHome() {
  engine.goHome()
}

const confetti = ref<InstanceType<typeof Confetti>>()

const totalPoints = computed(() => store.totalRounds * 10)

const stars = computed(() => {
  const ratio = totalPoints.value > 0 ? store.score / totalPoints.value : 0
  if (ratio >= 1) return 3
  if (ratio >= 0.6) return 2
  if (ratio > 0) return 1
  return 0
})

const encouragement = computed(() => {
  const ratio = totalPoints.value > 0 ? store.score / totalPoints.value : 0
  if (ratio >= 1) return '太厉害了！全部答对！你是听力小冠军！🏆'
  if (ratio >= 0.8) return '非常棒！你几乎全对啦！👏'
  if (ratio >= 0.6) return '做得不错哦，继续加油！💪'
  if (ratio >= 0.4) return '还不错，多玩几次会更棒！😊'
  return '没关系，再来一次会更好哦！🌟'
})

onMounted(() => {
  // 停止题目声音和语音朗读
  stopAllAudio()
  window.speechSynthesis?.cancel()

  if (stars.value >= 2) {
    setTimeout(() => confetti.value?.start(), 500)
  }
})
</script>

<template>
  <div class="result-screen">
    <Confetti ref="confetti" />

    <div class="result-card">
      <div class="result-icon">🏆</div>
      <h1 class="result-title">游戏结束！</h1>

      <div class="stars-row">
        <span
          v-for="i in 3"
          :key="i"
          :class="['star', { active: i <= stars }]"
        >
          {{ i <= stars ? '⭐' : '☆' }}
        </span>
      </div>

      <p class="encouragement">{{ encouragement }}</p>

      <div class="stats">
        <div class="stat">
          <span class="stat-num">{{ store.totalRounds * 10 }}</span>
          <span class="stat-label">总分</span>
        </div>
        <div class="stat correct">
          <span class="stat-num">{{ store.score }}</span>
          <span class="stat-label">答对分 ✅</span>
        </div>
        <div class="stat wrong">
          <span class="stat-num">{{ store.wrongCount }}</span>
          <span class="stat-label">答错分 ❌</span>
        </div>
      </div>

      <div v-if="store.score > store.bestScore && store.score > 0" class="new-record">
        🎉 新纪录！
      </div>

      <div class="result-actions">
        <BaseButton variant="primary" size="large" @click="handleRestart">
          🔄 再来一局
        </BaseButton>
        <BaseButton variant="ghost" @click="handleHome">
          🏠 返回首页
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 40px 20px;
  background: linear-gradient(180deg, #E8F5E9 0%, #FFF8E1 100%);
}

.result-card {
  background: #fff;
  border-radius: 32px;
  padding: 40px 32px;
  text-align: center;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  animation: pop-in 0.5s ease;
}

.result-icon {
  font-size: 72px;
  margin-bottom: 8px;
}

.result-title {
  font-size: 34px;
  font-weight: 800;
  color: #444;
  margin: 0 0 16px 0;
}

.stars-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.star {
  font-size: 48px;
  opacity: 0.2;
  transition: all 0.3s ease;
}

.star.active {
  opacity: 1;
  animation: star-pop-in 0.5s ease backwards;
}

.star:nth-child(2).active { animation-delay: 0.15s; }
.star:nth-child(3).active { animation-delay: 0.3s; }

.encouragement {
  font-size: 20px;
  color: #666;
  margin: 0 0 24px 0;
  font-weight: 600;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-num {
  font-size: 36px;
  font-weight: 800;
}

.stat-label {
  font-size: 14px;
  color: #999;
  font-weight: 600;
}

.stat.correct .stat-num { color: #66BB6A; }
.stat.wrong .stat-num { color: #EF5350; }

.new-record {
  font-size: 22px;
  font-weight: 700;
  color: #FF7043;
  margin-bottom: 20px;
  animation: bounce 0.8s infinite;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

@keyframes pop-in {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes star-pop-in {
  0% { transform: scale(0) rotate(-30deg); opacity: 0; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
</style>
