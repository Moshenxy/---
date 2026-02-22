<template>
  <div class="top-status">
    <div class="status-left">
      <div class="chapter-info">
        <span class="work-title">{{ chapterInfo.workTitle }}</span>
        <span class="chapter-title">{{ chapterInfo.fullChapterTitle }}</span>
      </div>
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
      <button @click="actions.rerollLastAction" class="view-toggle-btn" title="重来">
        <i class="fas fa-undo"></i>
      </button>
    </div>
    <div class="status-right">
      <ActionPointDisplay :当前="actionPoints.当前" :上限="actionPoints.上限" />
      <div class="date-time-info">
        <span class="date-time">{{ worldTimeInfo.date }} {{ worldTimeInfo.timeSegment }}</span>
        <span class="day-weather">{{ worldTimeInfo.dayOfWeek }} | {{ worldTimeInfo.weather }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ActionPointDisplay from './common/ActionPointDisplay.vue';
import { usePanelManager } from '../services/usePanelManager';
import { actions, store } from '../store';
import { getVariable } from '../store/getters';
import { uiActions, uiState } from '../store/ui';

const isBrowserFullscreen = computed(() => uiState.isBrowserFullscreen);
const { openPanel } = usePanelManager();

import { inputModalActions, inputModalState } from '../services/InputModalService';

const chapterInfo = computed(() => {
  const chapter = getVariable('世界状态.章节').value;
  if (!chapter) {
    return {
      workTitle: '未知作品',
      fullChapterTitle: '未知章节',
    };
  }
  return {
    workTitle: chapter.所属作品 || '未知作品',
    fullChapterTitle: `第${chapter.册 ?? '?'}册 第${chapter.章 ?? '?'}章: ${chapter.标题 || '未知标题'}`,
  };
});

const worldTimeInfo = computed(() => {
  const worldState = store.worldState?.世界状态;
  if (!worldState || !worldState.时间 || !worldState.时间.日期) {
    return {
      date: '----年--月--日',
      timeSegment: '未知',
      dayOfWeek: '星期?',
      weather: '未知',
    };
  }
  const date = new Date(worldState.时间.日期);
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  return {
    date: date.toLocaleDateString('zh-CN', dateOptions).replace(/\//g, '-'),
    timeSegment: worldState.时间.当前片段 || '未知',
    dayOfWeek: `星期${worldState.时间.星期}` || '星期?',
    weather: worldState.天气 || '未知',
  };
});

const toggleFullscreen = () => {
  uiActions.toggleBrowserFullscreen();
  uiActions.toggleWebFullscreen(); // 同时切换应用容器的全屏样式
};

const openSaveLoadPanel = () => {
  openPanel('system', 'saveLoad');
};

const openInputModal = () => {
  if (inputModalState.isVisible) {
    inputModalActions.hide();
  } else {
    inputModalActions.show();
  }
};

const fullscreenTitle = computed(() => {
  return isBrowserFullscreen.value ? '退出全屏' : '浏览器全屏';
});

const fullscreenIcon = computed(() => {
  return isBrowserFullscreen.value ? 'fas fa-compress' : 'fas fa-expand';
});

const actionPoints = computed(() => {
  const ap = getVariable('世界状态.行动点').value;
  if (!ap) {
    return { 当前: 0, 上限: 0 };
  }
  return {
    当前: ap.当前 ?? 0,
    上限: ap.上限 ?? 0,
  };
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
  padding: $spacing-sm $spacing-md;
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
  color: $color-grey-stone; // Default secondary text color
}

.chapter-info,
.date-time-info {
  display: flex;
  flex-direction: column;
}

.status-left {
  align-items: flex-start;
  .work-title {
    font-size: $font-size-small;
    color: $color-grey-stone;
  }
  .chapter-title {
    font-size: $font-size-base;
    font-weight: bold;
    color: $color-white-moon;
  }
}

.status-right {
  align-items: flex-end;
  .date-time {
    font-size: $font-size-base;
    font-weight: bold;
    color: $color-white-moon;
  }
  .day-weather {
    font-size: $font-size-small;
    color: $color-grey-stone;
  }
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
