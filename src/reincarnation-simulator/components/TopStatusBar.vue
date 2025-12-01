<template>
  <div class="top-status">
    <div class="status-left">
      <WorldTimeDisplay world-type="main" />
    </div>
    <div class="status-center">
      <button @click="openSaveLoadPanel" class="view-toggle-btn" title="系统管理">
        <i class="fas fa-cog"></i>
      </button>
      <button @click="openInputModal" class="view-toggle-btn" title="输入指令">
        <i class="fas fa-keyboard"></i>
      </button>
      <button @click="toggleFullscreen" class="view-toggle-btn" :title="fullscreenTitle">
        <i :class="fullscreenIcon"></i>
      </button>
    </div>
    <div class="status-right">
      <WorldTimeDisplay world-type="avatar" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { uiState, uiActions } from '../store/ui';
import { usePanelManager } from '../services/usePanelManager';
import WorldTimeDisplay from './WorldTimeDisplay.vue';

const isBrowserFullscreen = computed(() => uiState.isBrowserFullscreen);
const { openPanel } = usePanelManager();

import { inputModalActions } from '../services/InputModalService';

const toggleFullscreen = () => {
  uiActions.toggleBrowserFullscreen();
  uiActions.toggleWebFullscreen(); // 同时切换应用容器的全屏样式
};

const openSaveLoadPanel = () => {
  openPanel('system', 'saveLoad');
};

const openInputModal = () => {
  inputModalActions.show();
};

const fullscreenTitle = computed(() => {
  return isBrowserFullscreen.value ? '退出全屏' : '浏览器全屏';
});

const fullscreenIcon = computed(() => {
  return isBrowserFullscreen.value ? 'fas fa-compress' : 'fas fa-expand';
});
</script>

<style lang="scss" scoped>
@use '../styles/theme/variables' as *;
@use '../styles/theme/mixins' as *;

.top-status {
  @include frosted-glass(rgba($color-charcoal-glass, 0.5), 8px);
  border-bottom: 1px solid rgba($color-gold-liu, 0.2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $spacing-md;
  position: relative;
  z-index: 100;

  // Add a subtle inner glow to give it a "control panel" feel
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    border-radius: inherit;
    box-shadow: inset 0 1px 1px rgba(lighten($color-gold-liu, 20%), 0.1);
  }
}

// Placeholder for future content
// We will add info items here later

.status-left,
.status-right {
  flex: 1;
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.status-left {
  justify-content: flex-start;
}

.status-right {
  justify-content: flex-end;
}

.status-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: $spacing-xl;
}

.view-toggle-btn {
  background: none;
  border: 1px solid transparent;
  color: $color-grey-stone;
  font-size: 18px;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    color: $color-white-moon;
    background-color: rgba($color-gold-liu, 0.1);
    border-color: rgba($color-gold-liu, 0.3);
  }
}
</style>
