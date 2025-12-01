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
    if ('当前' in value && '上限' in value) {
      let output = `${value['当前']}/${value['上限']}`;
      if ('恢复速度' in value) {
        output += ` (+${value['恢复速度']})`;
      }
      return output;
    }
    // For other complex objects, format them line by line
    return Object.entries(value)
      .map(([key, val]) => `${key}: ${val}`)
      .join('\n');
  }
  return String(value);
}
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

.attribute-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-lg;
}

.attribute-item {
  display: flex;
  flex-direction: column; // 让key和value垂直排列
  align-items: flex-start;
  gap: $spacing-sm;
  background-color: rgba($color-black-void, 0.3);
  padding: $spacing-md;
  border-radius: $border-radius-md;
  border: 1px solid rgba($color-gold-liu, 0.1);
  flex-basis: 45%; // 在足够宽的容器中，一行最多两个
  min-width: 150px; // 保证最小宽度
}

.attribute-key {
  color: $color-grey-stone;
  font-size: $font-size-small;
}

.attribute-value {
  color: $color-white-moon;
  font-weight: bold;
  font-size: $font-size-base;
  white-space: pre-wrap; // 支持换行显示
}
</style>
