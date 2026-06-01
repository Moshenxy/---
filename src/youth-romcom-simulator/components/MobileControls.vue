<template>
  <div class="mobile-controls">
    <button ref="leftBtn" class="floating-btn left-toggle" @click="toggleLeftPanel">
      <i class="fas fa-user-circle"></i>
    </button>
    <button ref="rightBtn" class="floating-btn right-toggle" @click="toggleRightPanel">
      <i class="fas fa-scroll"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { uiActions } from '../store/ui';
import { makeDraggable } from '../utils/draggable';

const leftBtn = ref<HTMLElement | null>(null);
const rightBtn = ref<HTMLElement | null>(null);

onMounted(() => {
  if (leftBtn.value) {
    makeDraggable(leftBtn.value);
  }
  if (rightBtn.value) {
    makeDraggable(rightBtn.value);
  }
});

const toggleLeftPanel = () => {
  uiActions.toggleLeftPanel();
};

const toggleRightPanel = () => {
  uiActions.toggleRightPanel();
};
</script>

<style lang="scss" scoped>
@use '../styles/theme/variables' as *;
@use '../styles/theme/mixins' as *;

.mobile-controls {
  // This container is now just a placeholder and doesn't need styles.
}

.floating-btn {
  position: fixed;
  z-index: 900; // Above panels (800), below modals (1000)
  @include frosted-glass(rgba($color-indigo-deep, 0.8), 50%);
  border: 1px solid rgba($color-gold-liu, 0.4);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: $color-gold-pale;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    // transform is handled by draggable util, so we only change other properties
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
    color: $color-white-moon;
    background-color: rgba($color-indigo-deep, 0.9);
  }

  &.left-toggle {
    bottom: $spacing-lg;
    left: $spacing-lg;
  }

  &.right-toggle {
    bottom: $spacing-lg;
    right: $spacing-lg;
  }
}
</style>