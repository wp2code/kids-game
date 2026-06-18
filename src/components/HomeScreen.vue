<script setup lang="ts">
import { useGameStore } from '@/stores/game.store'
import { CATEGORIES } from '@/data/categories'
import BaseButton from '@/components/common/BaseButton.vue'

const store = useGameStore()

function selectCategory(catId: 'vehicle' | 'animal') {
  store.selectCategory(catId)
}

function start() {
  store.startGame()
  // 触发导航：通过 watch phase 变化在 GameScreen 中处理
}
</script>

<template>
  <div class="home-screen">
    <div class="hero">
      <div class="title-icon">👂</div>
      <h1 class="title">听声音识物</h1>
      <p class="subtitle">竖起小耳朵，猜猜这是什么？</p>
    </div>

    <div class="category-section">
      <p class="section-hint">👇 选择一个类别开始游戏吧！</p>
      <div class="category-cards">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.id"
          :class="['category-card', { selected: store.category === cat.id }]"
          :style="{ '--cat-color': cat.color }"
          @click="selectCategory(cat.id)"
        >
          <span class="cat-emoji">{{ cat.emoji }}</span>
          <span class="cat-name">{{ cat.name }}</span>
          <span class="cat-desc">{{ cat.description }}</span>
        </button>
      </div>
    </div>

    <div class="start-section">
      <BaseButton
        v-if="store.category"
        size="large"
        @click="start"
      >
        🎮 开始游戏！
      </BaseButton>
      <p v-else class="start-hint">选一个类别，然后点击开始～</p>
    </div>

    <div v-if="store.bestScore > 0" class="best-score">
      🏆 最高记录：{{ store.bestScore }} 分
    </div>
  </div>
</template>

<style scoped>
.home-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 40px 20px;
  gap: 36px;
  background: linear-gradient(180deg, #FFF8E1 0%, #FFECB3 100%);
}

.hero {
  text-align: center;
}

.title-icon {
  font-size: 72px;
  animation: bounce 2s infinite;
  margin-bottom: 8px;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.title {
  font-size: 42px;
  font-weight: 800;
  color: #FF7043;
  margin: 0;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.06);
}

.subtitle {
  font-size: 22px;
  color: #888;
  margin-top: 8px;
}

.category-section {
  text-align: center;
}

.section-hint {
  font-size: 18px;
  color: #999;
  margin-bottom: 16px;
}

.category-cards {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 36px;
  border-radius: 28px;
  border: 4px solid transparent;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 180px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  -webkit-tap-highlight-color: transparent;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
}

.category-card.selected {
  border-color: var(--cat-color);
  background: color-mix(in srgb, var(--cat-color) 10%, #fff);
  box-shadow: 0 8px 28px color-mix(in srgb, var(--cat-color) 30%, transparent);
}

.cat-emoji {
  font-size: 52px;
}

.cat-name {
  font-size: 24px;
  font-weight: 700;
  color: #444;
}

.cat-desc {
  font-size: 15px;
  color: #aaa;
}

.start-section {
  text-align: center;
}

.start-hint {
  font-size: 18px;
  color: #bbb;
  font-style: italic;
}

.best-score {
  font-size: 20px;
  font-weight: 700;
  color: #FFB74D;
}
</style>
