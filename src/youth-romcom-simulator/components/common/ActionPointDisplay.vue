<template>
  <div class="action-points-display">
    <span
      v-for="dot in dots"
      :key="dot.id"
      class="ap-dot"
      :class="{ 'used': !dot.active }"
    ></span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  当前: {
    type: Number,
    required: true,
  },
  上限: {
    type: Number,
    required: true,
  },
});

const dots = computed(() => {
  return Array.from({ length: props.上限 }, (_, i) => ({
    id: i,
    active: i < props.当前,
  }));
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

.action-points-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
}

.ap-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: $color-white-moon;
  border: 1px solid rgba($color-gold-liu, 0.5);
  transition: background-color 0.3s ease;

  &.used {
    background-color: rgba($color-grey-stone, 0.5);
    border-color: rgba($color-grey-stone, 0.3);
  }
}
</style>