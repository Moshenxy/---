<template>
  <div class="wm-root" :data-mode="uiState.mode" :class="{ 'is-phone': isPhone }">
    <!-- 悬浮面板 -->
    <div v-show="uiState.mode === 'panel'" class="wm-panel" :style="panelStyle">
      <div class="wm-drag-handle" @pointerdown.prevent.stop="onDragStart">⋮⋮</div>
      <div class="wm-header">
        <span>世界记忆插件 V2</span>
        <button class="wm-btn" title="收起" @click="setMode('orb')">&ndash;</button>
      </div>
      <div class="wm-tabs">
        <button class="wm-tab-btn" :class="{ 'is-active': uiState.activeTab === 'main' }" @click="setActiveTab('main')">
          主界面
        </button>
        <button
          class="wm-tab-btn"
          :class="{ 'is-active': uiState.activeTab === 'atlas' }"
          @click="setActiveTab('atlas')"
        >
          人格图谱
        </button>
        <button class="wm-tab-btn" :class="{ 'is-active': uiState.activeTab === 'api' }" @click="setActiveTab('api')">
          API配置
        </button>
        <button
          class="wm-tab-btn"
          :class="{ 'is-active': uiState.activeTab === 'params' }"
          @click="setActiveTab('params')"
        >
          参数配置
        </button>
        <button
          class="wm-tab-btn"
          :class="{ 'is-active': uiState.activeTab === 'manage' }"
          @click="setActiveTab('manage')"
        >
          管理
        </button>
      </div>
      <div class="wm-body">
        <!-- API 配置 -->
        <div v-if="uiState.activeTab === 'api'" class="wm-tab-content">
          <div class="wm-form-group">
            <label for="api-url">API URL</label>
            <input
              id="api-url"
              type="text"
              class="wm-input"
              v-model="apiSettings.apiUrl"
              placeholder="例如：https://api.openai.com/v1"
            />
          </div>
          <div class="wm-form-group">
            <label for="api-key">API Key</label>
            <input
              id="api-key"
              type="password"
              class="wm-input"
              v-model="apiSettings.apiKey"
              placeholder="请输入您的API Key"
            />
          </div>
          <div class="wm-form-group">
            <label for="model-name">模型名称</label>
            <div class="wm-model-group">
              <select id="model-name" class="wm-input" v-model="apiSettings.model">
                <option v-if="!apiSettings.model && modelList.length === 0" value="" disabled>请先获取列表</option>
                <option v-if="apiSettings.model && !modelList.includes(apiSettings.model)" :value="apiSettings.model">
                  {{ apiSettings.model }} (自定义)
                </option>
                <option v-for="model in modelList" :key="model" :value="model">
                  {{ model }}
                </option>
              </select>
              <button class="wm-btn wm-fetch-btn" @click="fetchModelList" :disabled="isFetchingModels">
                {{ isFetchingModels ? '...' : '获取' }}
              </button>
            </div>
          </div>
          <div class="wm-footer">
            <button class="wm-save-btn" @click="saveApiSettings">保存设置</button>
          </div>
        </div>
        <!-- 主界面 -->
        <div v-if="uiState.activeTab === 'main'" class="wm-tab-content">
          <div class="main-tab-actions">
            <button class="wm-btn large" @click="synthesizePersonality" :disabled="isSynthesizing">
              {{ isSynthesizing ? '正在创生...' : '一键创生人格' }}
            </button>
            <button class="wm-btn wm-refresh-btn" @click="fetchLatestMemory" title="刷新">↻</button>
          </div>
          <div v-if="latestMemory" class="wm-memory-card">
            <p class="time">{{ latestMemory.timestamp }}</p>
            <p class="summary">{{ latestMemory.summary.text }}</p>
            <div class="wm-keywords">
              <span v-for="keyword in latestMemory.summary.keywords" :key="keyword" class="wm-keyword">
                {{ keyword }}
              </span>
            </div>
          </div>
          <div v-else class="wm-placeholder">暂无记忆。开始对话以生成第一条记忆。</div>
        </div>
        <!-- 人格图谱 -->
        <div v-if="uiState.activeTab === 'atlas'" class="wm-tab-content">
          <AtlasPanel />
        </div>
        <!-- 参数配置 -->
        <div v-if="uiState.activeTab === 'params'" class="wm-tab-content">
          <div class="wm-form-group">
            <label for="context-chat-lines">上下文发送层数 (最近聊天记录数)</label>
            <input
              id="context-chat-lines"
              type="number"
              class="wm-input"
              v-model="advancedSettings.contextChatLines"
              min="1"
              max="50"
            />
          </div>
          <div class="wm-form-group">
            <label for="recent-memories-count">近期记忆数 (发送给AI的最近记忆数量)</label>
            <input
              id="recent-memories-count"
              type="number"
              class="wm-input"
              v-model="advancedSettings.recentMemoriesCount"
              min="0"
              max="50"
            />
          </div>
          <div class="wm-form-group">
            <label for="nature-degrade">本性降级楼层数</label>
            <input
              id="nature-degrade"
              type="number"
              class="wm-input"
              v-model="advancedSettings.natureDegradeDistance"
              min="10"
            />
          </div>
          <div class="wm-form-group">
            <label for="cognition-degrade">认知降级楼层数</label>
            <input
              id="cognition-degrade"
              type="number"
              class="wm-input"
              v-model="advancedSettings.cognitionDegradeDistance"
              min="10"
            />
          </div>
          <div class="wm-form-group">
            <label for="memory-forget">记忆遗忘楼层数</label>
            <input
              id="memory-forget"
              type="number"
              class="wm-input"
              v-model="advancedSettings.memoryForgetDistance"
              min="10"
            />
          </div>
        </div>
        <!-- 管理 -->
        <div v-if="uiState.activeTab === 'manage'" class="wm-tab-content">
          <div class="danger-zone">
            <h4>危险区域</h4>
            <p>以下操作会永久删除世界书条目，请谨慎操作。</p>
            <div class="danger-buttons">
              <button class="danger-btn" @click="deleteNatures">删除本性</button>
              <button class="danger-btn" @click="deleteCognitions">删除认知</button>
              <button class="danger-btn" @click="deleteEpisodics">删除记忆</button>
              <button class="danger-btn all" @click="deleteAllMemories">删除全部</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 悬浮球 -->
    <div
      v-show="uiState.mode === 'orb'"
      class="wm-orb"
      :style="orbStyle"
      title="展开面板"
      @click="setMode('panel')"
      @pointerdown.prevent.stop="onDragStart"
    >
      <div class="wm-orb-icon">🧠</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '../store';
import AtlasPanel from './AtlasPanel.vue';

const settingsStore = useSettingsStore();
const { uiState, apiSettings, advancedSettings, latestMemory, modelList, isFetchingModels, isSynthesizing } =
  storeToRefs(settingsStore);
const {
  setMode,
  saveApiSettings,
  setActiveTab,
  fetchLatestMemory,
  fetchModelList,
  deleteNatures,
  deleteCognitions,
  deleteEpisodics,
  deleteAllMemories,
  synthesizePersonality,
} = settingsStore;

const isPhone = ref(window.innerWidth <= 768);

const panelStyle = computed(() => ({
  left: `${uiState.value.panelPos.x}px`,
  top: `${uiState.value.panelPos.y}px`,
  width: `${uiState.value.panelPos.width}px`,
  height: `${uiState.value.panelPos.height}px`,
}));

const orbStyle = computed(() => ({
  left: `${uiState.value.orbPos.x}px`,
  top: `${uiState.value.orbPos.y}px`,
}));

let dragState: {
  isDragging: boolean;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  ownerDoc: Document;
} | null = null;

function onDragStart(event: PointerEvent) {
  event.preventDefault();
  const ownerDoc = (event.target as HTMLElement).ownerDocument;
  dragState = {
    isDragging: true,
    startX: event.clientX,
    startY: event.clientY,
    baseX: uiState.value.mode === 'panel' ? uiState.value.panelPos.x : uiState.value.orbPos.x,
    baseY: uiState.value.mode === 'panel' ? uiState.value.panelPos.y : uiState.value.orbPos.y,
    ownerDoc,
  };
  ownerDoc.addEventListener('pointermove', onDragMove);
  ownerDoc.addEventListener('pointerup', onDragEnd, { once: true });
}

function onDragMove(event: PointerEvent) {
  if (!dragState?.isDragging) return;
  const dx = event.clientX - dragState.startX;
  const dy = event.clientY - dragState.startY;
  if (uiState.value.mode === 'panel') {
    uiState.value.panelPos.x = dragState.baseX + dx;
    uiState.value.panelPos.y = dragState.baseY + dy;
  } else {
    uiState.value.orbPos.x = dragState.baseX + dx;
    uiState.value.orbPos.y = dragState.baseY + dy;
  }
}

function onDragEnd() {
  if (!dragState?.ownerDoc) return;
  dragState.isDragging = false;
  dragState.ownerDoc.removeEventListener('pointermove', onDragMove);
  dragState = null;
}

function handleResize() {
  isPhone.value = window.innerWidth <= 768;
}

let stopMessageListener: (() => void) | null = null;

onMounted(() => {
  window.addEventListener('resize', handleResize);
  fetchLatestMemory();
  if (typeof eventOn !== 'function') return;
  stopMessageListener = eventOn(tavern_events.MESSAGE_UPDATED, () => fetchLatestMemory()).stop;
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  stopMessageListener?.();
});
</script>

<style>
.wm-root {
  position: fixed;
  inset: 0;
  z-index: 10000;
  pointer-events: none;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}
.wm-panel,
.wm-orb {
  position: fixed;
  pointer-events: auto;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
  user-select: none;
}
.wm-panel {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: rgba(30, 30, 35, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  color: #f0f0f0;
}
.wm-drag-handle {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  cursor: grab;
}
.wm-drag-handle:active {
  cursor: grabbing;
}
.wm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  font-weight: bold;
}
.wm-tabs {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 10px;
  flex-wrap: wrap;
}
.wm-tab-btn {
  appearance: none;
  border: none;
  background: transparent;
  color: #c0c0c0;
  padding: 10px 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.wm-tab-btn.is-active {
  color: #f0f0f0;
  border-bottom-color: #9194e8;
}
.wm-btn {
  appearance: none;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #f0f0f0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.wm-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
.wm-body {
  padding: 0;
  flex-grow: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
.main-tab-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.wm-btn.large {
  width: auto;
  height: auto;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  flex-grow: 1;
}

.wm-tab-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-grow: 1;
  position: relative;
}
.wm-placeholder {
  color: #888;
  text-align: center;
  margin-top: 20px;
  font-style: italic;
}
.wm-memory-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.wm-memory-card p {
  margin: 0;
}
.wm-memory-card .time {
  font-size: 12px;
  color: #aaa;
}
.wm-memory-card .summary {
  font-size: 14px;
  color: #ddd;
  line-height: 1.5;
}
.wm-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.wm-keyword {
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
}
.wm-refresh-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  font-size: 16px;
}
.wm-model-group {
  display: flex;
  gap: 8px;
}
.wm-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.wm-form-group label {
  font-size: 13px;
  color: #ccc;
}
.wm-input {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.2);
  color: #f0f0f0;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}
.wm-input:focus {
  border-color: #9194e8;
}
.wm-model-group select {
  flex-grow: 1;
}
.wm-fetch-btn {
  flex-shrink: 0;
  width: auto;
  padding: 0 12px;
  border-radius: 8px;
}
.danger-zone {
  border: 1px solid #c0392b;
  border-radius: 8px;
  padding: 16px;
  background: rgba(192, 57, 43, 0.1);
}
.danger-zone h4 {
  margin-top: 0;
  color: #e74c3c;
}
.danger-zone p {
  font-size: 13px;
  color: #f0f0f0;
}
.danger-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 16px;
}
.danger-btn {
  appearance: none;
  border: 1px solid #c0392b;
  background: transparent;
  color: #e74c3c;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}
.danger-btn:hover {
  background: rgba(192, 57, 43, 0.2);
}
.danger-btn.all {
  grid-column: 1 / -1;
  background: #c0392b;
  color: white;
}
.danger-btn.all:hover {
  background: #a53125;
}
.wm-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
}
.wm-save-btn {
  appearance: none;
  border: none;
  background: #4a4e69;
  color: #f0f0f0;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}
.wm-save-btn:hover {
  background: #5a5e89;
}
.wm-orb {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #4a4e69, #22223b);
  border: 2px solid rgba(255, 255, 255, 0.15);
  cursor: grab;
  display: grid;
  place-items: center;
}
.wm-orb:active {
  cursor: grabbing;
}
.wm-orb-icon {
  font-size: 28px;
}
</style>
