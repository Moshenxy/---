<template>
  <li>
    <span class="object-key" :title="value?.description">{{ itemKey }}:</span>
    <div class="value-cell">
      <!-- Case 1: Progress Bar (current/max) -->
      <template v-if="isProgressBar(value)">
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: `${(value.current / value.max) * 100}%` }"></div>
          <span class="progress-text">{{ value.current }} / {{ value.max }}</span>
        </div>
      </template>

      <!-- Case 2: Simple Value (value key) -->
      <template v-else-if="isSimpleValue(value)">
        <span class="object-value">{{ value.value }}</span>
      </template>

      <!-- Case 3: Data Item (ID, 名称, 描述) -->
      <template v-else-if="isDataItem(value)">
        <div class="data-item">
          <div v-for="(dataValue, dataKey) in value" :key="dataKey" class="data-item-row">
            <span class="data-item-key">{{ dataKey }}:</span>
            <span class="data-item-value">{{ dataValue }}</span>
          </div>
        </div>
      </template>

      <!-- Case 4: Recursive Object -->
      <template v-else-if="isObject(value)">
        <ul :class="{ 'multi-column': Object.keys(value).length > 4 }">
          <ObjectRendererItem
            v-for="(subValue, subKey) in filterMeta(value)"
            :key="subKey"
            :item-key="String(subKey)"
            :value="subValue"
          />
        </ul>
      </template>

      <!-- Case 4: Primitive Value -->
      <template v-else>
        <span class="object-value">{{ value }}</span>
      </template>
    </div>
  </li>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import ObjectRendererItem from './ObjectRendererItem.vue'; // Self-referencing

defineProps<{
  itemKey: string;
  value: any;
}>();

const isObject = (value: any): value is Record<string, any> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isProgressBar = (value: any) => {
  return isObject(value) && 'current' in value && 'max' in value;
};

const isSimpleValue = (value: any) => {
  return isObject(value) && 'value' in value && Object.keys(value).length <= 2;
};

const isDataItem = (value: any) => {
  return isObject(value) && ('ID' in value || '名称' in value) && !('value' in value) && !('current' in value);
};

const filterMeta = (data: Record<string, any>) => {
  if (!data) return {};
  const { $meta, ...rest } = data;
  return rest;
};
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

li {
  display: contents;
}

.object-key {
  color: $color-gold-pale;
  font-weight: bold;
  cursor: help;
  text-align: right;
  white-space: nowrap;
  padding-bottom: $spacing-lg;
}

.value-cell {
  padding-bottom: $spacing-lg;
  min-width: 0;

  > ul {
    list-style-type: none;
    padding-left: $spacing-md;
    margin-top: $spacing-sm;
    border-left: 1px solid rgba($color-gold-liu, 0.2);
    display: grid;
    grid-template-columns: auto 1fr;
    gap: $spacing-sm $spacing-md;

    &.multi-column {
      grid-template-columns: repeat(2, auto 1fr);
      gap: $spacing-sm $spacing-lg;
    }
  }
}

.object-value {
  color: $color-white-moon;
}

.progress-bar-container {
  width: 100%;
  background-color: rgba($color-black-void, 0.5);
  border-radius: $border-radius-sm;
  position: relative;
  height: 24px;
  border: 1px solid rgba($color-gold-liu, 0.3);
}

.progress-bar {
  background: linear-gradient(90deg, rgba($color-cyan-tian, 0.5) 0%, rgba($color-cyan-tian, 0.8) 100%);
  height: 100%;
  border-radius: $border-radius-sm;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: $color-white-moon;
  font-size: $font-size-small;
  text-shadow: 1px 1px 2px $color-black-void;
}

.data-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.data-item-row {
  display: grid;
  grid-template-columns: 80px 1fr;
}

.data-item-key {
  color: $color-gold-liu;
  font-weight: normal;
  text-align: right;
  padding-right: $spacing-sm;
}

.data-item-value {
  color: $color-white-moon;
}
</style>
