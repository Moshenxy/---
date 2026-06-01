<template>
  <div class="panel-wrapper character-panel-container">
    <div v-if="currentAvatar" class="character-sheet">
      <!-- 命盘 -->
      <destiny-plate :character="currentAvatar" />

      <!-- 抽屉 -->
      <div class="additional-info-drawer" :class="{ 'is-open': isDrawerOpen }">
        <button class="drawer-toggle" @click="isDrawerOpen = !isDrawerOpen">
          <i class="drawer-icon"></i>
          <span>详情</span>
        </button>
        <div class="drawer-content">
          <!-- 世界专属属性 -->
          <div class="world-attributes-section">
            <h5 class="section-title">世界专属</h5>
            <ul
              v-if="worldSpecificAttributes && Object.keys(worldSpecificAttributes).length > 0"
              class="attributes-list"
            >
              <li v-for="(value, key) in worldSpecificAttributes" :key="key" class="attribute-item">
                <span class="label">{{ key }}</span>
                <span class="value">{{ formatAttribute(value) }}</span>
              </li>
            </ul>
            <div v-else class="empty-state">无</div>
          </div>

          <!-- 战斗参数 -->
          <div class="combat-attributes-section">
            <h5 class="section-title">战斗参数</h5>
            <ul v-if="combatAttributes && Object.keys(combatAttributes).length > 0" class="attributes-list">
              <li v-for="(value, key) in combatAttributes" :key="key" class="attribute-item">
                <span class="label">{{ key }}</span>
                <span class="value">{{ formatAttribute(value) }}</span>
              </li>
            </ul>
            <div v-else class="empty-state">无</div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="loading-state">化身数据加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { currentAvatar } from '../../../store/getters';
import DestinyPlate from '../DestinyPlate.vue';

const getDisplayValue = (value: any, defaultValue: any = 0) => {
  if (value === null || value === undefined) return defaultValue;
  return value;
};

const formatAttribute = (attr: any): string => {
  if (attr === null || attr === undefined) return '-';
  if (typeof attr === 'object' && !Array.isArray(attr)) {
    if (attr.当前 !== undefined && attr.上限 !== undefined) {
      return `${attr.当前} / ${attr.上限}`;
    }
    const keys = Object.keys(attr).filter(k => k !== '$meta');
    if (keys.length > 0) {
      return Object.entries(attr)
        .filter(([key]) => key !== '$meta')
        .map(([key, val]) => `${key}: ${getDisplayValue(val)}`)
        .join(', ');
    }
    return '复杂属性';
  }
  return String(getDisplayValue(attr));
};

const worldSpecificAttributes = computed(() => currentAvatar.value?.世界专属属性 || {});
const combatAttributes = computed(() => currentAvatar.value?.战斗参数 || {});

const isDrawerOpen = ref(false);
</script>

<style lang="scss" scoped>
@use '../../../styles/theme/variables' as *;
@use '../../../styles/theme/mixins' as *;

// 直接从本体面板导入样式
@import '../../../styles/components/_character-panel.scss';

.combat-attributes-section {
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: 1px solid rgba($color-gold-liu, 0.2);

  .section-title {
    font-family: $font-family-title;
    color: $color-gold-pale;
    text-align: center;
    margin-bottom: $spacing-md;
  }

  .attributes-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  .attribute-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.9em;
    .label {
      color: $color-grey-stone;
    }
    .value {
      color: $color-white-moon;
      font-weight: bold;
    }
  }

  .empty-state {
    text-align: center;
    color: $color-grey-stone;
    font-style: italic;
  }
}
</style>
