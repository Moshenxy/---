import { log } from '../utils/logger';
import { TavernService } from './tavern.service';
import type { EpisodicMemoryUnit } from '../types';

/**
 * @file ChatSynchronizer.ts
 * @description 同步聊天记录变化，自动清理孤儿记忆。
 */
export class ChatSynchronizer {
  private static stopListeningFn: (() => void) | null = null;
  private static isSyncing = false;

  /**
   * 监听到聊天变化时触发的核心处理函数。
   */
  private static async onChatChanged() {
    if (this.isSyncing) {
      log('[ChatSynchronizer] Sync is already in progress. Skipping.');
      return;
    }
    this.isSyncing = true;
    log('[ChatSynchronizer] Chat changed, starting memory synchronization...');

    try {
      // 1. 获取当前所有有效的消息ID
      const allMessages = getChatMessages('0-{{lastMessageId}}');
      const validMessageIds = new Set(allMessages.map(m => m.message_id));

      // 2. 找出所有孤儿记忆条目
      const allMemoryEntries = await TavernService.getEpisodicEntries();
      const orphanedMemoryNames: string[] = [];

      for (const entry of allMemoryEntries) {
        const memory = entry.extra?.memoryData as EpisodicMemoryUnit | undefined;
        // 如果记忆有创建楼层ID，但这个ID已经不在有效的消息ID集合中，则为孤儿
        if (memory?.created_at_message_id && !validMessageIds.has(memory.created_at_message_id)) {
          if (entry.name) {
            orphanedMemoryNames.push(entry.name);
          }
        }
      }

      // 3. 删除孤儿记忆
      if (orphanedMemoryNames.length > 0) {
        log(`[ChatSynchronizer] Found ${orphanedMemoryNames.length} orphaned memories to delete.`);
        await TavernService.deleteMemoriesByNames(orphanedMemoryNames);
        toastr.info(`${orphanedMemoryNames.length}个因聊天记录删除而产生的孤立记忆已被自动清理。`);
      } else {
        log('[ChatSynchronizer] No orphaned memories found.');
      }

      // 4. 运行记忆新陈代谢（降级与遗忘）
      await TavernService.runMetabolism();

    } catch (error) {
      console.error('[ChatSynchronizer] Error during chat synchronization:', error);
    } finally {
      this.isSyncing = false;
      log('[ChatSynchronizer] Memory synchronization finished.');
    }
  }

  /**
   * 开始监听聊天变化事件。
   */
  public static start() {
    this.stop();
    if (typeof eventOn !== 'function') {
      console.error('[ChatSynchronizer] eventOn function is not available.');
      return;
    }
    this.stopListeningFn = eventOn(tavern_events.CHAT_CHANGED, this.onChatChanged.bind(this)).stop;
    log('[ChatSynchronizer] Started listening for chat changes.');
  }

  /**
   * 停止监听。
   */
  public static stop() {
    if (this.stopListeningFn) {
      this.stopListeningFn();
      this.stopListeningFn = null;
    }
  }
}