<template>
  <div class="world-time-display">
    <span class="world-name">{{ worldName }}</span>
    <span class="time-string">{{ timeString }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { timeStr as avatarTimeStr, mainWorldTimeStr } from '../store/getters';

const props = defineProps<{
  worldType: 'main' | 'avatar';
}>();

const { worldType } = toRefs(props);

const worldName = computed(() => {
  return worldType.value === 'main' ? '主世界' : '化身世界';
});

const timeString = computed(() => {
  return worldType.value === 'main' ? mainWorldTimeStr.value : avatarTimeStr.value;
});
</script>

<style lang="scss" scoped>
@use '../styles/theme/variables' as *;

.world-time-display {
  padding: $spacing-xs $spacing-md;
  background: rgba($color-black-void, 0.5);
  border: 1px solid rgba($color-gold-liu, 0.2);
  border-radius: $border-radius-sm;
  color: $color-grey-stone;
  font-size: $font-size-small;
  display: flex;
  gap: $spacing-md;
  align-items: center;

  .world-name {
    font-weight: bold;
    color: $color-gold-pale;
  }

  .time-string {
    font-family: monospace;
  }
}
</style>
