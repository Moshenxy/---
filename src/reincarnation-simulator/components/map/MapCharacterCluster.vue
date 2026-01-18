<template>
  <div class="character-cluster" :style="clusterStyle" @click="handleClick">
    <span class="cluster-count">{{ characters.length }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';
import type { PropType } from 'vue';
import type { Location } from '../../services/location-parser';

interface CharacterInfo {
  id: string;
  name: string;
  href: string;
}

const props = defineProps({
  location: {
    type: Object as PropType<Location>,
    required: true,
  },
  characters: {
    type: Array as PropType<CharacterInfo[]>,
    required: true,
  },
});

const emit = defineEmits(['click']);

const { location } = toRefs(props);

const clusterStyle = computed(() => {
  if (location.value.gridX === undefined || location.value.gridY === undefined) return {};
  
  const centerX = (location.value.gridX || 0) + (location.value.gridWidth || 1) / 2;
  const centerY = (location.value.gridY || 0) + (location.value.gridHeight || 1) / 2;

  return {
    // Position the cluster in the center of the location area
    // We use grid-column and grid-row directly on the style
    'grid-column': `${Math.floor(centerX) + 1}`,
    'grid-row': `${Math.floor(centerY) + 1}`,
    'transform': `translate(-50%, -50%)`, // Center the icon itself
    'z-index': 15,
  };
});

const handleClick = () => {
  emit('click', props.characters);
};
</script>

<style lang="scss" scoped>
.character-cluster {
  position: relative; // Needed for the transform to work correctly within the grid cell
  width: 32px;
  height: 32px;
  background-color: rgba(239, 68, 68, 0.8);
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translate(-50%, -50%) scale(1.1);
    background-color: rgba(239, 68, 68, 1);
  }
}

.cluster-count {
  color: white;
  font-size: 14px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}
</style>