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
        <ul class="card-list">
          <li
            v-for="card in backpackCards"
            :key="card.ID"
            @click="selectCard(card)"
            :class="{ active: selectedCard?.ID === card.ID }"
          >
            <span class="card-list-name">{{ card.名称 }}</span>
            <span class="card-list-level">[{{ card.等级 }}]</span>
          </li>
          <li v-if="backpackCards.length === 0" class="empty-list">背包是空的</li>
        </ul>
      </div>
      <div class="card-display-section-desktop">
        <DestinyCard v-if="selectedCard" :card="selectedCard" />
        <div v-else class="placeholder">从左侧选择一张卡牌查看</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import DestinyCard from '../../cards/DestinyCard.vue';
import { destinyCardService } from '../../../services/DestinyCardService';
import type { 卡牌 as Card } from '../../../types';

const selectedCard = ref<Card | null>(null);
const showDetailView = ref(false);
const backpackCards = destinyCardService.playerBackpackCards;

const selectCard = (card: Card) => {
  selectedCard.value = card;
  showDetailView.value = true;
};

watch(
  backpackCards,
  newVal => {
    if (!selectedCard.value || !newVal.find(c => c.ID === selectedCard.value?.ID)) {
      selectedCard.value = newVal[0] || null;
    }
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
/* 使用与卡池相同的布局，但移除了筛选和统计部分 */
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

.card-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex-grow: 1;

  .empty-list {
    padding: 1em;
    text-align: center;
    color: #7f8c8d;
    font-style: italic;
  }

  li {
    padding: 1em;
    cursor: pointer;
    border-bottom: 1px solid #4a4a5e;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s ease;

    &:not(.empty-list):hover {
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
    background: rgba(0, 0, 0, 0.4);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.5);
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
