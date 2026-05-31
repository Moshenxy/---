import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { z } from 'zod';

// 1. 使用 Zod 定义配置的结构和默认值
const ApiSettingsSchema = z.object({
  url: z.string().url().default('https://api.openai.com/v1/chat/completions'),
  apiKey: z.string().default(''),
  model: z.string().default('gpt-4-turbo'),
});

// 从 Schema 推断出类型
export type ApiSettings = z.infer<typeof ApiSettingsSchema>;

const STORAGE_KEY = 'youth-romcom-api-settings';

/**
 * Pinia Store for managing API settings.
 * - Loads settings from localStorage on startup.
 * - Persists settings to localStorage on change.
 */
export const useSettingsStore = defineStore('apiSettings', () => {
  // 2. 从 localStorage 加载初始状态
  const loadSettings = (): ApiSettings => {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEY);
      if (storedSettings) {
        // 如果 localStorage 中有数据，用 Zod 解析它
        // safeParse 不会抛出错误，而是返回一个包含成功状态和数据的对象
        const result = ApiSettingsSchema.safeParse(JSON.parse(storedSettings));
        if (result.success) {
          return result.data;
        }
      }
    } catch (error) {
      console.error('Failed to load or parse API settings from localStorage:', error);
    }
    // 如果加载或解析失败，返回 Zod schema 定义的默认值
    return ApiSettingsSchema.parse({});
  };

  const settings = ref<ApiSettings>(loadSettings());

  // 3. 监听 settings 的变化，并将其保存到 localStorage
  watch(
    settings,
    newSettings => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      } catch (error) {
        console.error('Failed to save API settings to localStorage:', error);
      }
    },
    { deep: true }, // 使用 deep watch 来监听对象内部属性的变化
  );

  return {
    settings,
  };
});
