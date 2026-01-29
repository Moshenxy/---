import { watch } from 'vue';
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css';
import { commandService } from './services/CommandService';
import { entityIndexService } from './services/EntityIndexService';
import { inputModalActions, inputModalState } from './services/InputModalService';
import { logSyncService } from './services/LogSyncService';
import { memoryService } from './services/MemoryService';
import { npcService } from './services/NpcService';
import { saveLoadService } from './services/saveLoadService';
import { serviceLocator } from './services/service-locator';
import { tavernService } from './services/tavern';
import { actions, store } from './store';
import './styles/main.scss';
import './core/vue-loader';

// 1. 立即开始加载核心数据
actions.loadAllData();

// 2. 注册核心服务
serviceLocator.register('saveLoadService', saveLoadService);
serviceLocator.register('inputModalState', inputModalState);
serviceLocator.register('inputModalActions', inputModalActions);
serviceLocator.register('store', store);
serviceLocator.register('actions', actions);


// 3. 监听 store.isReady 状态，确保数据加载完毕后再初始化依赖数据的服务
const unwatch = watch(
  () => store.isReady,
  (isReady) => {
    if (isReady) {
      console.log('[Startup] Store is ready, proceeding with service initialization.');
      initializeDependentServices();
      unwatch(); // 初始化完成后停止监听，避免重复执行
    }
  },
  { immediate: true } // 立即执行一次，以防 isReady 已经为 true
);


/**
 * 初始化依赖于 worldState 的服务
 */
async function initializeDependentServices() {
    if (!store.worldState) {
        console.error('[Startup] worldState is null after store is ready. Aborting dependent service initialization.');
        return;
    }
  await npcService.initializeWorldAndLocationData();
  await entityIndexService.buildIndex(store.worldState);
  
  console.log('All services initialized.');
  handleRerollRestore();

  // 启动自动日志同步服务
  logSyncService.startPolling(15000);

  // 监听 worldLog 的变化，自动更新记忆系统
  watch(
    () => store.worldLog,
    (newLog, oldLog) => {
      if (newLog.length > (oldLog?.length || 0)) {
        console.log('[Auto-Memory] World log updated, triggering memory update.');
        memoryService.updateMemory(newLog);
      }
    },
    { deep: true },
  );
}


function handleRerollRestore() {
  const shouldRestore = localStorage.getItem('reincarnation-simulator-restore-input');
  if (shouldRestore === 'true') {
    console.log('[Startup] Restore flag found, restoring last input.');
    const lastInput = localStorage.getItem('reincarnation-simulator-last-submitted');
    if (lastInput) {
      inputModalActions.setValue(lastInput);
      inputModalActions.show();
    }
    localStorage.removeItem('reincarnation-simulator-restore-input');
  }
}

// 这几个服务实例只需要被导入以确保其构造函数被执行
saveLoadService;
commandService;
tavernService;
