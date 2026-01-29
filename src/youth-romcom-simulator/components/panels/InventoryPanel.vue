<template>
  <div class="panel-wrapper inventory-panel">
    <div v-if="playerCharacter" class="inventory-layout">
      <!-- Top: Category List -->
      <div class="category-header">
        <ul>
          <li
            v-for="category in (Object.keys(groupedItems) as CategoryKey[])"
            :key="category"
            :class="{ active: selectedCategory === category }"
            @click="selectedCategory = category"
          >
            {{ category }} ({{ groupedItems[category].length }})
          </li>
        </ul>
      </div>

      <!-- Bottom: Item Grid and Detail View -->
      <div class="main-content">
        <div class="item-grid-container">
          <div class="item-grid" v-if="itemsInSelectedCategory.length > 0">
            <div
              v-for="item in itemsInSelectedCategory"
              :key="item.ID"
              class="item-cell"
              :class="{ 'selected': selectedItem?.ID === item.ID }"
              :style="getTierStyle(item)"
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
        <ItemDetailPanel :item="selectedItem" />
      </div>
    </div>
    <div v-else class="loading">加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { playerCharacter, playerInventory } from '../../store/getters';
import type { Bond, Consumable, Material, Relic } from '../../types/items';
import ItemDetailPanel from './inventory/ItemDetailPanel.vue';

type Item = Consumable | Relic | Material | Bond;
type CategoryKey = '消耗品' | '奇物' | '材料' | '羁绊';

const selectedItem = ref<Item | null>(null);
const selectedCategory = ref<CategoryKey | null>(null);

const groupedItems = computed((): Record<CategoryKey, Item[]> => {
 const items = playerInventory.value;
 
 const groups: Record<CategoryKey, Item[]> = {
   '消耗品': [],
   '奇物': [],
   '材料': [],
   '羁绊': [],
 };

 if (!items) return groups;

 items.forEach(item => {
   const category = item.类型 as CategoryKey;
   if (groups[category]) {
     groups[category].push(item);
   }
 });
 
 // Set initial category if not set
 if (!selectedCategory.value) {
   const firstCategoryWithItems = (Object.keys(groups) as CategoryKey[]).find(k => groups[k].length > 0);
   if (firstCategoryWithItems) {
     selectedCategory.value = firstCategoryWithItems;
   }
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
 selectedItem.value = item;
};


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
   return { 'color': tierColorMap[tierKey] };
 }
 return {
   '--tier-border-color': tierColorMap[tierKey],
 };
};
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.inventory-panel {
 padding: $spacing-lg;
 height: 100%;
 overflow: hidden;
}

.inventory-layout {
 display: grid;
 grid-template-rows: auto 1fr;
 gap: $spacing-lg;
 height: 100%;
 width: 100%;
}

.category-header {
 flex-shrink: 0;
 background-color: rgba($color-black-void, 0.3);
 border-radius: $border-radius-md;
 padding: $spacing-sm;

 ul {
   list-style: none;
   padding: 0;
   margin: 0;
   display: flex;
   gap: $spacing-sm;
 }

 li {
   padding: $spacing-sm $spacing-md;
   cursor: pointer;
   border-radius: $border-radius-sm;
   transition: background-color 0.3s ease;
   color: $color-grey-stone;

   &:hover {
     background-color: rgba($color-cyan-tian, 0.1);
   }

   &.active {
     background-color: rgba($color-cyan-tian, 0.2);
     color: $color-cyan-tian;
     font-weight: bold;
   }
 }
}

.main-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: $spacing-lg;
  min-width: 0;
  min-height: 0;
}

.item-grid-container {
 overflow-y: auto;
 @include custom-scrollbar;
}

.item-grid {
 display: grid;
 grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
 gap: $spacing-md;
}

.item-cell {
 aspect-ratio: 1;
 border: 1px solid var(--tier-border-color, #{$color-grey-stone});
 background-color: rgba($color-black-void, 0.5);
 border-radius: $border-radius-sm;
 cursor: pointer;
 transition: all 0.3s ease;
 display: flex;
 flex-direction: column;
 justify-content: space-between;
 padding: $spacing-sm;
 
 &:hover {
   transform: translateY(-2px);
   box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
 }

 &.selected {
   transform: translateY(-2px);
   box-shadow: 0 0 15px var(--tier-border-color);
   border-width: 2px;
 }

 .item-name {
   font-size: $font-size-base;
   color: $color-white-moon;
   text-align: center;
 }
 
 .item-quantity {
   font-size: $font-size-small;
   color: $color-grey-stone;
   text-align: right;
 }
}

.empty-grid {
 display: flex;
 justify-content: center;
 align-items: center;
 height: 100%;
 color: $color-grey-stone;
 font-style: italic;
}


</style>
