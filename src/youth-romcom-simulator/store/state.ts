import { reactive, watch } from 'vue';
import type { AppState, 游戏世界状态, DisplayStoryStage, DirectorLog } from '../types';

// 根据新的世界观，用户ID现在指向一个具体的角色
export const USER_ID = '{{user}}';

// 使用 AppState 接口创建一个符合新世界观的初始状态
const initialState: AppState = {
  isReady: false,
  worldState: null as 游戏世界状态 | null,
  userId: USER_ID, // Add the user ID to the state
  narrative: '正在连接春物世界...',
  mainWorldNarrative: '正在连接春物世界...',
  avatarWorldNarrative: '',
  activeView: 'mainWorld',
  isGenerating: false,
  generationError: null as string | null,
  lastSubmittedAction: null,
  lastGeneratedPatch: null,
  diary: [],
  diaryFragments: [],
  directorLogs: [] as DirectorLog[],
  weeklyReviews: [],
  futureStorylines: [] as DisplayStoryStage[],
};

// 使用 reactive 创建响应式 store
export const store = reactive<AppState>({
  ...initialState,
});
