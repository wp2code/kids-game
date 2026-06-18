<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'ghost' | 'danger'
  disabled?: boolean
  size?: 'normal' | 'large'
}>()
</script>

<template>
  <button
    :class="['base-btn', `btn-${variant ?? 'primary'}`, `btn-${size ?? 'normal'}`]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 24px;
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 64px;
  min-width: 64px;
  padding: 16px 32px;
  font-size: 22px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.base-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.base-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #FF7043, #FF5722);
  color: #fff;
  box-shadow: 0 6px 20px rgba(255, 87, 34, 0.35);
}
.btn-primary:hover:not(:disabled) {
  box-shadow: 0 8px 28px rgba(255, 87, 34, 0.5);
  transform: translateY(-2px);
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.7);
  color: #555;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.btn-ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.btn-danger {
  background: linear-gradient(135deg, #EF5350, #E53935);
  color: #fff;
  box-shadow: 0 6px 20px rgba(229, 57, 53, 0.35);
}

.btn-large {
  padding: 20px 48px;
  font-size: 28px;
  min-height: 80px;
  border-radius: 32px;
}
</style>
