import { MessageHandler } from './core/message-handler';
import { PreprocessorHandler } from './core/preprocessor-handler';
import { ChatSynchronizer } from './services/ChatSynchronizer';
import { LifecycleService } from './services/LifecycleService';
import { destroyVueApp, initVueApp } from './ui';
import { log } from './utils/logger';

/**
 * @file index.ts
 * @description 世界记忆插件 V2 入口文件。
 * 使用 IIFE (立即执行函数表达式) 将所有代码包裹起来，以避免全局命名空间污染。
 */
(function () {
  'use strict';

  const GLOBAL_KEY = '__WORLD_MEMORY_PLUGIN_V2__';

  // 防止插件被重复加载和执行
  if ((window as any)[GLOBAL_KEY]) {
    log('一个实例已在运行。在重新加载前销毁旧实例。');
    try {
      ((window as any)[GLOBAL_KEY] as any).destroy?.();
    } catch (e) {
      console.error('[WorldMemoryPlugin] 销毁旧实例时出错:', e);
    }
  }

  /**
   * 插件核心初始化函数
   */
  function init() {
    log('初始化世界记忆插件...');

    // 1. 初始化并挂载UI
    initVueApp();

    // 2. 启动核心服务 (消息监听等)
    MessageHandler.startListening();
    PreprocessorHandler.startListening();
    LifecycleService.start();
    ChatSynchronizer.start();

    log('插件初始化完成。');
  }

  /**
   * 插件销毁函数
   */
  function destroy() {
    log('销毁世界记忆插件实例...');

    // 1. 销毁Vue应用和UI
    destroyVueApp();

    // 2. 停止核心服务
    MessageHandler.stopListening();
    PreprocessorHandler.stopListening();
    LifecycleService.stop();
    ChatSynchronizer.stop();

    // 3. 清理全局变量
    try {
      delete (window as any)[GLOBAL_KEY];
    } catch (e) {
      log('无法删除 window 上的属性。');
    }
    log('插件已销毁。');
  }

  // 将销毁函数暴露到全局，以便重新加载时可以调用
  (window as any)[GLOBAL_KEY] = { destroy };

  // 使用 $(document).ready() 确保DOM加载完毕后再执行初始化
  $(() => {
    try {
      init();
    } catch (e) {
      console.error('[WorldMemoryPlugin] 初始化失败:', e);
    }
  });
})();
