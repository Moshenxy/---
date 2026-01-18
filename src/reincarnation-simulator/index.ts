import './core/vue-loader';
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css';
import './styles/main.scss';
import { saveLoadService } from './services/saveLoadService';
import { commandService } from './services/CommandService';
import { tavernService } from './services/tavern';
import { npcService } from './services/NpcService';
import { entityIndexService } from './services/EntityIndexService';
import { store, actions } from './store';
import { watch } from 'vue';
import { serviceLocator } from './services/service-locator';
import { inputModalActions, inputModalState } from './services/InputModalService';
import { logSyncService } from './services/LogSyncService';
import { memoryService } from './services/MemoryService';

// 初始化核心服务
async function initializeServices() {
  // 注册所有服务
  serviceLocator.register('saveLoadService', saveLoadService);
  serviceLocator.register('inputModalState', inputModalState);
  serviceLocator.register('inputModalActions', inputModalActions);
  serviceLocator.register('store', store);
  serviceLocator.register('actions', actions);

  await npcService.initializeWorldAndLocationData();
  // 等待 worldState 加载完毕
  if (!store.worldState) {
    await new Promise(resolve => {
      const unwatch = watch(
        () => store.worldState,
        newValue => {
          if (newValue) {
            unwatch();
            resolve(true);
          }
        },
      );
    });
  }
  await entityIndexService.buildIndex(store.worldState);
  // 其他需要异步初始化的服务可以放在这里
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

// 在服务初始化后执行
initializeServices().then(() => {
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
    { deep: true }, // 使用深度监听以检测数组内部的变化
  );
});

// 这几个服务实例只需要被导入以确保其构造函数被执行
saveLoadService;
commandService;
tavernService;
