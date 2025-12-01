<template>
  <div class="backpack-manager">
    <h3>开局背包</h3>
    <div class="item-selection">
      <div class="dropdown-wrapper">
        <span>选择物品...</span>
        <div class="custom-options">
          <template v-for="category in itemCategories" :key="category.type">
            <div class="category-header">{{ category.name }}</div>
            <div
              class="option-item"
              v-for="item in availableItems(category.type)"
              :key="item.id"
              @click="addItem(item.id)"
            >
              <span>{{ item.name }} ({{ item.cost }}点)</span>
              <button
                v-if="item.custom"
                @click.stop="removeCustomItem(category.type, item.id)"
                class="delete-custom-item"
              >
                ×
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
    <div class="selections-container">
      <div v-for="(count, itemId) in store.selections.backpack" :key="itemId" class="selected-item">
        <span>{{ getItemNameAndCategory(itemId) }} x {{ count }}</span>
        <div class="item-controls">
          <button @click="adjustItemCount(itemId, -1)">-</button>
          <button @click="adjustItemCount(itemId, 1)">+</button>
          <button @click="removeItem(itemId)" class="remove-btn">×</button>
        </div>
      </div>
    </div>
    <div class="custom-input-group">
      <select v-model="customItem.type">
        <option value="consumables">消耗品</option>
        <option value="artifacts">奇物</option>
        <option value="materials">材料</option>
      </select>
      <input type="text" placeholder="自定义名称..." v-model="customItem.name" />
      <textarea placeholder="自定义详情..." v-model="customItem.desc"></textarea>
      <button type="button" @click="addCustomItemLocal">添加自定义物品</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { store, GAME_DATA, addCustomItem, removeCustomItem } from '../store';

const itemCategories = [
  { type: 'consumables', name: '消耗品' },
  { type: 'artifacts', name: '奇物' },
  { type: 'materials', name: '材料' },
];

const customItem = ref({
  type: 'consumables',
  name: '',
  desc: '',
});

const allItems = computed(() => {
  return {
    consumables: GAME_DATA.consumables,
    artifacts: GAME_DATA.artifacts,
    materials: GAME_DATA.materials,
  };
});

const availableItems = type => {
  return allItems.value[type].filter(item => !store.selections.backpack[item.id]);
};

const getItemNameAndCategory = itemId => {
  for (const category of itemCategories) {
    const item = allItems.value[category.type].find(i => i.id === itemId);
    if (item) return `${item.name} (${category.name})`;
  }
  return '未知物品';
};

const addItem = itemId => {
  if (!store.selections.backpack[itemId]) {
    store.selections.backpack[itemId] = 1;
  }
};

const adjustItemCount = (itemId, amount) => {
  const currentCount = store.selections.backpack[itemId] || 0;
  const newCount = currentCount + amount;
  if (newCount > 0) {
    store.selections.backpack[itemId] = newCount;
  } else {
    removeItem(itemId);
  }
};

const removeItem = itemId => {
  delete store.selections.backpack[itemId];
};

const addCustomItemLocal = () => {
  const { type, name, desc } = customItem.value;
  if (name.trim() && desc.trim()) {
    addCustomItem(type, { name, desc });
    customItem.value.name = '';
    customItem.value.desc = '';
  }
};
</script>

<style scoped>
.backpack-manager {
  margin-top: 2rem;
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  padding-top: 2rem;
}
.item-category {
  margin-bottom: 2rem;
}
.item-category h4 {
  color: var(--color-cyan-tian);
  margin-bottom: 1rem;
}
.item-selection {
  margin-bottom: 1rem;
}
.item-controls {
  display: flex;
  align-items: center;
  margin-left: auto;
}
.item-controls button {
  width: 25px;
  height: 25px;
  background-color: var(--color-black-void);
  color: var(--color-gold-liu);
  border: 1px solid var(--color-gold-liu);
  border-radius: 50%;
  cursor: pointer;
  margin-left: 0.5rem;
  transition: all 0.2s;
}
.item-controls button:hover {
  background-color: var(--color-gold-liu);
  color: var(--color-black-void);
}
.item-controls .remove-btn {
  color: var(--color-red-chi);
  border-color: var(--color-red-chi);
}
.item-controls .remove-btn:hover {
  background-color: var(--color-red-chi);
  color: var(--color-black-void);
}
.custom-input-group select {
  background: rgba(10, 15, 30, 0.7);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 4px;
  color: var(--color-white-moon);
  padding: 0.5rem 1rem;
  font-family: var(--font-family-main);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}
.category-header {
  padding: 0.5rem 1.5rem;
  font-weight: bold;
  color: var(--color-cyan-tian);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  pointer-events: none;
}
.option-item {
  padding: 0.5rem 1.5rem 0.5rem 2.5rem; /* Indent items */
  cursor: pointer;
  color: var(--color-white-moon);
  font-size: 0.9rem;
  white-space: nowrap;
}
.option-item:hover {
  background-color: rgba(212, 175, 55, 0.2);
  color: var(--color-gold-pale);
}
.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.delete-custom-item {
  background: none;
  border: none;
  color: var(--color-red-chi);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 0.5rem;
}
</style>
