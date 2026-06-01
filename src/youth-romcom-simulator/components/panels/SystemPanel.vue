<template>
  <div class="system-panel">
    <div class="panel-tabs">
      <button :class="{ active: activeTab === 'saveLoad' }" @click="activeTab = 'saveLoad'">存档管理</button>
      <button :class="{ active: activeTab === 'memory' }" @click="activeTab = 'memory'">记忆系统</button>
      <button :class="{ active: activeTab === 'debug' }" @click="activeTab = 'debug'">调试</button>
      <button :class="{ active: activeTab === 'apiSettings' }" @click="activeTab = 'apiSettings'">API设置</button>
    </div>
    <div class="panel-content">
      <SaveLoadPanel v-show="activeTab === 'saveLoad'" />
      <MemoryPanel v-show="activeTab === 'memory'" />
      <DebugPanel v-show="activeTab === 'debug'" />
      <div v-show="activeTab === 'apiSettings'">
        <h2 class="mb-4 text-xl font-bold">分析API设置</h2>
        <form @submit.prevent="onSave">
          <div class="mb-4">
            <label for="api-url" class="mb-2 block text-sm font-medium">API URL</label>
            <input
              id="api-url"
              v-model="settings.url"
              type="text"
              class="block w-full rounded-lg border border-gray-600 bg-gray-800 p-2.5 text-sm text-white focus:border-blue-500 focus:ring-blue-500"
              placeholder="https://api.openai.com/v1/chat/completions"
            />
          </div>
          <div class="mb-4 flex items-end gap-2">
            <div class="flex-grow">
              <label for="api-key" class="mb-2 block text-sm font-medium">API Key</label>
              <input
                id="api-key"
                v-model="settings.apiKey"
                type="password"
                class="block w-full rounded-lg border border-gray-600 bg-gray-800 p-2.5 text-sm text-white focus:border-blue-500 focus:ring-blue-500"
                placeholder="sk-..."
              />
            </div>
            <button
              type="button"
              class="rounded-lg bg-green-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-green-800 focus:ring-4 focus:ring-green-300 focus:outline-none"
              @click="fetchModels"
            >
              获取模型
            </button>
          </div>
          <div class="mb-6">
            <label for="api-model" class="mb-2 block text-sm font-medium">模型名称</label>
            <select
              id="api-model"
              v-model="settings.model"
              class="block w-full rounded-lg border border-gray-600 bg-gray-800 p-2.5 text-sm text-white focus:border-blue-500 focus:ring-blue-500"
            >
              <option v-if="!availableModels.length && settings.model" :value="settings.model">
                {{ settings.model }}
              </option>
              <option v-for="model in availableModels" :key="model" :value="model">
                {{ model }}
              </option>
            </select>
          </div>
          <button
            type="submit"
            class="w-full rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 focus:outline-none sm:w-auto"
          >
            保存设置
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useSettingsStore } from '../../store/settingsStore';
import DebugPanel from './DebugPanel.vue';
import MemoryPanel from './MemoryPanel.vue';
import SaveLoadPanel from './SaveLoadPanel.vue';
import { klona } from 'klona';
import toastr from 'toastr';

const activeTab = ref('saveLoad');

const settingsStore = useSettingsStore();
const { settings } = storeToRefs(settingsStore);
const availableModels = ref<string[]>([]);

const fetchModels = async () => {
  try {
    const currentSettings = klona(settings.value);
    if (!currentSettings.url || !currentSettings.apiKey) {
      toastr.error('请先填写 API URL 和 API Key');
      return;
    }

    // Assuming an OpenAI-compatible API
    const modelsUrl = new URL(currentSettings.url);
    modelsUrl.pathname = '/v1/models';

    toastr.info('正在获取模型列表...');
    const response = await fetch(modelsUrl.toString(), {
      headers: {
        Authorization: `Bearer ${currentSettings.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`获取模型列表失败: ${response.statusText}`);
    }

    const json = await response.json();
    const modelIds = json.data.map((model: any) => model.id).sort();
    availableModels.value = modelIds;
    toastr.success('模型列表获取成功！');

    // If the current model is not in the new list, select the first one
    if (modelIds.length > 0 && !modelIds.includes(settings.value.model)) {
      settings.value.model = modelIds[0];
    }
  } catch (error: any) {
    console.error(error);
    toastr.error(error.message || '获取模型列表时发生未知错误');
    availableModels.value = [];
  }
};

const onSave = () => {
  // The store is already reactive, so just alerting is fine.
  // The watcher in the store will handle saving to localStorage.
  toastr.success('设置已保存！');
};
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.system-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: transparent;
}

.panel-tabs {
  display: flex;
  border-bottom: 1px solid rgba($color-gold-liu, 0.3);
  padding: 0 $spacing-lg;

  button {
    @include button-secondary;
    border-radius: 0;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px; // Overlap with the container's border

    &.active {
      color: $color-gold-pale;
      border-bottom-color: $color-gold-pale;
      background-color: rgba($color-gold-liu, 0.05);
    }
  }
}

.panel-content {
  flex-grow: 1;
  overflow: hidden;
  padding: $spacing-lg;
}
</style>
