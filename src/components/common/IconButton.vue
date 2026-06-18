<script setup lang="ts">
defineProps<{
  icon: string
  label?: string
  size?: 'normal' | 'large'
}>()
defineEmits<{
  click: []
}>()
</script>

<template>
  <button :class="['icon-btn', `size-${size ?? 'normal'}`]" @click="$emit('click')">
    <span class="icon">{{ icon }}</span>
    <span v-if="label" class="label">{{ label }}</span>
  </button>
</template>

<style scoped>
.icon-btn {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: none;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 64px;
  min-width: 64px;
  padding: 12px 16px;
  -webkit-tap-highlight-color: transparent;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
}

.icon-btn:active {
  transform: scale(0.92);
}

.icon {
  font-size: 36px;
  line-height: 1;
}

.size-large .icon {
  font-size: 48px;
}

.label {
  font-size: 14px;
  color: #666;
  font-weight: 600;
}
</style>
