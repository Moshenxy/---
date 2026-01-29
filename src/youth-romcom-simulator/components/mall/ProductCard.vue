<template>
  <div class="product-card">
    <div class="product-image-container">
      <div class="product-image"><!-- Placeholder --></div>
    </div>
    <div class="product-details">
      <h3 class="product-name">{{ product.名称 }}</h3>
      <p class="product-description">{{ product.描述 }}</p>
      <div class="product-footer">
        <p class="product-price">¥ {{ product.价格 }}</p>
        <p class="product-stock">库存: {{ product.库存 }}</p>
        <button @click="$emit('addToCart', product)" :disabled="product.库存 === 0">
          +
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  product: {
    type: Object,
    required: true,
  },
});
defineEmits(['addToCart']);
</script>

<style scoped lang="scss">
// 样式已迁移到 /styles/apps/mall.scss
</style>