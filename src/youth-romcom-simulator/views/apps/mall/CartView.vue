<template>
  <div class="cart-view mall-page-container">
    <h1 class="page-title">购物车</h1>
    <div v-if="cartItems.length === 0" class="empty-state">
      <p>🛒</p>
      <p>购物车是空的</p>
    </div>
    <div v-else>
      <div class="cart-items">
        <div v-for="item in cartItems" :key="item.ID" class="cart-item">
          <span class="item-name">{{ item.名称 }}</span>
          <span class="item-quantity">x {{ item.quantity }}</span>
          <span class="item-price">¥ {{ item.价格 * item.quantity }}</span>
        </div>
      </div>
      <div class="cart-summary">
        <div class="summary-row">
          <span>商品小计</span>
          <span>¥ {{ total }}</span>
        </div>
        <div class="summary-row total">
          <span>总计</span>
          <span>¥ {{ total }}</span>
        </div>
      </div>
      <button @click="checkout" class="checkout-btn" :disabled="total <= 0 || money < total">
        {{ money < total ? '余额不足' : '结算' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { store, actions, getters } from '../../../store';

const cartItems = computed(() => store.cartItems);
const money = computed(() => getters.money.value);

const total = computed(() => {
  return store.cartItems.reduce((sum, item) => sum + item.价格 * item.quantity, 0);
});

function checkout() {
  actions.checkout();
}
</script>

<style scoped lang="scss">
// 样式已迁移到 /styles/apps/mall.scss
.empty-state p:first-child {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}
</style>
