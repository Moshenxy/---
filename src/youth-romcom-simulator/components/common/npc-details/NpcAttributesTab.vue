<template>
  <div class="detail-tab-content grid-layout">
    <div class="detail-item full-width">
      <strong class="detail-key">属性</strong>
      <div v-if="attributes.length > 0" class="attributes-grid">
        <div v-for="attr in attributes" :key="attr.key" class="attribute-item">
          <div class="attr-header">
            <span class="attr-name">{{ attr.key }}</span>
            <span class="attr-value">{{ attr.等级 }} ({{ attr.修正值 >= 0 ? '+' : '' }}{{ attr.修正值 }})</span>
          </div>
          <div class="exp-bar-container">
            <div class="exp-bar">
              <div class="exp-fill" :style="{ width: `${attr.expPercentage}%` }"></div>
            </div>
            <span class="exp-text">{{ attr.经验值 }} / {{ attr.expToNextLevel }}</span>
          </div>
        </div>
      </div>
      <div v-else class="placeholder">无</div>
    </div>
    <div class="detail-item full-width">
      <strong class="detail-key">技能</strong>
      <div v-if="skills.length > 0" class="skills-list">
        <div v-for="skill in skills" :key="skill.name" class="skill-item">
          <div class="skill-header">
            <h3>{{ skill.name }}</h3>
            <div class="skill-level">等级 {{ skill.level }}</div>
          </div>
          <p class="skill-description">{{ skill.description }}</p>
        </div>
      </div>
      <div v-else class="placeholder">无</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { 角色 } from '../../../types';
import { 属性等级定义 } from '../../../types';

const props = defineProps<{ npc: 角色 }>();

const attributes = computed(() => {
  if (!props.npc.属性) return [];
  return Object.entries(props.npc.属性).map(([key, value]) => {
    const levelInfo = 属性等级定义.find((l: typeof 属性等级定义[number]) => l.等级 === value.等级);
    const expToNextLevel = levelInfo ? (levelInfo.升级经验 === Infinity ? 'MAX' : levelInfo.升级经验) : 0;
    const expPercentage = typeof expToNextLevel === 'number' && expToNextLevel > 0 ? (value.经验值 / expToNextLevel) * 100 : 0;
    return {
      key,
      ...value,
      expPercentage,
      expToNextLevel,
    };
  });
});

const skills = computed(() => {
  if (!props.npc.技能) return [];
  return Object.entries(props.npc.技能).map(([key, value]) => {
    return {
      name: key,
      level: value.等级,
      description: value.介绍,
    };
  });
});

</script>

<style lang="scss" scoped>
@use '../../../styles/theme/variables' as *;
@use '../../../styles/theme/mixins' as *;

.grid-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-lg;
}

.detail-item {
  &.full-width {
    grid-column: 1 / -1;
  }
  .detail-key {
    color: $color-gold-pale;
    font-family: $font-family-title;
    font-size: $font-size-large;
    display: block;
    margin-bottom: $spacing-md;
  }
}

.placeholder {
  color: $color-grey-stone;
  font-style: italic;
}

.attributes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-lg;
}

.attribute-item {
  background: rgba($color-black-void, 0.2);
  padding: $spacing-md;
  border-radius: $border-radius-md;
  border: 1px solid rgba($color-gold-liu, 0.1);
}

.attr-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: $spacing-sm;
}

.attr-name {
  font-weight: bold;
  color: $color-white-moon;
  font-size: $font-size-large;
}

.attr-value {
  color: $color-gold-pale;
  font-family: monospace;
  font-size: $font-size-base;
}

.exp-bar-container {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.exp-bar {
  flex-grow: 1;
  background: rgba($color-black-void, 0.5);
  border-radius: 5px;
  height: 6px;
  overflow: hidden;
  border: 1px solid rgba($color-black-void, 0.8);
}

.exp-fill {
  background: $color-cyan-tian;
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease-in-out;
  box-shadow: 0 0 8px rgba($color-cyan-tian, 0.5);
}

.exp-text {
  font-size: $font-size-small;
  color: $color-grey-stone;
  font-family: monospace;
  flex-shrink: 0;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.skill-item {
  background: rgba($color-black-void, 0.4);
  border-radius: $border-radius-sm;
  padding: $spacing-sm $spacing-md;
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: $font-size-base;
    color: $color-white-moon;
  }
}

.skill-level {
  font-size: $font-size-small;
  color: $color-grey-stone;
}

.skill-description {
  font-size: $font-size-small;
  color: $color-grey-stone;
  margin-top: $spacing-xs;
  line-height: 1.5;
}
</style>
