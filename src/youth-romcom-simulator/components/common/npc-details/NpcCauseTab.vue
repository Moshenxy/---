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
      <strong class="detail-key">因果足迹</strong>
      <div v-if="Object.keys(groupedMemories).length > 0" class="memory-timeline">
        <div v-for="(memories, year) in groupedMemories" :key="year" class="year-group">
          <h5 @click="toggleYear(year)" :class="{ collapsed: !yearExpansion[year] }">{{ year }}年</h5>
          <div v-if="yearExpansion[year]" class="memory-list">
            <div v-for="(memory, index) in memories" :key="index" class="memory-item">
              <div class="memory-header">
                <span class="memory-date">{{ new Date(memory.时间).toLocaleDateString() }}</span>
              </div>
              <p class="memory-event">
                <span :class="['tag', getEmotionClass(memory.情感标签)]">{{ memory.情感标签 }}</span>
                {{ memory.事件摘要 }}
              </p>
              <p class="memory-influence"><strong>影响:</strong> {{ memory.影响 }}</p>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="placeholder">无</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { get } from 'lodash';
import { 角色 as Character } from '../../../types';
import { store } from '../../../store';
import RelationsDisplay from '../RelationsDisplay.vue';
import InventoryGrid from '../InventoryGrid.vue';

const props = defineProps<{
  npc: Character,
  npcId: string | null
}>();

const yearExpansion = reactive<Record<string, boolean>>({});

const toggleYear = (year: string | number) => {
  yearExpansion[year] = !yearExpansion[year];
};

const inventoryItems = computed(() => {
  // TODO: 修正物品数据库的路径
  const database = (store.worldState as any)?.数据库 || {}; 
  if (!props.npc || !props.npc.物品栏) return [];

  const backpack = props.npc.物品栏;
  const items = [];

  for (const itemId in backpack) {
    const quantity = (backpack as any)[itemId]?.数量 || 0;
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

const groupedMemories = computed(() => {
  if (!props.npc.记忆) return {};
  const sorted = [...props.npc.记忆].sort((a, b) => new Date(b.时间).getTime() - new Date(a.时间).getTime());
  
  return sorted.reduce((acc, memory) => {
    const year = new Date(memory.时间).getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(memory);
    return acc;
  }, {} as Record<string, typeof props.npc.记忆>);
});

// Initially expand the most recent year
Object.keys(groupedMemories.value).forEach((year, index) => {
  yearExpansion[year] = index === 0;
});

function getEmotionClass(emotion: string): string {
  switch (emotion) {
    case '愤怒': return 'emotion-tag-anger';
    case '悲伤': return 'emotion-tag-sadness';
    case '恐惧': return 'emotion-tag-fear';
    case '屈辱': return 'emotion-tag-humiliation';
    case '满足': return 'emotion-tag-satisfaction';
    case '喜悦': return 'emotion-tag-joy';
    default: return '';
  }
}
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

.memory-timeline {
  position: relative;
  padding-left: $spacing-lg;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 10px;
    bottom: 0;
    width: 2px;
    background-color: rgba($color-gold-liu, 0.15);
  }
}

.year-group h5 {
  cursor: pointer;
  font-family: $font-family-title;
  color: $color-gold-pale;
  margin: $spacing-lg 0 $spacing-md;
  user-select: none;
  position: relative;

  &::before {
    content: '▼';
    display: inline-block;
    margin-right: $spacing-sm;
    transition: transform 0.2s ease;
  }

  &.collapsed::before {
    transform: rotate(-90deg);
  }
}

.memory-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  padding-left: $spacing-lg;
}

.memory-item {
  position: relative;
  background-color: rgba($color-black-void, 0.4);
  padding: $spacing-md;
  border-radius: $border-radius-sm;

  &::before {
    content: '';
    position: absolute;
    top: 18px;
    left: -22px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: $color-purple-mystery;
    border: 2px solid $color-black-void;
  }
}

.memory-event .tag {
  margin-right: $spacing-sm;
  font-size: $font-size-small;
  padding: 2px 6px;
}

.emotion-tag-anger { background-color: rgba(211, 47, 47, 0.2); color: #f44336; }
.emotion-tag-sadness { background-color: rgba(33, 150, 243, 0.2); color: #2196F3; }
.emotion-tag-fear { background-color: rgba(156, 39, 176, 0.2); color: #9C27B0; }
.emotion-tag-humiliation { background-color: rgba(130, 119, 23, 0.2); color: #afad70; }
.emotion-tag-satisfaction { background-color: rgba(76, 175, 80, 0.2); color: #4CAF50; }
.emotion-tag-joy { background-color: rgba(255, 193, 7, 0.2); color: #FFC107; }

.memory-event, .memory-influence {
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