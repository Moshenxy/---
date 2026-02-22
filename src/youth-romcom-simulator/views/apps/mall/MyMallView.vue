<template>
  <div class="my-mall-view mall-page-container">
    <div class="user-info-card">
      <h2>{{ userFullName }}</h2>
      <p>余额: ¥ {{ money }}</p>
    </div>
    
    <div class="pending-orders">
      <h3 class="section-title">待收货的订单</h3>
      <div v-if="pendingOrders.length === 0" class="empty-state">
        <p>📦</p>
        <p>没有待收货的订单</p>
      </div>
      <div v-else>
        <div v-for="(order, index) in pendingOrders" :key="order.ID || index" class="order-item">
          <span class="order-details">{{ order.名称 }} x{{ order.数量 }}</span>
          <span class="order-delivery-time">预计送达: {{ new Date(order.送货时间).toLocaleString() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { store, getters } from '../../../store';

const character = computed(() => store.character);
const money = computed(() => getters.money.value);
const pendingOrders = computed(() => getters.pendingOrders.value);
const userFullName = computed(() => getters.userFullName.value);
</script>

<style scoped lang="scss">
// 样式已迁移到 /styles/apps/mall.scss
.empty-state p:first-child {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}
</style>