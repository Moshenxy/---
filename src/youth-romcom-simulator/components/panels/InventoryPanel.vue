<template>
  <div class="inventory-panel-container">
    <div v-if="playerCharacter" class="inventory-layout">
      <div class="list-view-container">
        <div class="category-header">
          <ul>
            <li
              v-for="category in (Object.keys(groupedItems) as CategoryKey[])"
              :key="category"
              :class="{ active: selectedCategory === category }"
              @click="selectCategory(category)"
            >
              {{ category }} ({{ groupedItems[category].length }})
            </li>
          </ul>
        </div>
        <div class="main-content">
          <div class="item-grid-container">
            <div class="item-grid" v-if="itemsInSelectedCategory.length > 0">
              <div
                v-for="item in itemsInSelectedCategory"
                :key="item.ID"
                class="item-cell"
                :style="getTypeStyle(item)"
                @click="selectItem(item)"
              >
                <div class="item-name">{{ item.名称 }}</div>
                <div class="item-quantity" v-if="item.数量">x{{ item.数量 }}</div>
              </div>
            </div>
            <div v-else class="empty-grid">
              <p>空空如也</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="loading">加载中...</div>

    <!-- Item Detail Modal -->
    <div v-if="selectedItemForModal" class="modal-overlay" @click="selectedItemForModal = null">
      <div class="modal-content" @click.stop>
         <ItemDetailPanel :item="selectedItemForModal" />
         <button class="close-button" @click="selectedItemForModal = null">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { get } from 'lodash';
import { store } from '../../store';
import ItemDetailPanel from './inventory/ItemDetailPanel.vue';

interface Item {
  ID: string;
  名称: string;
  类型: '日常用品' | '书籍资料' | '个人物品' | '剧情道具' | '赠礼' | '服装饰品';
  描述: string;
  效果?: string;
  可堆叠: boolean;
  数量: number;
}
type CategoryKey = Item['类型'];

const selectedItemForModal = ref<Item | null>(null);
const selectedCategory = ref<CategoryKey | null>(null);

const playerCharacter = computed(() => {
  const char = store.worldState?.主角;
  if (typeof char === 'object' && char !== null && '物品栏' in char) {
    return char;
  }
  return null;
});

const allItems = computed(() => {
  if (!playerCharacter.value) return [];
  const inventory = playerCharacter.value.物品栏 as Record<string, { 数量: number }>;
  const itemDatabase = get(store.worldState, '物品数据库', {}) as Record<string, Omit<Item, 'ID' | '数量'>>;

  return Object.entries(inventory).map(([itemId, itemData]) => {
    const fullItemData = itemDatabase[itemId];
    if (fullItemData) {
      return {
        ...fullItemData,
        ID: itemId,
        数量: itemData.数量
      } as Item;
    }
    return null;
  }).filter((item): item is Item => item !== null);
});

const groupedItems = computed((): Record<CategoryKey, Item[]> => {
 const groups: Record<CategoryKey, Item[]> = {
   '日常用品': [], '书籍资料': [], '个人物品': [], '剧情道具': [], '赠礼': [], '服装饰品': [],
 };

 allItems.value.forEach(item => {
   const category = item.类型 as CategoryKey;
   if (groups[category]) {
     groups[category].push(item);
   }
 });
 
 if (!selectedCategory.value || !Object.keys(groups).includes(selectedCategory.value)) {
   const firstCategoryWithItems = (Object.keys(groups) as CategoryKey[]).find(k => groups[k].length > 0);
   selectedCategory.value = firstCategoryWithItems || '日常用品';
 }

 return groups;
});

const itemsInSelectedCategory = computed(() => {
 if (!selectedCategory.value || !groupedItems.value[selectedCategory.value]) {
   return [];
 }
 return groupedItems.value[selectedCategory.value];
});

const selectItem = (item: Item) => {
  selectedItemForModal.value = item;
};

const selectCategory = (category: CategoryKey) => {
  selectedCategory.value = category;
};

const typeColorMap: Record<string, string> = {
  '日常用品': '#6c757d',
  '书籍资料': '#3a8f9d',
  '个人物品': '#d4af37',
  '剧情道具': '#8a5db5',
  '赠礼': '#dc3545',
  '服装饰品': '#ffc107',
};
const defaultColor = '#a0a0a0';

const getTypeStyle = (item: Item): { [key: string]: string } => {
  const color = typeColorMap[item.类型] || defaultColor;
  return { '--tier-border-color': color };
};
</script>

<style lang="scss" scoped>
.inventory-panel-container {
  padding: 15px;
  height: 100%;
  overflow: hidden;
  background-color: #10141d;
  color: #e0e0e0;
  
  @media (max-width: 600px) {
    padding: 0;
  }
}

.inventory-layout {
  height: 100%;
  width: 100%;
  position: relative;
}

.list-view-container {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 15px;
  height: 100%;
  padding: 15px;

  @media (max-width: 600px) {
    padding: 0;
  }
}

.category-header {
  flex-shrink: 0;
  background-color: rgba(21, 26, 48, 0.4);
  border-radius: 10px;
  padding: 5px;
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    gap: 5px;
  }
  li {
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 8px;
    transition: background-color 0.3s ease;
    color: #a0a0a0;
    font-size: 14px;
    &:hover {
      background-color: rgba(58, 143, 157, 0.1);
    }
    &.active {
      background-color: rgba(58, 143, 157, 0.2);
      color: #3a8f9d;
      font-weight: bold;
    }
  }
}

.main-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
  min-height: 0;
}

.item-grid-container {
  overflow-y: auto;
  padding-right: 5px;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.item-cell {
  aspect-ratio: 1;
  border: 1px solid var(--tier-border-color, #a0a0a0);
  background-color: rgba(21, 26, 48, 0.5);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 8px;
  text-align: center;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  }
  .item-name {
    font-size: 14px;
  }
  .item-quantity {
    font-size: 12px;
    color: #a0a0a0;
    margin-top: 5px;
  }
}

.empty-grid {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #a0a0a0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  background-color: transparent;
  border: none;
  width: 90%;
  max-width: 380px;

  .close-button {
    position: absolute;
    top: 5px;
    right: 5px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 28px;
    font-weight: bold;
    line-height: 1;
    cursor: pointer;
    padding: 5px;
    transition: color 0.3s ease;

    &:hover {
      color: rgba(255, 255, 255, 0.9);
    }
  }
}
</style>
