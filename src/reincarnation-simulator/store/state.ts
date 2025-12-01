import { reactive, watch } from 'vue';
import type { AppState, Character } from '../types';

export const USER_ID = '{{user}}';

// 使用 AppState 接口创建一个结构清晰的初始状态
const initialState: AppState = {
  isReady: false,
  character: null,
  worldState: null,
  userId: USER_ID,
  mainWorldNarrative: '正在连接主世界...',
  avatarWorldNarrative: '',
  activeView: 'mainWorld',
  selectedWorldForReincarnation: null,
  reincarnationWorldOptions: [],
  reincarnationAvatarOptions: [],
  worldLog: [],
  settlementData: null,
  newWorldsAvailable: false, // 新增状态，用于控制弹窗显示
  isGenerating: false,
  generationError: null as string | null,
};

// 使用 reactive 创建响应式 store
export const store = reactive<AppState & { getItemNameById: (id: string) => string | null }>({
  ...initialState,
  getItemNameById(id: string): string | null {
    const database = this.worldState?.数据库;
    if (!database) return null;

    for (const category in database) {
      const categoryStore = (database as any)[category];
      if (categoryStore && categoryStore[id]) {
        return categoryStore[id].名称 || null;
      }
    }
    return null;
  },
});

// 你可以在这里添加 watch 来调试状态变化
watch(
  () => store.character,
  (newChar: Character | null, oldChar: Character | null) => {
    console.log('[State Watch] Character changed:', newChar);
  },
  { deep: true },
);

watch(
  () => store.isReady,
  (isReady: boolean) => {
    console.log(`[State Watch] Store is now ${isReady ? 'ready' : 'not ready'}.`);
  },
);
