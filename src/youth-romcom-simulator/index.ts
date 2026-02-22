import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css';
import { watch } from 'vue';
import './core/vue-loader';
import { commandService } from './services/CommandService';
import { diarySynthesisService } from './services/DiarySynthesisService';
import { entityIndexService } from './services/EntityIndexService';
import { inputModalActions, inputModalState } from './services/InputModalService';
import { logSyncService } from './services/LogSyncService';
import { lorebookService } from './services/LorebookService';
import { memoryService } from './services/MemoryService';
import { npcService } from './services/NpcService';
import { saveLoadService } from './services/saveLoadService';
import { serviceLocator } from './services/service-locator';
import { tavernService } from './services/tavern';
import { actions, store } from './store';
import './styles/main.scss';

// 初始化核心服务
async function initializeServices() {
  // 注册所有服务
  serviceLocator.register('saveLoadService', saveLoadService);
  serviceLocator.register('inputModalState', inputModalState);
  serviceLocator.register('inputModalActions', inputModalActions);
  serviceLocator.register('store', store);
  serviceLocator.register('actions', actions);
  serviceLocator.register('diarySynthesisService', diarySynthesisService);

  await npcService.initializeWorldAndLocationData();
  // 等待 worldState 加载完毕
  if (!store.worldState) {
    // Wait for worldState to be loaded
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
  diarySynthesisService.initialize();
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
  // The diary watch logic is now replaced by the WeeklyReviewService
  // and other more direct update mechanisms.
  // 启动导演场记轮询，以替代旧的watch机制
  let lastDirectorLogContent = '';
  setInterval(async () => {
    // 强制刷新缓存以获取最新内容
    const currentLogContent = await lorebookService.readFromLorebook('导演场记', true);

    // 检查内容是否存在且发生了变化
    if (currentLogContent && currentLogContent !== lastDirectorLogContent) {
      console.log('[Auto-Memory Polling] Detected change in "导演场记", processing...');
      await memoryService.processDirectorLog();
      lastDirectorLogContent = currentLogContent;
    }
  }, 5000); // 每5秒检查一次
});

// 这几个服务实例只需要被导入以确保其构造函数被执行
saveLoadService;
commandService;
tavernService;
