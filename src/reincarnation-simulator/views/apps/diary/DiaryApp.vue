<template>
  <div class="diary-app-container">
    <div class="diary-tabs">
      <button :class="{ active: activeTab === 'diary' }" @click="activeTab = 'diary'">日记</button>
      <button :class="{ active: activeTab === 'daily-summary' }" @click="activeTab = 'daily-summary'">每日总结</button>
      <button :class="{ active: activeTab === 'monthly-summary' }" @click="activeTab = 'monthly-summary'">每月总结</button>
    </div>

    <div class="diary-content">
      <div v-if="activeTab === 'diary'" class="diary-timeline-wrapper">
        <DiaryTimeline :entries="entries" />
      </div>

      <div v-if="activeTab === 'daily-summary'" class="summary-wrapper">
        <SummaryPanel summaryType="small" />
      </div>
      
      <div v-if="activeTab === 'monthly-summary'" class="summary-wrapper">
        <SummaryPanel summaryType="large" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import DiaryTimeline from './DiaryTimeline.vue';
import SummaryPanel from './SummaryPanel.vue';
import { actions, getters, store } from '../../../store';
import './diary.scss';

const activeTab = ref('diary');

const entries = computed(() => getters.diaryTimelineEntries.value);

onMounted(() => {
  actions.fetchDiaryEntries();
  actions.loadDiarySummaries();
});
</script>