<template>
  <div class="attribute-display">
    <div class="attribute-header">
      <span class="attribute-name">{{ name }}</span>
      <span class="attribute-level">{{ value.等级 }}</span>
    </div>
    <div class="xp-bar">
      <div class="xp-bar-fill" :style="{ width: xpPercentage + '%' }"></div>
    </div>
    <div class="attribute-details">
      <span>修正: {{ value.修正值 >= 0 ? '+' : '' }}{{ value.修正值 }}</span>
      <span>XP: {{ value.经验值 }} / {{ nextLevelXp }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Attribute {
  等级: string;
  经验值: number;
  修正值: number;
}

const props = defineProps<{
  name: string;
  value: Attribute;
}>();

const levelXpRequirements: Record<string, number> = {
  F: 100,
  E: 200,
  D: 300,
  C: 400,
  B: 500,
  A: 600,
  S: 800,
  SS: 1000,
  SSS: Infinity,
};

const nextLevelXp = computed(() => {
  return levelXpRequirements[props.value.等级] || 100;
});

const xpPercentage = computed(() => {
  if (nextLevelXp.value === 0) return 0;
  return Math.min((props.value.经验值 / nextLevelXp.value) * 100, 100);
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

.attribute-display {
  background-color: rgba($color-indigo-deep, 0.5);
  border: 1px solid rgba($color-gold-liu, 0.2);
  border-radius: $border-radius-md;
  padding: 12px;
}

.attribute-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  .attribute-name {
    font-weight: bold;
    color: $color-white-moon;
  }
  .attribute-level {
    font-size: 18px;
    font-weight: bold;
    font-family: $font-family-title;
    color: $color-gold-pale;
  }
}

.xp-bar {
  width: 100%;
  height: 6px;
  background-color: rgba($color-black-void, 0.5);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;

  .xp-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, $color-gold-pale, $color-gold-liu);
    border-radius: 3px;
    transition: width 0.5s ease;
  }
}

.attribute-details {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: $color-grey-stone;
}
</style>
