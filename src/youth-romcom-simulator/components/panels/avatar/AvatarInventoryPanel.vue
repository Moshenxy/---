<template>
  <div class="panel-wrapper inventory-panel">
    <div v-if="currentAvatar" class="inventory-layout" :class="{ 'detail-open': selectedItem }">
      <!-- Main Content: Categories and Grid -->
      <div class="main-content">
        <!-- 画卷式物品展示 -->
        <div class="item-grid-container">
          <div class="item-grid">
            <template v-for="(item, index) in avatarItems" :key="item.ID || `item-${index}`">
              <!-- 渲染物品卡片 -->
              <div class="item-cell" :style="getTierStyle(item)" @click="selectItem(item)">
                <!-- 环绕文字SVG -->
                <svg class="item-name-arc" viewBox="0 0 100 100">
                  <defs>
                    <!-- 定义文字环绕的路径 -->
                    <path :id="`arc-path-${item.ID || index}`" d="M 12,52 a 38,38 0 1,1 76,0" fill="none" />
                  </defs>
                  <text>
                    <textPath
                      class="arc-text"
                      :xlink:href="`#arc-path-${item.ID || index}`"
                      startOffset="50%"
                      text-anchor="middle"
                    >
                      {{ item.名称 }}
                    </textPath>
                  </text>
                </svg>
                <div class="item-footer">
                  <span v-if="'数量' in item && item.数量" class="item-quantity">x{{ item.数量 }}</span>
                </div>
              </div>
            </template>
          </div>
          <div v-if="avatarItems.length === 0" class="empty-grid">
            <p>空空如也</p>
          </div>
        </div>
      </div>

      <!-- Right: Item Detail Scroll -->
      <div class="scroll-detail-view">
        <div v-if="selectedItem" class="scroll-content">
          <button @click="closeDetail" class="close-button">×</button>
          <h4 class="detail-name" :style="getTierStyle(selectedItem)">{{ selectedItem.名称 }}</h4>
          <div class="detail-meta">
            <span v-if="selectedItem.能级" class="meta-tier">能级 {{ selectedItem.能级 }}</span>
            <span v-if="selectedItem.类型" class="meta-type">{{ selectedItem.类型 }}</span>
          </div>
          <p class="detail-desc">{{ selectedItem.描述 }}</p>
          <div v-if="selectedItem.effects" class="detail-effects">
            <h5>效果:</h5>
            <ul
              v-if="
                selectedItem.effects.attributes_bonus && Object.keys(selectedItem.effects.attributes_bonus).length > 0
              "
            >
              <li v-for="(value, key) in selectedItem.effects.attributes_bonus" :key="key">{{ key }} +{{ value }}</li>
            </ul>
            <ul
              v-if="
                selectedItem.effects.percentage_bonus && Object.keys(selectedItem.effects.percentage_bonus).length > 0
              "
            >
              <li v-for="(value, key) in selectedItem.effects.percentage_bonus" :key="key">{{ key }} {{ value }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="loading">加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { currentAvatar, avatarInventory } from '../../../store/getters';
import type { Bond, Consumable, Material, Relic } from '../../../types/items';
import { get } from 'lodash';

type Item = Consumable | Relic | Material | Bond;
const selectedItem = ref<Item | null>(null);

const selectItem = (item: Item) => {
  selectedItem.value = item;
};

const closeDetail = () => {
  selectedItem.value = null;
};

const avatarItems = computed(() => {
  return avatarInventory.value;
});

const tierColorMap: { [key: string]: string } = {
  common: '128, 128, 128', // grey-stone
  rare: '45, 200, 240', // cyan-tian
  epic: '138, 43, 226', // purple-mystery
  legendary: '218, 165, 32', // gold-liu
};

const getTierStyle = (item: Item | null): { [key: string]: string } => {
  let tierKey = 'common';
  if (item && item.能级) {
    const tier = item.能级;
    if (tier >= 9) tierKey = 'legendary';
    else if (tier >= 6) tierKey = 'epic';
    else if (tier >= 3) tierKey = 'rare';
  }
  return {
    '--tier-color-rgb': tierColorMap[tierKey],
  };
};
</script>

<style lang="scss" scoped>
@use '../../../styles/theme/variables' as *;
@use '../../../styles/theme/mixins' as *;
@import '../../../styles/components/inventory-panel';
</style>
