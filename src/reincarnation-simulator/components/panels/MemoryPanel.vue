o<template>
  <div class="panel-wrapper memory-panel-container">
    <div class="panel-content">
      <h3 class="panel-title">世界记忆系统</h3>

      <!-- Automation Control -->
      <div class="section">
        <div class="setting-item">
          <label for="auto-memory-switch">启用自动记忆系统</label>
          <input type="checkbox" id="auto-memory-switch" v-model="isAutoMemoryEnabled" />
        </div>
        <p class="description">启用后，系统将在每次AI交互后自动更新所有记忆层级。</p>
      </div>

      <!-- Configuration -->
      <div class="section">
        <h4>参数配置</h4>
        <div class="setting-item">
          <label for="instant-memory-count">瞬时记忆数量</label>
          <input type="number" id="instant-memory-count" v-model.number="config.instantMemoryCount" />
        </div>
        <div class="setting-item">
          <label for="short-term-count">短期记忆数量</label>
          <input type="number" id="short-term-count" v-model.number="config.shortTermMemoryCount" />
        </div>
        <div class="setting-item">
          <label for="long-term-count">长期记忆数量</label>
          <input type="number" id="long-term-count" v-model.number="config.longTermMemoryCount" />
        </div>
        <button @click="updateConfig">应用配置</button>
        <button @click="forceUpdate">立即更新所有记忆</button>
      </div>

      <!-- Memory Review -->
      <div class="section">
        <h4>记忆审查</h4>
        <div class="tabs">
          <button :class="{ active: activeTab === 'instant' }" @click="activeTab = 'instant'">瞬时记忆</button>
          <button :class="{ active: activeTab === 'short' }" @click="activeTab = 'short'">短期记忆</button>
          <button :class="{ active: activeTab === 'long' }" @click="activeTab = 'long'">长期记忆</button>
        </div>
        <div class="memory-content">
          <textarea readonly :value="activeMemoryContent"></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as toastr from 'toastr';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { eventBus } from '../../services/EventBus';
import { lorebookService } from '../../services/LorebookService';
import { memoryService } from '../../services/MemoryService';
import { store } from '../../store';

const isAutoMemoryEnabled = ref(true); // Default to enabled
const config = ref({
  instantMemoryCount: 3,
  shortTermMemoryCount: 25,
  longTermMemoryCount: 200,
});

const activeTab = ref('instant');
const memoryContent = ref({
  instant: '加载中...',
  short: '加载中...',
  long: '加载中...',
});

const activeMemoryContent = computed(() => {
  return memoryContent.value[activeTab.value as keyof typeof memoryContent.value];
});

async function fetchMemoryContent(forceRefresh = false) {
  try {
    const [instant, short, long] = await Promise.all([
      lorebookService.readFromLorebook('[系统]瞬时记忆', forceRefresh),
      lorebookService.readFromLorebook('[系统]短期记忆', forceRefresh),
      lorebookService.readFromLorebook('[系统]长期记忆', forceRefresh),
    ]);
    memoryContent.value.instant = instant || '暂无内容';
    memoryContent.value.short = short || '暂无内容';
    memoryContent.value.long = long || '暂无内容';
  } catch (error) {
    console.error('[MemoryPanel] Failed to fetch memory content:', error);
    toastr.error('无法加载记忆内容');
  }
}

function updateConfig() {
  memoryService.setConfig(config.value);
  toastr.success('记忆系统配置已应用');
}

async function forceUpdate() {
  toastr.info('正在手动更新所有记忆层级...');
  console.log('[MemoryPanel] Forcing update with worldLog:', JSON.stringify(store.worldLog, null, 2));
  await memoryService.updateMemory(store.worldLog);
  await fetchMemoryContent(true); // Force refresh after manual update
  toastr.success('记忆层级更新完毕');
}

onMounted(() => {
  config.value = memoryService.getConfig();
  fetchMemoryContent();

  // 订阅记忆更新事件
  const handleMemoryUpdate = () => {
    console.log('[MemoryPanel] Received memory-updated event. Refreshing content...');
    fetchMemoryContent(true);
  };
  eventBus.on('memory-updated', handleMemoryUpdate);

  onUnmounted(() => {
    eventBus.off('memory-updated', handleMemoryUpdate);
  });
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.memory-panel-container {
  padding: 0;
  background-color: transparent;
  color: $color-white-moon;
  overflow-y: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  height: 100%;
}

.panel-title {
  font-family: $font-family-title;
  color: $color-gold-pale;
  text-align: center;
  margin-bottom: $spacing-lg;
  flex-shrink: 0;
}

.section {
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-lg;
  border-bottom: 1px solid rgba($color-gold-liu, 0.2);

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  h4 {
    color: $color-gold-liu;
    margin-bottom: $spacing-md;
  }

  .description {
    font-size: $font-size-small;
    color: $color-grey-stone;
    line-height: 1.6;
    margin-top: $spacing-sm;
  }
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;

  label {
    color: $color-grey-stone;
  }

  input[type='number'] {
    width: 80px;
    text-align: right;
  }
}

button {
  margin-right: $spacing-md;
}

.tabs {
  display: flex;
  margin-bottom: $spacing-md;
  border-bottom: 1px solid rgba($color-gold-liu, 0.3);
  flex-shrink: 0;

  button {
    background: none;
    border: none;
    color: $color-grey-stone;
    padding: $spacing-sm $spacing-md;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 2px solid transparent;

    &.active {
      color: $color-gold-pale;
      border-bottom-color: $color-gold-pale;
    }
  }
}

.memory-content {
  flex-grow: 1;
  
  textarea {
    width: 100%;
    height: 100%;
    min-height: 200px;
    resize: none;
    background-color: rgba($color-black-void, 0.5);
    color: $color-white-moon;
    border: 1px solid rgba($color-gold-liu, 0.2);
    border-radius: $border-radius-sm;
  }
}
</style>
