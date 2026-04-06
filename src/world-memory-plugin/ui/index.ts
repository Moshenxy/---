import { createApp, type App } from 'vue';
import { createPinia, type Pinia } from 'pinia';
import { teleportStyle } from '@util/script';
import SettingsPanel from './components/SettingsPanel.vue';
import { log } from '../utils/logger';

const UI_CONTAINER_ID = 'world-memory-plugin-container';

let vueApp: App | null = null;
let styleDestroyer: (() => void) | null = null;
export let pinia: Pinia | null = null;

// 精确模仿音乐播放器的安全父窗口/文档获取逻辑
const hostWindow = (() => {
  try {
    if (window.parent && window.parent !== window) {
      return window.parent;
    }
  } catch (e) {
    // ignore
  }
  return window;
})();

const hostDocument = hostWindow.document;


/**
 * 卸载并清理Vue应用实例。
 */
export function destroyVueApp() {
  if (vueApp) {
    try {
      vueApp.unmount();
      log('Vue app unmounted.');
    } catch (error) {
      console.error('[WorldMemoryPlugin] Error unmounting Vue app:', error);
    }
  }
  const container = hostDocument.getElementById(UI_CONTAINER_ID);
  if (container) {
    container.remove();
  }
  // 销毁传送的样式
  if (styleDestroyer) {
    styleDestroyer();
    styleDestroyer = null;
  }
  vueApp = null;
  pinia = null;
}

/**
 * 初始化并挂载Vue应用。
 * @returns 返回创建的App实例，如果失败则返回null。
 */
export function initVueApp(): App | null {
  if (vueApp) {
    log('Vue app is already initialized.');
    return vueApp;
  }

  destroyVueApp();

  log('Attempting to mount Vue app...');
  try {
    let container = hostDocument.getElementById(UI_CONTAINER_ID);
    if (!container) {
      container = hostDocument.createElement('div');
      container.id = UI_CONTAINER_ID;
      hostDocument.body.appendChild(container);
    }

    const app = createApp(SettingsPanel);
    pinia = createPinia();
    app.use(pinia);
    
    // 传送样式到主窗口
    styleDestroyer = teleportStyle(hostDocument.head).destroy;

    app.mount(container);
    vueApp = app;

    log('Vue app mounted successfully.');
    return app;
  } catch (error) {
    console.error('[WorldMemoryPlugin] Error mounting Vue app:', error);
    return null;
  }
}
