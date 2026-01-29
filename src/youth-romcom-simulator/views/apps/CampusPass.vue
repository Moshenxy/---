<template>
  <div class="campus-pass-app">
    <div class="app-header">
      <h1>校园通</h1>
    </div>
    <div class="app-tabs">
      <button @click="activeTab = 'schedule'" :class="{ active: activeTab === 'schedule' }">课程表</button>
      <button @click="activeTab = 'grades'" :class="{ active: activeTab === 'grades' }">成绩查询</button>
      <button @click="activeTab = 'notifications'" :class="{ active: activeTab === 'notifications' }">校园通知</button>
    </div>
    <div class="app-content">
      <div v-if="activeTab === 'schedule'" class="schedule-actions">
        <button 
          class="btn-sm btn-secondary" 
          @click="handleForceSchedule"
          :disabled="!isScheduleEmpty"
          :title="isScheduleEmpty ? '手动生成新课程表' : '当前已有课程表，无法手动排课'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          <span>手动排课</span>
        </button>
      </div>
      <component :is="activeView" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { get } from 'lodash';
import { store } from '../../store';
import ScheduleView from './campuspass/ScheduleView.vue';
import GradeInquiryView from './campus-pass/GradeInquiryView.vue';
import NotificationsView from './campuspass/NotificationsView.vue';
import { weeklyScheduler } from '../../services/weeklyScheduler';

type Tab = 'schedule' | 'grades' | 'notifications';

const activeTab = ref<Tab>('schedule');

const viewMap = {
  schedule: ScheduleView,
  grades: GradeInquiryView,
  notifications: NotificationsView,
};

const activeView = computed(() => viewMap[activeTab.value]);

const isScheduleEmpty = computed(() => {
  const scheduleData = get(store.worldState, '课程表-主');
  const content = Array.isArray(scheduleData) ? scheduleData[0] : scheduleData;
  if (!content || typeof content !== 'string') {
    return true;
  }
  // 如果内容去除首尾空格和注释后，长度小于10，则视为空
  const cleanContent = content.replace(/#.*$/gm, '').trim();
  return cleanContent.length < 10;
});

function handleForceSchedule() {
  if (!isScheduleEmpty.value) {
    toastr.warning('当前已有课程表，请在周日自动清空后再试。');
    return;
  }
  weeklyScheduler.forceScheduleUpdate();
}
</script>

<style lang="scss" scoped>
.campus-pass-app {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.app-header {
  text-align: center;
  padding: 15px;
  background-color: #0d6efd;
  color: white;
  flex-shrink: 0;
}
.app-tabs {
  display: flex;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;

  button {
    flex-grow: 1;
    padding: 12px 0;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 15px;
    color: #6b7280;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;

    &.active {
      color: #0d6efd;
      font-weight: 600;
      border-bottom-color: #0d6efd;
    }
  }
}
.app-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 15px;
  background-color: #f8f9fa;
  position: relative;
}

.schedule-actions {
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 10;

  .btn-sm {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    font-size: 0.8rem;
    border-radius: 9999px;
    background-color: #e9ecef;
    color: #495057;
    border: 1px solid #dee2e6;
    cursor: pointer;

    &:hover {
      background-color: #dee2e6;
    }

    svg {
      width: 14px;
      height: 14px;
    }
  }
}
</style>