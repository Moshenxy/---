<template>
  <div class="destiny-card" :class="cardRarityClass" :style="cardStyle">
    <div class="card-border-glow"></div>
    <div class="card-header">
      <span class="card-type">{{ card.类型 }}</span>
      <span class="card-level">[{{ card.等级 }}]</span>
    </div>
    <div class="card-content">
      <h3 class="card-name">{{ card.名称 }}</h3>
      <div class="card-face">
        <div v-if="isImageUrl" class="card-image" :style="{ backgroundImage: `url(${card.卡面})` }"></div>
        <div v-else class="card-text-face">{{ card.卡面 }}</div>
      </div>
      <div class="card-info">
        <p class="card-description">{{ card.介绍 }}</p>
      </div>
      <p class="card-effect"><strong>效果:</strong> {{ card.效果 }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { 卡牌 as Card } from '../../types';

const props = defineProps<{
  card: Card;
}>();

const typeColorMap: Record<Card['类型'], string> = {
  任务卡: '#4a90e2',
  角色卡: '#50e3c2',
  物品卡: '#b8e986',
  事件卡: '#f5a623',
  命运卡: '#9013fe',
  属性卡: '#f8e71c',
  技能卡: '#e58c00',
  灾难卡: '#d0021b',
  纪念卡: '#bd10e0',
};

const isImageUrl = computed(() => {
  try {
    new URL(props.card.卡面);
    return true;
  } catch {
    return false;
  }
});

const cardColor = computed(() => typeColorMap[props.card.类型] || '#7f8c8d');

const levelColorMap: Record<Card['等级'], string> = {
  F: '#6c757d',
  E: '#6c757d',
  D: '#33aaff',
  C: '#33aaff',
  B: '#9013fe',
  A: '#d633ff',
  S: '#ffd700',
  SS: '#ff8c00',
  SSS: '#ff4500',
};

const cardRarityClass = computed(() => {
  const level = props.card.等级;
  if (['S', 'SS', 'SSS'].includes(level)) return 'rarity-legendary';
  if (['A', 'B'].includes(level)) return 'rarity-epic';
  if (['C', 'D'].includes(level)) return 'rarity-rare';
  return 'rarity-common';
});

const cardStyle = computed(() => ({
  '--card-type-color': cardColor.value,
  '--card-level-color': levelColorMap[props.card.等级] || '#6c757d',
}));
</script>

<style lang="scss" scoped>
@keyframes legendary-glow {
  0% {
    box-shadow:
      0 0 8px var(--card-level-color),
      0 0 16px var(--card-level-color),
      0 0 24px var(--card-level-color);
  }
  50% {
    box-shadow:
      0 0 16px var(--card-level-color),
      0 0 32px var(--card-level-color),
      0 0 48px var(--card-level-color);
  }
  100% {
    box-shadow:
      0 0 8px var(--card-level-color),
      0 0 16px var(--card-level-color),
      0 0 24px var(--card-level-color);
  }
}

@keyframes epic-glow {
  0% {
    box-shadow:
      0 0 4px var(--card-level-color),
      0 0 8px var(--card-level-color);
  }
  50% {
    box-shadow:
      0 0 8px var(--card-level-color),
      0 0 16px var(--card-level-color);
  }
  100% {
    box-shadow:
      0 0 4px var(--card-level-color),
      0 0 8px var(--card-level-color);
  }
}

.destiny-card {
  border: 2px solid var(--card-type-color);
  border-radius: 15px;
  background: linear-gradient(145deg, #2d2d3a, #1b1b26);
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 380px; /* Set a max-width for larger screens */
  aspect-ratio: 3 / 5;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;

  &.rarity-legendary {
    animation: legendary-glow 2.5s infinite ease-in-out;
  }
  &.rarity-epic {
    animation: epic-glow 3.5s infinite ease-in-out;
  }
  &.rarity-rare {
    box-shadow: 0 0 8px var(--card-level-color);
  }
}

.card-header {
  padding: 0.5em 1em;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9em;
  color: #ccc;
  background-color: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid var(--card-type-color);
}
.card-type {
  font-weight: bold;
  color: var(--card-type-color);
}

.card-level {
  font-weight: bold;
  color: var(--card-level-color);
}

.card-content {
  padding: 1em;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.card-face {
  flex-grow: 1;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1em;
  border-radius: 8px;
  background-color: rgba(10, 15, 30, 0.4);
  min-height: 100px;
}

.card-image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}

.card-text-face {
  font-size: 1.1em;
  color: #eee;
  padding: 0.5em;
}

.card-info {
  text-align: center;
  flex-shrink: 0;
  margin-top: auto;
  padding-top: 1em;
}

.card-name {
  font-size: 1.4em;
  color: var(--card-type-color);
  font-weight: bold;
  padding-bottom: 0.5em;
  margin-bottom: 0.5em;
  border-bottom: 1px solid var(--card-type-color, #444);
}

.card-description,
.card-effect {
  font-size: 0.85em;
  color: #ccc;
  line-height: 1.4;
  margin: 0;
}

.card-effect {
  margin-top: 0.8em;
  padding-top: 0.8em;
  border-top: 1px solid #444;
  color: #a0e8ff;
}
</style>
