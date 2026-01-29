import { store } from '../store';
import type { WorldLogEntry } from '../types';
import { lorebookService } from './LorebookService';
import { memoryService } from './MemoryService';
import { notificationService } from './NotificationService';
import { tavernService } from './tavern';

/**
 * 提取键值对的辅助函数
 * (从 actions.ts 迁移过来)
 */
function parseBlock(block: string): { [key: string]: string } {
  const data: { [key: string]: string } = {};
  const lines = block.trim().split('\n');
  let currentKey = '';
  for (const line of lines) {
    const separatorIndex = line.indexOf('|');
    if (separatorIndex !== -1) {
      const key = line.substring(0, separatorIndex).trim();
      const value = line.substring(separatorIndex + 1).trim();
      data[key] = value;
      currentKey = key;
    } else if (currentKey && line.trim()) {
      data[currentKey] += '\n' + line;
    }
  }
  for (const key in data) {
    data[key] = data[key].trim();
  }
  return data;
}

class LogSyncService {
  private pollingInterval: any | null = null;
  private isSyncing = false;

  public startPolling(interval = 15000) {
    if (this.pollingInterval) {
      this.stopPolling();
    }
    console.log(`[LogSyncService] Starting to poll chat history every ${interval}ms.`);
    this.pollingInterval = setInterval(() => this.syncLogsFromChat(), interval);
    this.syncLogsFromChat(); // 立即执行一次
  }

  public stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('[LogSyncService] Stopped polling chat history.');
    }
  }

  public async syncLogsFromChat() {
    if (this.isSyncing) {
      console.log('[LogSyncService] Sync is already in progress. Skipping.');
      return;
    }
    this.isSyncing = true;
    console.log('[LogSyncService] Starting log sync from chat history...');

    try {
      const messages = await tavernService.fetchTavernData();
      if (!messages) {
        this.isSyncing = false;
        return;
      }

      const allParsedLogs: WorldLogEntry[] = [];
      const logBlockRegex = /<本世历程>([\s\S]+?)<\/本世历程>/g;

      for (const message of messages) {
        if (message.is_user) continue; // 只处理AI的回复

        let match;
        while ((match = logBlockRegex.exec(message.message)) !== null) {
          try {
            const block = parseBlock(match[1]);
            if (block && block['序号']) {
              allParsedLogs.push({
                序号: parseInt(block['序号'], 10),
                日期: block['日期'] || '未知日期',
                标题: block['标题'] || '无标题',
                地点: block['地点'] || '未知地点',
                人物: block['人物'] || '未知人物',
                描述: block['描述'] || '',
                人物关系: block['人物关系'] || '',
                标签: block['标签']
                  ? block['标签']
                      .replace(/[[\]"]/g, '')
                      .split(',')
                      .map(t => t.trim())
                      .filter(Boolean)
                  : [],
                重要信息: block['重要信息'] || '',
                暗线与伏笔: block['暗线与伏笔'] || '',
                自动化系统: block['自动化系统'] || '',
                天机推演: block['天机推演'] || '',
              });
            }
          } catch (e) {
            console.error('[LogSyncService] Failed to parse a log block:', e);
          }
        }
      }

      if (allParsedLogs.length === 0) {
        console.log('[LogSyncService] No new log entries found in recent chat history.');
        this.isSyncing = false;
        return;
      }

      const existingLogIds = new Set(store.worldLog.map(log => log.序号));
      const newLogs = allParsedLogs.filter(log => !existingLogIds.has(log.序号) && !isNaN(log.序号));

      if (newLogs.length > 0) {
        // 对新日志排序，以防万一
        newLogs.sort((a, b) => a.序号 - b.序号);

        // 更新状态
        store.worldLog = [...store.worldLog, ...newLogs].sort((a, b) => a.序号 - b.序号);

        // 将新日志追加到世界书
        const contentToAppend = newLogs
          .map(log => {
            return Object.entries(log)
              .map(([key, value]) => `${key}|${Array.isArray(value) ? value.join(', ') : value}`)
              .join('\n');
          })
          .join('\n\n---\n\n');

        const existingContent = await lorebookService.readFromLorebook('本世历程');
        const finalContentToAppend = newLogs
          .map(log => {
            const logBlock = Object.entries(log)
              .map(([key, value]) => `${key}|${Array.isArray(value) ? value.join(', ') : value}`)
              .join('\n');
            // 检查现有内容中是否已包含此日志块，避免重复添加
            return existingContent && existingContent.includes(`序号|${log.序号}`) ? null : logBlock;
          })
          .filter(Boolean) // 过滤掉 null（即已存在的日志）
          .join('\n\n---\n\n');

        if (finalContentToAppend) {
          await lorebookService.appendToEntry('本世历程', finalContentToAppend, '\n\n---\n\n');
          notificationService.success('本世历程同步', `自动同步了 ${newLogs.length} 条新历程。`);
          console.log(`[LogSyncService] Appended ${newLogs.length} new log entries to Lorebook.`);
        } else {
          console.log('[LogSyncService] All new logs were already present in the Lorebook entry. No changes made.');
        }
        notificationService.success('本世历程同步', `自动同步了 ${newLogs.length} 条新历程。`);
        console.log(`[LogSyncService] Synced ${newLogs.length} new log entries.`);
      } else {
        console.log('[LogSyncService] All found logs are already present in the store.');
      }
    } catch (error) {
      console.error('[LogSyncService] Error during log sync:', error);
    } finally {
      // 无论同步结果如何，都强制更新所有记忆层级
      try {
        await memoryService.updateInstantMemory(store.worldLog);
        await memoryService.updateShortTermMemory(store.worldLog);
        await memoryService.updateLongTermMemory(store.worldLog);
        console.log('[LogSyncService] Silently updated all memory tiers after sync.');
      } catch (memError) {
        console.error('[LogSyncService] Failed to silently update memory tiers after sync:', memError);
      }
      this.isSyncing = false;
    }
  }
}

export const logSyncService = new LogSyncService();
