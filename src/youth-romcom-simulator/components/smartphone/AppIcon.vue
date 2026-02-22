<template>
  <div class="app-icon" @click="$emit('click')">
    <div class="icon-visual">
      <i :class="iconClass"></i>
    </div>
    <span class="app-name">{{ name }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'AppIcon',
  props: {
    iconClass: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  emits: ['click'],
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

.app-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  cursor: pointer;
  padding: $spacing-sm;
  border-radius: $border-radius-md;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba($color-white-moon, 0.1);
  }

  .icon-visual {
    width: 60px;
    height: 60px;
    border-radius: 15px;
    background-image: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 28px;
    color: $color-gold-pale;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  }

  .app-name {
    font-size: $font-size-small;
    color: $color-white-moon;
    text-align: center;
  }
}
</style>
