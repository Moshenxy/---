<template>
  <div class="panel-wrapper character-panel-container">
    <div v-if="character" class="character-sheet">
      <!-- 命盘 -->
      <destiny-plate :character="character" />

      <!-- 抽屉 -->
      <div class="additional-info-drawer" :class="{ 'is-open': isDrawerOpen }">
        <button class="drawer-toggle" @click="isDrawerOpen = !isDrawerOpen">
          <i class="drawer-icon"></i>
          <span>详情</span>
        </button>
        <div class="drawer-content">
          <div class="info-item">
            <span class="label">真名:</span>
            <span class="value">{{ getDisplayValue(character.真名, '未知') }}</span>
          </div>
          <div class="info-item">
            <span class="label">道心:</span>
            <span class="value">{{ daoHeart }}</span>
          </div>
          <!-- 世界专属属性 -->
          <div class="world-attributes-section">
            <h5 class="section-title">世界专属</h5>
            <ul v-if="worldAttributes.length > 0" class="attributes-list">
              <li v-for="attr in worldAttributes" :key="attr.key" class="attribute-item">
                <span class="label">{{ attr.key }}</span>
                <span class="value">{{ formatAttributeValue(attr.value) }}</span>
              </li>
            </ul>
            <div v-else class="empty-state">无</div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="loading-state">加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { playerWorldAttributes } from '../../store/getters';
import { store } from '../../store';
import DestinyPlate from './DestinyPlate.vue';

const getDisplayValue = (value: any, defaultValue: any = 0) => {
  if (value === null || value === undefined) return defaultValue;
  return value;
};

const formatAttributeValue = (attrValue: any): string => {
  if (attrValue === null || attrValue === undefined) return '-';

  if (typeof attrValue === 'object' && !Array.isArray(attrValue)) {
    // 移除 '名称' 键，因为它现在显示为 key
    const { 名称, ...rest } = attrValue;
    const keys = Object.keys(rest).filter(k => k !== '$meta' && k !== 'description');

    if (keys.length === 0) return ''; // 如果只剩下名称，则不显示任何值

    // Case 1: Progress bar
    if (rest.current !== undefined && rest.max !== undefined) {
      return `${rest.current} / ${rest.max}`;
    }
    if (rest.当前 !== undefined && rest.上限 !== undefined) {
      return `${rest.当前} / ${rest.上限}`;
    }

    // Case 2: Simple value wrapper
    if (rest.value !== undefined && keys.length === 1) {
      return String(getDisplayValue(rest.value));
    }

    // Case 3: List of named items
    if (keys.length > 0 && keys.every(k => typeof rest[k] === 'object' && rest[k]?.名称)) {
      return keys.map(k => rest[k].名称).join('、');
    }

    // Case 4: Composite structure
    if (keys.length > 0) {
      return keys.map(key => `${key}: ${getDisplayValue(rest[key])}`).join(' | ');
    }

    return '...';
  }

  return String(getDisplayValue(attrValue));
};

const character = computed(() => store.character);
const soulOrigin = computed(() => getDisplayValue(character.value?.灵魂本源, 0));
const daoHeart = computed(() => getDisplayValue(character.value?.道心, 0));
const worldAttributes = playerWorldAttributes;

const isDrawerOpen = ref(false);
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.character-panel-container {
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
  background-color: transparent;
}

.character-sheet {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-state {
  @include flex-center;
  height: 100%;
  font-family: $font-family-title;
  color: $color-gold-pale;
}

.additional-info-drawer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba($color-black-void, 0.8);
  backdrop-filter: blur(5px);
  border-top: 1px solid rgba($color-gold-liu, 0.3);
  transform: translateY(100%);
  transition: transform 0.4s ease-in-out;
  z-index: 100;

  &.is-open {
    transform: translateY(0);
  }

  .drawer-toggle {
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba($color-gold-liu, 0.8);
    color: $color-black-void;
    border: none;
    border-radius: 10px 10px 0 0;
    padding: $spacing-xs $spacing-md;
    cursor: pointer;
    font-family: $font-family-title;
  }

  .drawer-content {
    padding: $spacing-lg;
    padding-top: $spacing-xl;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    font-size: $font-size-base;
    .label {
      color: $color-grey-stone;
    }
    .value {
      color: $color-white-moon;
      font-weight: bold;
    }
  }

  .world-attributes-section {
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
}
</style>
