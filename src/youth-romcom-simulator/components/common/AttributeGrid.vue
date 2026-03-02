<template>
  <div class="attribute-grid">
    <div v-for="(value, key) in filteredAttributes" :key="key" class="attribute-item">
      <span class="attribute-key">{{ key }}</span>
      <span class="attribute-value">{{ formatValue(value) }}</span>
      <div v-if="isAttribute(value)" class="progress-bar-container">
        <div class="progress-bar" :style="{ width: calculateProgress(value) }"></div>
        <span class="progress-text">{{ value.经验值 }} / {{ getAttributeLevelInfo(value.等级)?.升级经验 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { 属性 as Attribute } from '../../types';

const props = defineProps<{
  attributes: Record<string, any>;
}>();

const 属性等级定义 = [
  { 等级: 'F', 修正值: -5, 升级经验: 100 }, { 等级: 'E', 修正值: -3, 升级经验: 200 }, { 等级: 'D', 修正值: -1, 升级经验: 300 },
  { 等级: 'C', 修正值: 0, 升级经验: 400 }, { 等级: 'B', 修正值: 2, 升级经验: 500 }, { 等级: 'A', 修正值: 5, 升级经验: 600 },
  { 等级: 'S', 修正值: 10, 升级经验: 800 }, { 等级: 'SS', 修正值: 15, 升级经验: 1000 }, { 等级: 'SSS', 修正值: 20, 升级经验: Infinity },
] as const;

const filteredAttributes = computed(() => {
  if (!props.attributes) return {};
  const { $meta, ...rest } = props.attributes;
  return rest;
});

function isAttribute(value: any): value is Attribute {
    return typeof value === 'object' && value !== null && '等级' in value && '经验值' in value;
}

function getAttributeLevelInfo(level: string) {
    return 属性等级定义.find(l => l.等级 === level);
}

function calculateProgress(value: Attribute) {
    const levelInfo = getAttributeLevelInfo(value.等级);
    if (!levelInfo || levelInfo.升级经验 === Infinity) return '0%';
    const progress = (value.经验值 / levelInfo.升级经验) * 100;
    return `${Math.min(progress, 100)}%`;
}

function formatValue(value: any): string {
  if (isAttribute(value)) {
    return `${value.等级} (${value.修正值 >= 0 ? '+' : ''}${value.修正值})`;
  }
  if (typeof value === 'object' && value !== null) {
    if ('当前' in value && '上限' in value) {
      let output = `${value['当前']}/${value['上限']}`;
      if ('恢复速度' in value) {
        output += ` (+${value['恢复速度']})`;
      }
      return output;
    }
    return JSON.stringify(value); // Fallback for other objects
  }
  return String(value);
}
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

.attribute-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
    background: linear-gradient(
      90deg,
      transparent,
      rgba($color-gold-pale, 0.08),
      transparent
    );
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
  margin-bottom: $spacing-sm;
  font-family: $font-family-main;
}

.attribute-value {
  font-size: $font-size-h3;
  font-family: $font-family-title;
  color: $color-gold-pale;
  font-weight: 400;
  text-shadow: 0 0 8px rgba($color-gold-liu, 0.5);
  margin-bottom: $spacing-sm;
}

.progress-bar-container {
    width: 100%;
    height: 18px;
    background-color: rgba($color-black-void, 0.5);
    border-radius: $border-radius-sm;
    border: 1px solid rgba($color-gold-liu, 0.1);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(90deg, $color-cyan-tian, darken($color-cyan-tian, 15%));
    border-radius: $border-radius-sm;
    transition: width 0.5s ease-in-out;
}

.progress-text {
    position: relative;
    z-index: 1;
    font-size: 10px;
    color: $color-white-moon;
    text-shadow: 0 0 2px $color-black-void;
}
</style>
