import { nextTick } from 'vue';
import { store, GAME_DATA, addCustomItem, getCustomData } from '../store';
import toastr from 'toastr';

const PRESET_STORAGE_KEY = 'reincarnation_presets_v2'; // 使用新键以避免与旧格式冲突

// --- 类型定义 ---
type GameDataItem = { id: string; name: string; desc: string; cost: number; [key: string]: any };
export type CustomDataPayload = { [key in keyof typeof GAME_DATA]?: GameDataItem[] };

export interface Preset {
  name: string;
  selections: typeof store.selections;
  potentialPoints: typeof store.potentialPoints;
  customData?: CustomDataPayload;
}

// --- 辅助函数 ---

/**
 * 从当前选项中提取所有使用到的自定义项目
 */
function extractUsedCustomData(): CustomDataPayload {
  const usedCustomData: CustomDataPayload = {};
  const allSelections = [
    store.selections.blueprint,
    store.selections.tone,
    store.selections.identity,
    store.selections.core_need,
    ...(store.selections.tags || []),
    ...(store.selections.relics || []),
    ...(store.selections.talents || []),
    ...(store.selections.past_experiences || []),
    ...(store.selections.character_traits || []),
    ...Object.keys(store.selections.backpack || {}),
  ];

  const uniqueIds = [...new Set(allSelections.filter(id => id && id.startsWith('custom-')))];

  if (uniqueIds.length === 0) {
    return {};
  }

  const EXCLUDED_KEYS = ['difficulties', 'potentials'];

  for (const key in GAME_DATA) {
    if (EXCLUDED_KEYS.includes(key)) {
      continue;
    }
    const dataCategory = GAME_DATA[key as keyof typeof GAME_DATA];
    if (Array.isArray(dataCategory)) {
      const foundItems = dataCategory.filter(item => uniqueIds.includes(item.id));
      if (foundItems.length > 0) {
        usedCustomData[key as keyof typeof GAME_DATA] = foundItems as GameDataItem[];
      }
    }
  }
  return usedCustomData;
}

/**
 * 将预设中的自定义数据注入到当前游戏中
 * @param customData 从预设中读取的自定义数据
 */
async function injectCustomData(customData: CustomDataPayload | undefined): Promise<void> {
  if (!customData) return;

  let injected = false;
  const injectionPromises: Promise<void>[] = [];

  for (const key in customData) {
    const type = key as keyof typeof GAME_DATA;
    const itemsToInject = customData[type];

    if (itemsToInject && Array.isArray(GAME_DATA[type])) {
      const existingIds = new Set((GAME_DATA[type] as GameDataItem[]).map(i => i.id));
      itemsToInject.forEach(item => {
        if (!existingIds.has(item.id)) {
          const promise = new Promise<void>(resolve => {
            // 直接传递完整的 item 对象
            addCustomItem(type, item);
            injected = true;
            resolve();
          });
          injectionPromises.push(promise);
        }
      });
    }
  }

  if (injectionPromises.length > 0) {
    await Promise.all(injectionPromises);
    if (injected) {
      toastr.info('方案中包含的自定义选项已自动添加到您的游戏中。');
    }
  }
}

// --- 核心服务函数 ---

export function getPresets(): Preset[] {
  try {
    const presetsJson = localStorage.getItem(PRESET_STORAGE_KEY);
    return presetsJson ? JSON.parse(presetsJson) : [];
  } catch (error) {
    console.error('加载方案列表失败:', error);
    toastr.error('加载方案列表失败。');
    return [];
  }
}

export function savePreset(name: string) {
  if (!name || !name.trim()) {
    toastr.warning('方案名称不能为空。');
    return;
  }

  const presets = getPresets();
  const customData = extractUsedCustomData();

  const newPreset: Preset = {
    name: name.trim(),
    selections: JSON.parse(JSON.stringify(store.selections)),
    potentialPoints: JSON.parse(JSON.stringify(store.potentialPoints)),
    ...(Object.keys(customData).length > 0 && { customData }),
  };

  const existingIndex = presets.findIndex(p => p.name === newPreset.name);
  if (existingIndex > -1) {
    presets[existingIndex] = newPreset;
  } else {
    presets.push(newPreset);
  }

  try {
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
    toastr.success(`方案 "${newPreset.name}" 已保存！`);
  } catch (error) {
    console.error('保存方案失败:', error);
    toastr.error('保存方案失败。');
  }
}

export async function loadPreset(preset: Preset) {
  try {
    // 1. 异步注入自定义数据，并等待其完成
    await injectCustomData(preset.customData);

    // 2. 在下一个DOM更新周期应用选择，确保选项已渲染
    await nextTick();

    Object.assign(store.selections, JSON.parse(JSON.stringify(preset.selections)));
    Object.assign(store.potentialPoints, JSON.parse(JSON.stringify(preset.potentialPoints)));

    toastr.success(`方案 "${preset.name}" 已加载！`);
  } catch (error) {
    console.error('加载方案失败:', error);
    toastr.error('加载方案失败。');
  }
}

export function deletePreset(name: string) {
  let presets = getPresets();
  presets = presets.filter(p => p.name !== name);

  try {
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
    toastr.info(`方案 "${name}" 已删除。`);
  } catch (error) {
    console.error('删除方案失败:', error);
    toastr.error('删除方案失败。');
  }
}

export function exportPreset(preset: Preset) {
  try {
    const presetJson = JSON.stringify(preset, null, 2);
    const blob = new Blob([presetJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `轮回开局方案-${preset.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toastr.success('方案已开始导出！');
  } catch (error) {
    console.error('导出方案失败:', error);
    toastr.error('导出方案失败。');
  }
}

export function importPreset(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const importedPreset = JSON.parse(event.target?.result as string) as Preset;

        if (!importedPreset.name || !importedPreset.selections || !importedPreset.potentialPoints) {
          throw new Error('无效的方案文件格式。');
        }

        // 注入自定义数据并保存
        injectCustomData(importedPreset.customData);
        savePreset(importedPreset.name); // 使用 savePreset 来添加或覆盖

        // 确保导入的数据完全覆盖
        const presets = getPresets();
        const targetPreset = presets.find(p => p.name === importedPreset.name);
        if (targetPreset) {
          Object.assign(targetPreset, importedPreset);
          localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
        }

        toastr.success(`方案 "${importedPreset.name}" 已成功导入并保存！`);
        resolve();
      } catch (e) {
        const error = e as Error;
        console.error('导入方案失败:', error);
        toastr.error(`导入失败: ${error.message}`);
        reject(error);
      }
    };
    reader.onerror = error => {
      toastr.error('读取文件失败。');
      reject(error);
    };
    reader.readAsText(file);
  });
}
