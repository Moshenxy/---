<template>
  <div v-if="item" class="item-detail-panel">
    <h4 class="detail-name">{{ item.名称 }}</h4>
    <div class="detail-meta">
      <span class="meta-tier" :style="getTierStyle(item, true)">能级 {{ item.能级 }}</span>
      <span class="meta-type">{{ item.类型 }}</span>
    </div>
    <p class="detail-desc">{{ item.描述 }}</p>
    <div v-if="item.effects" class="detail-effects">
      <h5>效果:</h5>
      <ul v-if="item.effects.attributes_bonus && Object.keys(item.effects.attributes_bonus).length > 1">
        <li v-for="(value, key) in item.effects.attributes_bonus" :key="key">
          <span v-if="key !== '$meta'">{{ key }}: +{{ value }}</span>
        </li>
      </ul>
      <ul v-if="item.effects.percentage_bonus && Object.keys(item.effects.percentage_bonus).length > 1">
        <li v-for="(value, key) in item.effects.percentage_bonus" :key="key">
          <span v-if="key !== '$meta'">{{ key }}: {{ value }}</span>
        </li>
      </ul>
    </div>
  </div>
  <div v-else class="empty-detail">
    <p>选择一个物品以查看详情</p>
  </div>
</template>

<script setup lang="ts">
import type { Bond, Consumable, Material, Relic } from '../../../types/items';

type Item = Consumable | Relic | Material | Bond;

const props = defineProps<{
  item: Item | null;
}>();

const tierColorMap: { [key: string]: string } = {
  common: '#a0a0a0',
  rare: '#3a8f9d',
  epic: '#8a5db5',
  legendary: '#d4af37',
};

const getTierStyle = (item: Item | null, isText: boolean = false): { [key: string]: string } => {
  let tierKey = 'common';
  if (item && item.能级) {
    const tier = item.能级;
    if (tier >= 9) tierKey = 'legendary';
    else if (tier >= 6) tierKey = 'epic';
    else if (tier >= 3) tierKey = 'rare';
  }
  if (isText) {
    return { color: tierColorMap[tierKey] };
  }
  return {
    '--tier-border-color': tierColorMap[tierKey],
  };
};
</script>

<style lang="scss" scoped>
@use '../../../styles/theme/variables' as *;
@use '../../../styles/theme/mixins' as *;

.item-detail-panel {
  padding: $spacing-lg;
  background-color: rgba($color-black-void, 0.3);
  border-radius: $border-radius-md;
  height: 100%;
  overflow-y: auto;
  @include custom-scrollbar;
}

.empty-detail {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: $color-grey-stone;
  font-style: italic;
  background-color: rgba($color-black-void, 0.3);
  border-radius: $border-radius-md;
}

.detail-name {
  font-family: $font-family-title;
  font-size: $font-size-h2;
  color: $color-gold-pale;
  margin-bottom: $spacing-sm;
}

.detail-meta {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-md;
  font-size: $font-size-small;
}

.meta-tier {
  font-weight: bold;
}

.meta-type {
  color: lighten($color-grey-stone, 30%);
}

.detail-desc {
  color: $color-gold-pale;
  line-height: 1.7;
  margin-bottom: $spacing-lg;
  font-size: $font-size-base;
}

.detail-effects {
  h5 {
    font-family: $font-family-title;
    color: $color-cyan-tian;
    margin-bottom: $spacing-sm;
  }

  ul {
    list-style: none;
    padding-left: 0;
    margin-bottom: $spacing-md;
  }

  li {
    color: $color-grey-stone;
    margin-bottom: $spacing-xs;
  }
}
</style>
