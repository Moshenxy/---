<template>
  <div class="attribute-grid">
    <div v-for="(value, key) in filteredAttributes" :key="key" class="attribute-item">
      <span class="attribute-key">{{ key }}</span>
      <span class="attribute-value">{{ formatValue(value) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  attributes: Record<string, any>;
}>();

const filteredAttributes = computed(() => {
  if (!props.attributes) return {};
  const { $meta, ...rest } = props.attributes;
  return rest;
});

function formatValue(value: any): string {
  if (typeof value === 'object' && value !== null) {
    // Keep special formatting for progress-bar like objects
    if ('当前' in value && '上限' in value) {
      let output = `${value['当前']}/${value['上限']}`;
      if ('恢复速度' in value) {
        output += ` (+${value['恢复速度']})`;
      }
      return output;
    }
    // For any other object, return a placeholder, as the parent should handle it.
    return '[Object]';
  }
  return String(value);
}
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

.attribute-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: $spacing-md;
  width: 100%;
}

.attribute-item {
  display: flex;
  flex-direction: column;
  background: rgba($color-indigo-deep, 0.5);
  border-radius: $border-radius-md;
  padding: $spacing-md;
  border: 1px solid rgba($color-gold-liu, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -80%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba($color-gold-pale, 0.08), transparent);
    transform: skewX(-25deg);
    transition: left 0.6s ease;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba($color-gold-pale, 0.08);
    border-color: rgba($color-gold-pale, 0.3);
    &::before {
      left: 120%;
    }
  }
}

.attribute-key {
  font-size: $font-size-base;
  color: $color-grey-stone;
  margin-bottom: $spacing-xs;
  font-family: $font-family-main;
}

.attribute-value {
  font-size: $font-size-h2;
  font-family: $font-family-title;
  color: $color-gold-pale;
  font-weight: 400;
  text-shadow: 0 0 8px rgba($color-gold-liu, 0.5);
}
</style>
