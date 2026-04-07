import { useStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ApiSettings, EpisodicMemoryUnit, SynthesisResponse } from '../types';
import { TavernService } from '../services/tavern.service';
import { AiService } from '../services/ai.service';
import cognitiveIsolationCot from '../templates/cognitive_isolation.txt?raw';
import dynamicExpressionCot from '../templates/dynamic_expression.txt?raw';

const STORAGE_KEY_API = 'world-memory-plugin-api-settings';
const STORAGE_KEY_UI = 'world-memory-plugin-ui-state';

export const useSettingsStore = defineStore('world-memory-settings', () => {
  const apiSettings = useStorage<ApiSettings>(STORAGE_KEY_API, {
    apiUrl: '',
    apiKey: '',
    model: '',
  });

  const uiState = useStorage(STORAGE_KEY_UI, {
    mode: 'panel' as 'panel' | 'orb',
    activeTab: 'main' as 'main' | 'nature' | 'cognition' | 'atlas' | 'api' | 'params' | 'manage',
    panelPos: { x: 100, y: 100, width: 340, height: 420 },
    orbPos: { x: 300, y: 300 },
  });

  const advancedSettings = useStorage('world-memory-plugin-advanced-settings', {
    natureDegradeDistance: 400,
    cognitionDegradeDistance: 200,
    memoryForgetDistance: 300,
    contextChatLines: 5,
    recentMemoriesCount: 10,
  });

  const latestMemory = ref<EpisodicMemoryUnit | null>(null);
  const modelList = ref<string[]>([]);
  const isFetchingModels = ref(false);
  const natureContent = ref<string | null>(null);
  const cognitionEntries = ref<WorldbookEntry[]>([]);
  const isLoading = ref(false);
  const isSynthesizing = ref(false);
  const synthesisError = ref<string | null>(null);

  const fetchModelList = async () => {
    if (isFetchingModels.value) return;
    isFetchingModels.value = true;
    try {
      toastr.info('正在获取模型列表...');
      const models = await AiService.fetchAvailableModels(apiSettings.value);
      modelList.value = models;
      if (models.length > 0) {
        toastr.success(`成功获取 ${models.length} 个模型！`);
        if (!models.includes(apiSettings.value.model)) apiSettings.value.model = '';
      } else {
        toastr.warning('未能获取到模型列表，请检查API Key和URL是否正确。');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      toastr.error(`获取模型列表失败: ${message}`);
    } finally {
      isFetchingModels.value = false;
    }
  };

  const fetchLatestMemory = async () => {
    try {
      const memories = await TavernService.getRecentMemories(1);
      latestMemory.value = memories[0] ?? null;
    } catch (e) {
      latestMemory.value = null;
    }
  };

  const findAndSetNature = async () => {
    isLoading.value = true;
    const entry = await TavernService.findNatureEntry();
    natureContent.value = entry?.content ?? null;
    isLoading.value = false;
  };

  const fetchCognitions = async () => {
    isLoading.value = true;
    cognitionEntries.value = await TavernService.getCognitionEntries();
    isLoading.value = false;
  };

  const synthesizePersonality = async () => {
    isSynthesizing.value = true;
    synthesisError.value = null;
    try {
      toastr.info('开始人格创生...');
      const context = TavernService.getCharacterContext();
      if (!context) throw new Error('无法获取角色上下文。');

      const systemCots = `
# 认知隔离协议
${cognitiveIsolationCot}

# 动态表达协议
${dynamicExpressionCot}
`;

      const results = await AiService.callSynthesisAI(apiSettings.value, context, systemCots);
      await TavernService.batchSaveFromSynthesis(results);
      await findAndSetNature();
      await fetchCognitions();
      toastr.success('人格创生成功！');
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      synthesisError.value = message;
      toastr.error(`人格创生失败: ${message}`);
    } finally {
      isSynthesizing.value = false;
    }
  };

  const deleteNatures = async () => {
    if (confirm('确定要删除所有“本性”条目吗？此操作不可逆！')) {
      await TavernService.deleteNatureEntries();
      await findAndSetNature();
    }
  };
  const deleteCognitions = async () => {
    if (confirm('确定要删除所有“认知”条目吗？此操作不可逆！')) {
      await TavernService.deleteCognitionEntries();
      await fetchCognitions();
    }
  };
  const deleteEpisodics = async () => {
    if (confirm('确定要删除所有“情景记忆”条目吗？此操作不可逆！')) {
      await TavernService.deleteEpisodicEntries();
    }
  };
  const deleteAllMemories = async () => {
    if (confirm('警告：确定要删除所有记忆人格相关条目吗？此操作不可逆！')) {
      await TavernService.deleteAllMemoryEntries();
      await findAndSetNature();
      await fetchCognitions();
    }
  };

  const saveApiSettings = () => {
    try {
      if (typeof replaceVariables === 'function') {
        replaceVariables(apiSettings.value, { type: 'script' });
        toastr.success('API 设置已保存至酒馆助手！');
      } else {
        toastr.warning('未找到 replaceVariables 函数，设置仅保存于浏览器。');
      }
    } catch (e) {
      toastr.error('保存设置时发生错误。');
    }
  };

  const loadApiSettings = () => {
    try {
      if (typeof getVariables === 'function') {
        const vars = getVariables({ type: 'script' });
        if (vars && typeof vars === 'object' && Object.keys(vars).length > 0) {
          apiSettings.value = { ...apiSettings.value, ...vars };
          return;
        }
      }
    } catch (e) {
      //
    }
  };

  const setMode = (newMode: 'panel' | 'orb') => {
    if (uiState.value.mode === 'panel' && newMode === 'orb') {
      uiState.value.orbPos = {
        x: uiState.value.panelPos.x + uiState.value.panelPos.width / 2 - 32,
        y: uiState.value.panelPos.y + uiState.value.panelPos.height / 2 - 32,
      };
    }
    uiState.value.mode = newMode;
  };

  const setActiveTab = (tab: 'main' | 'nature' | 'cognition' | 'atlas' | 'api' | 'params' | 'manage') => {
    uiState.value.activeTab = tab;
  };

  const updateNodeContent = async (
    nodeId: string,
    nodeType: 'NATURE' | 'COGNITION' | 'MEMORY',
    parentEntryName: string,
    payload: { [key: string]: any },
  ) => {
    try {
      await TavernService.updateMemoryContent(nodeId, nodeType, parentEntryName, payload);
      toastr.success('记忆内容已更新！');
    } catch (error) {
      toastr.error('更新记忆内容时出错。');
      console.error(error);
    }
  };

  loadApiSettings();

  return {
    apiSettings,
    uiState,
    advancedSettings,
    latestMemory,
    modelList,
    isFetchingModels,
    natureContent,
    cognitionEntries,
    isLoading,
    isSynthesizing,
    synthesisError,
    saveApiSettings,
    loadApiSettings,
    fetchLatestMemory,
    fetchModelList,
    findAndSetNature,
    synthesizePersonality,
    fetchCognitions,
    deleteNatures,
    deleteCognitions,
    deleteEpisodics,
    deleteAllMemories,
    setMode,
    setActiveTab,
    updateNodeContent,
  };
});
