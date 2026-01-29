<template>
  <div class="progress-bar-container">
    <span class="label">{{ label }}</span>
    <div class="progress-track">
      <div v-if="isBidirectional" class="center-tick"></div>
      <div class="progress-fill" :style="fillStyle"></div>
    </div>
    <span class="value">{{ displayValue }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  label: string;
  value: number;
  max?: number;
  min?: number;
  color: string;
}>();

const displayValue = computed(() => props.value);

const isBidirectional = computed(() => props.min !== undefined && props.min < 0);

const fillStyle = computed(() => {
  const min = props.min || 0;
  const max = props.max || 100;
  const value = Math.max(min, Math.min(max, props.value));

  if (isBidirectional.value) {
    const totalRange = max - min;
    if (value > 0) {
      return {
        left: '50%',
        right: 'auto',
        width: `${(value / max) * 50}%`,
        backgroundColor: props.color,
      };
    } else {
      return {
        left: 'auto',
        right: '50%',
        width: `${(Math.abs(value) / Math.abs(min)) * 50}%`,
        backgroundColor: '#e53935', // 使用红色表示负值
      };
    }
  } else {
    const percentage = max === min ? 0 : ((value - min) / (max - min)) * 100;
    return {
      left: '0',
      right: 'auto',
      width: `${percentage}%`,
      backgroundColor: props.color,
    };
  }
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  width: 100%;
}

.label {
  color: $color-grey-stone;
  font-size: $font-size-small;
  flex-basis: 60px;
  flex-shrink: 0;
  white-space: nowrap;
}

.progress-track {
  position: relative;
  flex-grow: 1;
  height: 8px;
  background-color: rgba($color-black-void, 0.5);
  border-radius: 4px;
  overflow: hidden;
}

.center-tick {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: rgba($color-grey-stone, 0.5);
}

.progress-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  height: 100%;
  border-radius: 4px;
  transition:
    width 0.5s ease,
    left 0.5s ease,
    right 0.5s ease;
}

.value {
  color: $color-white-moon;
  font-size: $font-size-small;
  font-weight: bold;
  flex-basis: 40px;
  flex-shrink: 0;
  text-align: right;
}
</style>
