import { reactive, watch } from 'vue';
import type { AppState } from '../types';

// 根据新的世界观，用户ID现在指向一个具体的角色
export const USER_ID = '{{user}}';

// 使用 AppState 接口创建一个符合新世界观的初始状态
const initialState: AppState = {
  isReady: false,
  worldState: null,
  // narrative 字段被保留，但主要通过 mainWorldNarrative 和 avatarWorldNarrative 来驱动UI
  narrative: '正在连接春物世界...',
  mainWorldNarrative: '正在连接春物世界...',
  avatarWorldNarrative: '',
  activeView: 'mainWorld', // 确保有默认视图，解决“未知视图”问题
  isGenerating: false,
  generationError: null as string | null,
  lastSubmittedAction: null,
  worldLog: [],
};

// 使用 reactive 创建响应式 store
export const store = reactive<AppState>({
  ...initialState,
});

// 你可以在这里添加 watch 来调试状态变化
watch(
  () => store.worldState,
  (newState, oldState) => {
    console.log('[State Watch] worldState changed.');
    // 新的 watch 逻辑以适应春物世界观
    if (newState) {
      console.log('角色列表:', newState.角色列表);
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
