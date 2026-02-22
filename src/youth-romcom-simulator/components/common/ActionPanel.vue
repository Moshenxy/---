<template>
  <div class="action-panel">
    <div class="button-container">
      <button
        v-for="option in options"
        :key="option.id"
        class="action-button"
        :disabled="option.disabled && option.disabled()"
        @click="option.action"
      >
        {{ option.text }}
      </button>
      <button class="action-button" @click="$emit('toggle-history')">历史</button>
      <button class="action-button" @click="$emit('toggle-commands')">指令 ({{ commandCount }})</button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface MenuOption {
  id: string;
  icon: string;
  text: string;
  action: () => void;
  disabled?: () => boolean;
}

defineProps<{
  commandCount: number;
  options: MenuOption[];
}>();

defineEmits(['toggle-history', 'toggle-commands']);
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.action-panel {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding: $spacing-md;
  background-color: rgba($color-black-void, 0.7);
  border-radius: $border-radius-md;
  border: 1px solid rgba($color-gold-liu, 0.3);
  @include frosted-glass(rgba($color-indigo-deep, 0.8), 12px);
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.2);
}

.button-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: $spacing-md;
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
