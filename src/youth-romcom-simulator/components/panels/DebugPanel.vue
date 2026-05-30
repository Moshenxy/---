<template>
  <div class="debug-panel">
    <h2>调试信息面板</h2>
    <div class="section danger-zone">
      <button @click="clearAllMemoryLogs" class="button is-warning">清除所有记忆记录</button>
    </div>
    <button @click="debugService.refreshData()">刷新数据</button>

    <div class="section">
      <h3>世界书读取状态</h3>
      <p>
        <strong>主线剧情:</strong>
        <span :class="statusClass(debugState.mainStoryStatus)">{{ debugState.mainStoryStatus }}</span>
      </p>
      <div class="story-stats">
        <p>
          文件: {{ debugState.mainStoryStats.filesLoaded }} | 总事件: {{ debugState.mainStoryStats.totalEvents }} |
          待触发: {{ debugState.mainStoryStats.actionableEvents }} | 预告:
          {{ debugState.mainStoryStats.foreshadowedEvents }}
        </p>
      </div>
      <p>
        <strong>日历-固定事件:</strong>
        <span :class="statusClass(debugState.calendarFixedStatus)">{{ debugState.calendarFixedStatus }}</span>
      </p>
      <p>
        <strong>日历-随机事件:</strong>
        <span :class="statusClass(debugState.calendarRandomStatus)">{{ debugState.calendarRandomStatus }}</span>
      </p>
      <p>
        <strong>日历-跨界事件:</strong>
        <span :class="statusClass(debugState.calendarCrossoverStatus)">{{ debugState.calendarCrossoverStatus }}</span>
      </p>
      <p>
        <strong>服装风格指南:</strong>
        <span :class="statusClass(debugState.styleGuideStatus)">{{ debugState.styleGuideStatus }}</span>
      </p>
    </div>

    <div class="section">
      <h3>上一轮发送的精简上下文</h3>
      <pre>{{ formattedLastContext }}</pre>
    </div>

    <div class="section">
      <h3>注入的潜在主线 ({{ potentialStoryCount }})</h3>
      <pre>{{ formattedPotentialStory }}</pre>
    </div>

    <div class="section">
      <h3>注入的近期事件 ({{ upcomingEventsCount }})</h3>
      <pre>{{ formattedUpcomingEvents }}</pre>
    </div>

    <div class="section">
      <h3>短期记忆 ({{ recentEventsCount }})</h3>
      <pre>{{ formattedRecentEvents }}</pre>
    </div>

    <div class="section">
      <h3>主线剧情数据</h3>
      <pre>{{ formattedMainStory }}</pre>
    </div>

    <div class="section">
      <h3>日历-固定事件</h3>
      <pre>{{ formattedCalendarFixed }}</pre>
    </div>
    <div class="section">
      <h3>日历-随机事件</h3>
      <pre>{{ formattedCalendarRandom }}</pre>
    </div>
    <div class="section">
      <h3>日历-跨界事件</h3>
      <pre>{{ formattedCalendarCrossover }}</pre>
    </div>

    <div class="section">
      <h3>服装风格指南数据</h3>
      <pre>{{ formattedStyleGuide }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { get } from 'lodash';
import * as toastr from 'toastr';
import { computed, onMounted } from 'vue';
import { debugService } from '../../services/DebugService';
import { lorebookService } from '../../services/LorebookService';

const debugState = debugService.state;

onMounted(() => {
  debugService.refreshData();
});

const formattedJson = (data: any) => {
  if (data === null) return 'N/A';
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return '无法格式化数据';
  }
};

const formattedLastContext = computed(() => formattedJson(debugState.lastContext));
const formattedMainStory = computed(() => formattedJson(debugState.mainStoryContent));
const formattedCalendarFixed = computed(() => formattedJson(debugState.calendarFixedContent));
const formattedCalendarRandom = computed(() => formattedJson(debugState.calendarRandomContent));
const formattedCalendarCrossover = computed(() => formattedJson(debugState.calendarCrossoverContent));
const formattedStyleGuide = computed(() => formattedJson(debugState.styleGuideContent));

const potentialStory = computed(() => get(debugState.lastContext, '导演指令.待触发主线', {}));
const upcomingEvents = computed(() => get(debugState.lastContext, '导演指令.日历事件.事件列表', []));
const recentEvents = computed(() => get(debugState.lastContext, '短期记忆.事件列表', []));

const potentialStoryCount = computed(() => (potentialStory.value && Object.keys(potentialStory.value).length > 0 ? 1 : 0));
const upcomingEventsCount = computed(() => upcomingEvents.value.length);
const recentEventsCount = computed(() => recentEvents.value.length);

const formattedPotentialStory = computed(() => formattedJson(potentialStory.value));
const formattedUpcomingEvents = computed(() => formattedJson(upcomingEvents.value));
const formattedRecentEvents = computed(() => formattedJson(recentEvents.value));

const statusClass = (status: string) => {
  if (status.includes('成功')) return 'status-success';
  if (status.includes('失败')) return 'status-error';
  return '';
};
const clearAllMemoryLogs = async () => {
  if (confirm('确定要清除所有分段记忆、日记和周刊吗？这将清空相关的世界书条目。')) {
    try {
      await lorebookService.writeToLorebook('[系统]瞬时记忆', '');
      await lorebookService.writeToLorebook('[系统]短期记忆', '');
      await lorebookService.writeToLorebook('[系统]长期记忆', '');
      await lorebookService.writeToLorebook('日记', '');
      await lorebookService.writeToLorebook('周刊', '');
      await lorebookService.writeToLorebook('日记-禁开', '');
      await lorebookService.writeToLorebook('日记片段-禁开', '');
      await lorebookService.writeToLorebook('日记片段', '');
      await lorebookService.writeToLorebook('导演场记', '');
      toastr.success('所有记忆与日志记录已成功清除！');
    } catch (error) {
      console.error('清除记忆记录时出错:', error);
      toastr.error('清除记忆记录失败。');
    }
  }
};
</script>

<style scoped lang="scss">
.debug-panel {
  padding: 16px;
  background-color: #1a1a2e;
  color: #e0e0e0;
  height: 100%;
  overflow: auto;
  font-family: 'Courier New', Courier, monospace;
}

h2,
h3 {
  color: #fca311;
  border-bottom: 1px solid #4a4a5e;
  padding-bottom: 8px;
}

.section {
  margin-top: 16px;
  background-color: #2a2a3e;
  border: 1px solid #4a4a5e;
  border-radius: 4px;
  padding: 12px;
}

pre {
  white-space: pre-wrap;
  word-break: break-all;
  background-color: #0f0f1e;
  padding: 8px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

button {
  background-color: #fca311;
  color: #1a1a2e;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  font-weight: bold;
  margin-bottom: 16px;
  &:hover {
    background-color: #e0930a;
  }
}

.status-success {
  color: #2ecc71;
  font-weight: bold;
}

.story-stats {
  font-size: 0.8em;
  color: #999;
  margin-left: 1em;
  margin-top: -8px;
  margin-bottom: 8px;
}

.status-error {
  color: #e74c3c;
  font-weight: bold;
}
</style>
