import { reactive, readonly } from 'vue';
import { confirmationService } from '../services/ConfirmationService';
import { detailModalService } from '../services/DetailModalService';
import { dockManagerService } from '../services/DockManagerService';
import { fullscreenService } from '../services/fullscreenService';
import { inputModalActions } from '../services/InputModalService';
import { npcModalService } from '../services/NpcModalService';

// 定义 UI 状态接口
interface UiState {
  isWebFullscreen: boolean;
  isBrowserFullscreen: boolean;
}

// 创建响应式状态
const state = reactive<UiState>({
  isWebFullscreen: false,
  isBrowserFullscreen: false,
});

// 初始化时监听浏览器全屏状态变化
fullscreenService.onBrowserChange(isFullscreen => {
  // Check if we are transitioning from fullscreen to not-fullscreen
  if (state.isBrowserFullscreen && !isFullscreen) {
    // Use Tavern's built-in refresh mechanism instead of a hard reload
    TavernHelper.setChatMessages([], { refresh: 'all' });
  }
  state.isBrowserFullscreen = isFullscreen;
});

// 定义修改状态的 actions
const actions = {
  /**
   * 切换浏览器全屏模式
   */
  toggleBrowserFullscreen(): void {
    // 切换全屏时，关闭所有弹窗和面板
    dockManagerService.closeAllPanels();
    confirmationService.hide();
    detailModalService.hide();
    npcModalService.hide();
    inputModalActions.hide();

    fullscreenService.toggleBrowser();
  },

  /**
   * 切换网页全屏模式
   */
  toggleWebFullscreen(): void {
    if (state.isWebFullscreen) {
      fullscreenService.exitWeb();
      state.isWebFullscreen = false;
    } else {
      fullscreenService.enterWeb();
      state.isWebFullscreen = true;
    }
  },

  /**
   * 取消所有面板的固定状态
   */
  unpinAllPanels(): void {
    dockManagerService.unpinAllPanels();
  },
};

// 导出只读状态和 actions
export const uiState = readonly(state);
export const uiActions = actions;
