<template>
  <button class="side-menu-button" @click="handleClick">
    <span class="icon">{{ icon }}</span>
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  icon: string;
}>();

const emit = defineEmits(['open']);

const handleClick = (event: MouseEvent) => {
  emit('open', { x: event.clientX, y: event.clientY });
};
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.side-menu-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  background-color: rgba($color-indigo-deep, 0.85);
  border: 1px solid rgba($color-gold-liu, 0.5);
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  z-index: 10;
  @include flex-center;
  transition: all 0.3s ease;

  &.left {
    left: 0;
  }

  &.right {
    right: 0;
  }

  &:hover {
    background-color: $color-indigo-deep;
    border-color: $color-gold-liu;
    box-shadow: 0 0 12px rgba($color-gold-liu, 0.6);
  }

  .icon {
    font-family: $font-family-title;
    font-size: 1.8rem;
    color: $color-gold-pale;
    text-shadow: 0 0 8px rgba($color-gold-pale, 0.5);
    transition: all 0.3s ease;
  }

  &:hover .icon {
    color: $color-white-moon;
    transform: scale(1.1);
    text-shadow: 0 0 15px $color-gold-pale;
  }
}
</style>