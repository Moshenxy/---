<template>
  <div class="destiny-card-panel-layout">
     <!-- Mobile Detail View -->
     <div v-if="showDetailView" class="card-display-section-mobile">
       <button class="back-to-list-btn" @click="showDetailView = false">< 返回列表</button>
       <DestinyCard v-if="selectedCard" :card="selectedCard" />
     </div>
     
     <!-- List View (Default on mobile, always visible on desktop) -->
     <div v-else class="list-view-container">
       <div class="card-list-section">
         <div class="pool-stats">
           <span v-for="(count, type) in stats" :key="type">
             {{ type }}: {{ count }}
           </span>
         </div>
         <div class="filters">
           <input v-model="searchTerm" placeholder="搜索卡牌..." />
           <select v-model="selectedType">
             <option value="">所有类型</option>
             <option v-for="type in cardTypes" :key="type" :value="type">{{ type }}</option>
           </select>
         </div>
         <ul class="card-list">
           <li
             v-for="card in filteredWarehouse"
             :key="card.ID"
             @click="selectCard(card)"
             :class="{ active: selectedCard?.ID === card.ID }"
           >
             <span class="card-list-name">{{ card.名称 }}</span>
             <span class="card-list-level">[{{ card.等级 }}]</span>
           </li>
         </ul>
       </div>
       <div class="card-display-section-desktop">
         <DestinyCard v-if="selectedCard" :card="selectedCard" />
         <div v-else class="placeholder">请在左侧选择一张卡牌查看详情</div>
       </div>
     </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import DestinyCard from '../../cards/DestinyCard.vue';
import { destinyCardService } from '../../../services/DestinyCardService';
import type { 卡牌 as Card } from '../../../types';

const searchTerm = ref('');
const selectedType = ref('');
const selectedCard = ref<Card | null>(null);
const showDetailView = ref(false);

const selectCard = (card: Card) => {
 selectedCard.value = card;
 showDetailView.value = true;
};

const stats = computed(() => {
  const allStats = destinyCardService.cardPoolStats.value;
  const { '纪念卡': _, ...poolStats } = allStats;
  return poolStats;
});

const warehouse = computed(() => {
  const cardsObject = destinyCardService.allCardsInWarehouse.value;
  return Object.values(cardsObject).filter(card => card.类型 !== '纪念卡') as Card[];
});

const cardTypes = computed(() => {
  if (!Array.isArray(warehouse.value)) return [];
  const types = new Set(warehouse.value.map((card: Card) => card.类型));
  return Array.from(types);
});

const filteredWarehouse = computed(() => {
  if (!Array.isArray(warehouse.value)) return [];
  return warehouse.value.filter((card: Card) => {
    const matchesSearch = card.名称.toLowerCase().includes(searchTerm.value.toLowerCase());
    const matchesType = !selectedType.value || card.类型 === selectedType.value;
    return matchesSearch && matchesType;
  });
});

watch(filteredWarehouse, (newVal) => {
  if (!selectedCard.value || !newVal.find(c => c.ID === selectedCard.value?.ID)) {
    selectedCard.value = newVal[0] || null;
  }
}, { immediate: true });

</script>

<style lang="scss" scoped>
.destiny-card-panel-layout {
  height: 100%;
  width: 100%;
  background-color: #10141d;
  color: #fff;
}

.list-view-container {
    display: grid;
    grid-template-columns: 300px 1fr;
    height: 100%;
    gap: 1em;
    padding: 1em;

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
        padding: 0;
        gap: 0;
    }
}

.card-list-section {
  display: flex;
  flex-direction: column;
  background-color: #1a1f2e;
  border-radius: 8px;
  overflow: hidden;

  @media (max-width: 600px) {
    border-radius: 0;
  }
}

.pool-stats {
  padding: 0.8em;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5em;
  background-color: #2c3e50;
  border-bottom: 1px solid #4a4a5e;
  font-size: 0.9em;
  color: #bdc3c7;

  span {
    white-space: nowrap;
    text-align: left;
  }
}

.filters {
  padding: 0.8em;
  display: flex;
  flex-direction: column;
  gap: 0.8em;
  background-color: #2c3e50;
  border-bottom: 1px solid #4a4a5e;
  
  input, select {
    width: 100%;
    padding: 0.5em;
    background-color: #2c3e50;
    border: 1px solid #7f8c8d;
    color: #ecf0f1;
    border-radius: 4px;
  }
}

.card-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex-grow: 1;

  li {
    padding: 1em;
    cursor: pointer;
    border-bottom: 1px solid #4a4a5e;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #4a4a5e;
    }

    &.active {
      background-color: #f1c40f;
      color: #2c3e50;
      font-weight: bold;
    }
  }
}

.card-display-section-desktop {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: transparent;
  border-radius: 8px;
  padding: 1em;

  .placeholder {
    color: #95a5a6;
    font-style: italic;
    font-size: 1.2em;
  }

  :deep(.destiny-card) {
    transform: scale(1);
    max-width: 400px;
    width: 100%;
  }

  @media (max-width: 600px) {
    display: none;
  }
}

.card-display-section-mobile {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  width: 100%;
  height: 100%;
  position: relative;

  .back-to-list-btn {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0,0,0,0.4);
    color: white;
    border: 1px solid rgba(255,255,255,0.5);
    border-radius: 20px;
    padding: 5px 12px;
    cursor: pointer;
    z-index: 10;
  }

  :deep(.destiny-card) {
    transform: scale(0.9);
    margin-top: 30px;
  }
}
</style>