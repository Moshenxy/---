<template>
  <div class="inventory-panel">
    <div class="panel-section">
      <div class="section-title">我的背包</div>
      <div class="inventory-grid">
        <div v-for="item in inventory" :key="item.id" class="inventory-item">
          <div class="item-name">{{ item.name }}</div>
          <div class="item-quantity">x{{ item.quantity }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
}

const inventory = ref<InventoryItem[]>([]);

onMounted(() => {
  // Mock data for display purposes
  inventory.value = [
    { id: 'food001', name: '学生A套餐', quantity: 1 },
    { id: 'snack002', name: 'Pocky巧克力棒', quantity: 3 },
    { id: 'study001', name: '《高等数学辅导》', quantity: 1 },
  ];
});
</script>

<style lang="scss" scoped>
.inventory-panel {
  padding: 15px;
}

.panel-section {
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #eae6dd;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #3a3f4b;
  margin-bottom: 12px;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.inventory-item {
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 6px;
  text-align: center;
}

.item-name {
  font-weight: 500;
}

.item-quantity {
  color: #6c757d;
  font-size: 12px;
}
</style>