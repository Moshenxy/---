<template>
  <div class="map-navigator">
    <span v-for="(crumb, index) in path" :key="crumb.id" class="crumb" @click="onCrumbClick(crumb.id)">
      {{ crumb.name }}
      <span v-if="index < path.length - 1" class="separator"> > </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

interface NavigationCrumb {
  id: string;
  name: string;
}

defineProps({
  path: {
    type: Array as PropType<readonly NavigationCrumb[]>,
    required: true,
  },
});

const emit = defineEmits(['navigate']);

const onCrumbClick = (nodeId: string) => {
  emit('navigate', nodeId);
};
</script>

<style lang="scss" scoped>
.map-navigator {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 5px 10px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  display: flex;
  align-items: center;
  font-size: 14px;

  .crumb {
    cursor: pointer;
    color: #333;
    transition: color 0.3s;

    &:hover {
      color: #007bff;
    }
  }

  .separator {
    margin: 0 8px;
    color: #aaa;
  }
}
</style>