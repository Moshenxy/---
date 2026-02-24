<template>
  <div class="promotion-banner">
    <h2>本周特惠</h2>
    <div v-if="promotions.length" class="promo-container">
      <div v-for="promo in promotions" :key="promo.ID" class="promo-card">
        <div class="promo-image-placeholder"></div>
        <div class="promo-details">
          <div class="promo-name">{{ promo.名称 }}</div>
          <div class="promo-price">
            <span class="original-price">¥{{ promo.价格 }}</span>
            <span class="discounted-price">¥{{ Math.round(promo.价格 * promo.discount) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="no-promo">
      本周暂无特惠活动，敬请期待！
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { store } from '../../store';

// 这是一个示例，实际的促销数据需要从store中获取
const promotions = computed(() => store.promotions);
</script>

<style scoped lang="scss">
// 样式已迁移到 /styles/apps/mall.scss
</style>