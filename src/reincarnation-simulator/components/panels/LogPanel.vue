<template>
  <div class="log-panel-container">
    <ul v-if="logs.length > 0" class="timeline">
      <li v-for="log in logs" :key="log.序号" class="timeline-item">
        <div class="timeline-marker"></div>
        <div class="timeline-content" @click="toggleDetails(log.序号)">
          <div class="log-header">
            <span class="log-title">{{ log.标题 }}</span>
            <span class="log-date">{{ log.日期 }}</span>
          </div>
          <div class="log-meta">
            <span><i class="fas fa-map-marker-alt icon"></i> {{ log.地点 }}</span>
            <span><i class="fas fa-users icon"></i> {{ log.人物 }}</span>
          </div>
          <p class="log-description">{{ log.描述 }}</p>

          <div v-if="expandedLog === log.序号" class="log-details">
            <div class="detail-section">
              <strong>重要信息:</strong>
              <p>{{ log.重要信息 }}</p>
            </div>
            <div class="detail-section">
              <strong>人物关系:</strong>
              <p>{{ log.人物关系 }}</p>
            </div>
            <div class="detail-section">
              <strong>暗线与伏笔:</strong>
              <p>{{ log.暗线与伏笔 }}</p>
            </div>
            <div class="detail-section automation-system">
              <strong>自动化系统:</strong>
              <pre>{{ log.自动化系统 }}</pre>
            </div>
            <div v-if="log.标签 && log.标签.length > 0" class="log-tags">
              <span v-for="tag in log.标签" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </li>
    </ul>
    <div v-else class="empty-state">
      <p>尚无历程记录。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { store } from '../../store';

const logs = computed(() => [...store.worldLog].sort((a, b) => b.序号 - a.序号));
const expandedLog = ref<number | null>(null);

function toggleDetails(logId: number) {
  if (expandedLog.value === logId) {
    expandedLog.value = null;
  } else {
    expandedLog.value = logId;
  }
}
</script>

<style lang="scss" scoped>
@use '../../styles/components/LogPanel';
</style>
