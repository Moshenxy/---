<template>
  <Modal :show="show" title="我的背包" @close="$emit('close')">
    <div class="inventory-container">
      <div class="inventory-menu-column">
        <!-- 分类菜单将由JS填充 -->
        <div class="menu-item active">全部</div>
        <div class="menu-item">消耗品</div>
        <div class="menu-item">装备</div>
        <div class="menu-item">任务物品</div>
      </div>
      <div class="inventory-display-column">
        <!-- 物品列表将由JS填充 -->
        <p class="empty-category-text">背包是空的。</p>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import Modal from './Modal.vue';

defineProps({
  show: {
    type: Boolean,
    required: true,
  },
});

defineEmits(['close']);
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '../../styles/main.scss' as *;

.inventory-container {
  display: flex;
  height: 100%;
  gap: 15px;
}

.inventory-menu-column {
  flex: 0 0 150px;
  border-right: 1px solid $theme-border-color;
  padding-right: 15px;
  overflow-y: auto;

  .menu-item {
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s ease, color 0.2s ease;

    &:hover {
      background-color: $theme-secondary-bg;
    }

    &.active {
      background-color: color.scale($royal-blue, $alpha: -90%);
      color: $royal-blue;
      font-weight: 600;
    }
  }
}

.inventory-display-column {
  flex-grow: 1;
  overflow-y: auto;
}

.empty-category-text {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: $steel-gray;
  font-style: italic;
}
</style>