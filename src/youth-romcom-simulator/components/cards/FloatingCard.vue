<template>
  <div class="floating-card-container" :class="{ zoomed: isZoomed }">
    <div class="backdrop" v-if="isZoomed" @click.stop="isZoomed = false"></div>
    <div class="floating-card-wrapper">
      <DestinyCard :card="card" class="the-card" @click="toggleZoom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DestinyCard from './DestinyCard.vue';
import type { 卡牌 as Card } from '../../types';

const props = defineProps<{
  card: Card;
}>();

const isZoomed = ref(false);

const toggleZoom = () => {
  isZoomed.value = !isZoomed.value;
};
</script>

<style lang="scss" scoped>
.floating-card-container {
  position: relative;
  z-index: 1000;
}

.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  z-index: 1000;
}

.floating-card-wrapper {
  position: relative;
  z-index: 1001;
  width: calc(380px * 0.5);
  height: calc(380px * (5 / 3) * 0.5);
  transition: all 0.3s ease;
  pointer-events: none; /* Let clicks pass through */

  .the-card {
    pointer-events: auto; /* But allow clicks on the card itself */
    cursor: pointer;
    transform: scale(0.2);
    transform-origin: top right;
    transition: transform 0.3s ease-in-out;
  }

  &:hover .the-card {
    transform: scale(0.22);
  }
}

.zoomed .floating-card-wrapper:hover .the-card {
  transform: scale(1.1); /* Keep it scaled when zoomed and hovered */
}

.zoomed .floating-card-wrapper {
  position: fixed;
  top: 50%;
  left: 50%;
  width: auto;
  height: auto;
  transform: translate(-50%, -50%);

  .the-card {
    transform: scale(1.1); /* Slightly larger for better view */
  }
}
</style>
