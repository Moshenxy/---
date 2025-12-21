import { reactive, watch } from 'vue';
import { get } from 'lodash';
import type { AppState, Character } from '../types';

export const USER_ID = '本体';

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
  lastSubmittedAction: null,
};

// 使用 reactive 创建响应式 store
export const store = reactive<AppState & { getItemNameById: (id: string) => string | null }>({
  ...initialState,
  getItemNameById(id: string): string | null {
    const activeWorldId = this.activeView === 'mainWorld'
      ? get(this.worldState, '玩家.本体.所属世界')
      : get(this.worldState, '玩家.模拟器.模拟.当前化身ID') ? get(this.worldState, '玩家.模拟器.模拟.当前化身ID') : null;
      
    if (!activeWorldId) return null;

    const database = get(this.worldState, `世界.${activeWorldId}.数据库`);
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
  () => store.worldState,
  (newState, oldState) => {
    console.log('[State Watch] worldState changed.');
    if (newState) {
      store.character = get(newState, '玩家.本体', null);
    } else {
      store.character = null;
    }
  },
  { deep: true },
);

watch(
  () => store.isReady,
  (isReady: boolean) => {
    console.log(`[State Watch] Store is now ${isReady ? 'ready' : 'not ready'}.`);
  },
);
