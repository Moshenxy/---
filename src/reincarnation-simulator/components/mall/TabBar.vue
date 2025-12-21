<template>
  <div class="tab-bar">
    <div class="tab-item" @click="$emit('navigate', 'MallHomeView')">主页</div>
    <div class="tab-item" @click="$emit('navigate', 'CartView')">购物车</div>
    <div class="tab-item" @click="$emit('navigate', 'MyMallView')">我的</div>
  </div>
</template>

<script setup lang="ts">
defineEmits(['navigate']);
</script>

<style scoped lang="scss">
.tab-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 50px;
  background-color: #f8f8f8;
  border-top: 1px solid #e7e7e7;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}
.tab-item {
  cursor: pointer;
  padding: 0 20px;
  color: #333;
  &.active {
    color: #0d6efd;
  }
}
</style>