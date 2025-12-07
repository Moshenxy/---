<template>
  <div class="side-panel-container" :class="side">
    <WorldTimeDisplay v-if="showTimeDisplay" :world-type="worldType" class="mobile-time-display" />
    <nav class="navigation-menu">
      <slot></slot>
    </nav>
  </div>
</template>

<script setup lang="ts">
import WorldTimeDisplay from './WorldTimeDisplay.vue';

defineProps<{
  side: 'left' | 'right';
  worldType: 'main' | 'avatar';
  showTimeDisplay: boolean;
}>();
</script>

<style lang="scss" scoped>
@use '../styles/components/side-panel-shared.scss';
</style>