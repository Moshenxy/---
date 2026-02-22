<template>
  <div class="destiny-card-panel">
    <div class="tab-content">
      <CardBackpackTab />
    </div>
  </div>
</template>

<script lang="ts" setup>
import CardBackpackTab from './destiny/CardBackpackTab.vue';
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

.destiny-card-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: $color-black-void;
  color: $color-white-moon;
}

.tab-navigation {
  display: flex;
  flex-shrink: 0;
  border-bottom: 1px solid rgba($color-gold-liu, 0.3);

  button {
    padding: 12px 24px;
    border: none;
    background-color: transparent;
    color: $color-grey-stone;
    cursor: pointer;
    font-size: 16px;
    position: relative;
    transition: color 0.3s ease;

    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background-color: $color-gold-liu;
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }

    &.active {
      color: $color-gold-pale;
      font-weight: bold;

      &::after {
        transform: scaleX(1);
      }
    }

    &:hover:not(.active) {
      color: $color-white-moon;
    }
  }
}

.tab-content {
  flex-grow: 1;
  overflow-y: auto;
  position: relative;
}
</style>
