<template>
  <div class="detail-tab-content grid-layout">
    <div class="detail-item full-width">
      <strong class="detail-key">持有物品</strong>
      <InventoryGrid :items="inventoryItems" />
    </div>
    <div class="detail-item full-width">
      <strong class="detail-key">人际关系</strong>
      <RelationsDisplay v-if="npcId" :subject-id="npcId" />
    </div>
    <div class="detail-item full-width">
      <strong class="detail-key">短期记忆</strong>
      <div v-if="Object.keys(npc.心流?.短期记忆 || {}).length > 0" class="memory-list">
        <div v-for="(memory, key) in npc.心流.短期记忆" :key="key" class="memory-item">
          <p class="memory-event"><strong>事件:</strong> {{ memory.事件 }}</p>
          <p class="memory-influence"><strong>影响:</strong> {{ memory.影响 }}</p>
        </div>
      </div>
      <div v-else class="placeholder">无</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { get } from 'lodash';
import { Character } from '../../../types';
import { store } from '../../../store';
import RelationsDisplay from '../RelationsDisplay.vue';
import InventoryGrid from '../InventoryGrid.vue';

const props = defineProps<{
  npc: Character;
  npcId: string | null;
}>();

const inventoryItems = computed(() => {
  const database = store.worldState?.数据库;
  if (!props.npc || !database) return [];

  const backpack = get(props.npc, '背包', {});
  const items = [];

  for (const itemId in backpack) {
    const quantity = (backpack as any)[itemId];
    if (quantity <= 0) continue;

    let itemDetails = null;
    for (const category in database) {
      const categoryStore = (database as any)[category];
      if (categoryStore && categoryStore[itemId]) {
        itemDetails = categoryStore[itemId];
        break;
      }
    }

    if (itemDetails) {
      items.push({
        ...itemDetails,
        ID: itemId,
        数量: quantity,
      });
    }
  }
  return items;
});
</script>

<style lang="scss" scoped>
@use '../../../styles/theme/variables' as *;

.grid-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-lg;
}

.detail-item {
  &.full-width {
    grid-column: 1 / -1;
  }
  .detail-key {
    color: $color-gold-pale;
    font-family: $font-family-title;
    font-size: $font-size-large;
    display: block;
    margin-bottom: $spacing-md;
  }
}
</style>

<style lang="scss" scoped>
@use '../../../styles/theme/variables' as *;

/* Existing styles */
.memory-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.memory-item {
  background-color: rgba($color-black-void, 0.4);
  padding: $spacing-sm;
  border-radius: $border-radius-sm;
  border-left: 3px solid $color-purple-mystery;
}

.memory-event,
.memory-influence {
  margin: 0;
  padding: 2px 0;
  color: $color-grey-stone;
  line-height: 1.6;

  strong {
    color: $color-purple-mystery;
    font-weight: bold;
  }
}

.placeholder {
  color: $color-grey-stone;
  font-style: italic;
}
</style>
