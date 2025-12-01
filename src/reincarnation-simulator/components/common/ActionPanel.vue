<template>
  <div class="action-panel">
    <button class="action-button" @click="$emit('open-main-menu')">主</button>
    <button class="action-button" @click="$emit('open-avatar-menu')">化</button>
    <button class="action-button" @click="$emit('toggle-history')">历史</button>
    <button class="action-button" @click="$emit('toggle-commands')">指令 ({{ commandCount }})</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  commandCount: number;
}>();

defineEmits(['open-main-menu', 'open-avatar-menu', 'toggle-history', 'toggle-commands']);
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.action-panel {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background-color: rgba($color-black-void, 0.7);
  border-radius: $border-radius-md;
  border: 1px solid rgba($color-gold-liu, 0.3);
  @include frosted-glass(rgba($color-indigo-deep, 0.8), 12px);
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.2);
}

.action-button {
  background: transparent;
  border: 1px solid rgba($color-gold-liu, 0.5);
  color: $color-gold-pale;
  padding: $spacing-sm $spacing-lg;
  border-radius: $border-radius-sm;
  font-family: $font-family-main;
  font-size: $font-size-base;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: rgba($color-gold-liu, 0.2);
    border-color: $color-gold-liu;
    color: $color-white-moon;
    box-shadow: 0 0 8px rgba($color-gold-liu, 0.5);
  }

  &.primary {
    background-color: rgba($color-gold-liu, 0.8);
    border-color: $color-gold-pale;
    color: $color-black-void;
    font-weight: bold;

    &:hover {
      background-color: $color-gold-pale;
      box-shadow: 0 0 12px rgba($color-gold-pale, 0.7);
    }
  }
}
</style>