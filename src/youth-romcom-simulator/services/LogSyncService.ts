import { store } from '../store';
import type { AppState, DiaryEntry, WeeklyReview, DirectorLog, DiaryFragment } from '../types';
import { lorebookService } from './LorebookService';
import { memoryService } from './MemoryService';
import { notificationService } from './NotificationService';
import { tavernService } from './tavern';

// 终极版解析函数 v4，能够正确处理所有已知日志格式
function parseBlock(blockText: string): { [key: string]: any } {
    const lines = blockText.trim().split('\n');
    const result: { [key: string]: any } = {};
    let currentMajorKey: string | null = null;
    let currentList: any[] | null = null;
    let currentObjectInList: { [key: string]: string } | null = null;

    for (const line of lines) {
        if (line.trim() === '---') {
            currentMajorKey = null;
            currentList = null;
            currentObjectInList = null;
            continue;
        }

        const separatorIndex = line.indexOf('|');
        if (separatorIndex !== -1 && !currentMajorKey) {
            const key = line.substring(0, separatorIndex).trim();
            const value = line.substring(separatorIndex + 1).trim();
            result[key] = value;
            continue;
        }

        if (line.trim().startsWith('【') && line.trim().endsWith('】')) {
            currentMajorKey = line.trim();
            result[currentMajorKey] = [];
            currentList = result[currentMajorKey];
            currentObjectInList = null;
            continue;
        }

        if (currentList && currentMajorKey) { // 增加对 currentMajorKey 的检查
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('- ')) {
                const itemContent = trimmedLine.substring(2).trim();
                const itemSeparatorIndex = itemContent.indexOf(':');

                if (itemSeparatorIndex !== -1) {
                    const itemKey = itemContent.substring(0, itemSeparatorIndex).trim();
                    const itemValue = itemContent.substring(itemSeparatorIndex + 1).trim();
                    currentObjectInList = { [itemKey]: itemValue };
                    currentList.push(currentObjectInList);
                } else {
                     currentList.push(itemContent);
                     currentObjectInList = null;
                }
            } else if (currentObjectInList && trimmedLine) {
                 const lastKey = Object.keys(currentObjectInList).pop();
                 if(lastKey){
                    currentObjectInList[lastKey] += '\n' + trimmedLine;
                 }
            } else if(trimmedLine) {
                 if (result[currentMajorKey].length > 0) {
                    const lastItem = result[currentMajorKey][result[currentMajorKey].length - 1];
                    if (typeof lastItem === 'string') {
                         result[currentMajorKey][result[currentMajorKey].length - 1] += '\n' + trimmedLine;
                    }
                 } else {
                    result[currentMajorKey].push(trimmedLine);
                 }
            }
        }
    }
     for(const key in result){
        if(Array.isArray(result[key]) && result[key].length === 1 && typeof result[key][0] === 'string'){
            result[key] = result[key][0];
        }
    }

    return result;
}


class LogSyncService {
  private pollingInterval: any | null = null;
  private isSyncing = false;

  public startPolling(interval = 15000) {
    if (this.pollingInterval) this.stopPolling();
    console.log(`[LogSyncService] Starting to poll chat history every ${interval}ms.`);
    this.pollingInterval = setInterval(() => this.syncLogsFromChat(), interval);
    this.syncLogsFromChat();
  }

  public stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('[LogSyncService] Stopped polling chat history.');
    }
  }

  private async processLogs<T extends { [key: string]: any }>(
    messages: any[],
    config: { tagName: string; lorebookEntry: string; storeKey: keyof AppState; idKey: string; idParser?: (id: any) => any; onNewLogFound?: (newLogs: T[]) => Promise<void> }
  ) {
    const { tagName, lorebookEntry, storeKey, idKey, idParser = (id) => String(id), onNewLogFound } = config;
    const logBlockRegex = new RegExp(`<${tagName}>([\\s\\S]+?)<\\/${tagName}>`, 'g');
    let allNewBlocks: string[] = [];

    for (const message of messages) {
        if (message.is_user) continue;
        let match;
        while ((match = logBlockRegex.exec(message.message)) !== null) {
            allNewBlocks.push(match[1].trim());
        }
    }

    if (allNewBlocks.length === 0) return;

    const existingContent = (await lorebookService.readFromLorebook(lorebookEntry)) || '';
    const archiveContent = (await lorebookService.readFromLorebook(`${lorebookEntry}-禁开`)) || '';
    const existingIds = new Set();
    
    const allExistingBlocks = (existingContent + archiveContent).split('\n\n---\n\n');
    for (const block of allExistingBlocks) {
        const idMatch = block.match(new RegExp(`^\\s*${idKey}\\|(.+)$`, 'm'));
        if (idMatch && idMatch[1]) {
            existingIds.add(idParser(idMatch[1].trim()));
        }
    }
    
    const localStoreRef = (store as any)[storeKey] as T[];
    for (const item of localStoreRef) {
        if(item[idKey]) existingIds.add(idParser(item[idKey]));
    }

    const newItems: T[] = [];
    const newBlockContents: string[] = [];

    for (const blockText of allNewBlocks) {
        try {
            const parsed = parseBlock(blockText) as T;
            const id = parsed[idKey] ? idParser(parsed[idKey]) : null;
            if (id && !existingIds.has(id)) {
                newItems.push(parsed);
                newBlockContents.push(blockText);
                existingIds.add(id);
            }
        } catch (e) {
            console.error(`[LogSyncService] Error parsing block for <${tagName}>`, e, "Block:", blockText);
        }
    }

    if (newItems.length > 0) {
      (store as any)[storeKey] = [...localStoreRef, ...newItems].sort((a, b) => (a[idKey] > b[idKey] ? 1 : -1));
      const contentToAppend = newBlockContents.join('\n\n---\n\n');
      await lorebookService.appendToEntry(lorebookEntry, contentToAppend, '\n\n---\n\n');
      notificationService.success(`${lorebookEntry}同步`, `同步了 ${newItems.length} 条新记录。`);
      
      if(onNewLogFound) {
          await onNewLogFound(newItems);
      }
    }
  }

  public async syncLogsFromChat() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    console.log('[LogSyncService] Starting log sync...');

    try {
      const messages = await tavernService.fetchTavernData();
      if (!messages) return;

      await this.processLogs<DiaryFragment>(messages, {
        tagName: '日记片段',
        lorebookEntry: '日记片段',
        storeKey: 'diaryFragments',
        idKey: '序号',
        idParser: (id) => parseInt(id, 10),
      });

      await this.processLogs<DirectorLog>(messages, {
        tagName: '导演场记',
        lorebookEntry: '导演场记',
        storeKey: 'directorLogs',
        idKey: '剧本ID',
      });
      
      await this.processLogs<DiaryEntry>(messages, {
        tagName: '日记',
        lorebookEntry: '日记',
        storeKey: 'diary',
        idKey: '日期',
        onNewLogFound: async (newDiaries) => {
            const datesToArchive = new Set(newDiaries.map(d => d.日期));
            const fragmentContent = await lorebookService.readFromLorebook('日记片段');
            if(!fragmentContent) return;

            const fragments = fragmentContent.split('\n\n---\n\n');
            const fragmentsToArchive = fragments.filter(f => {
                const dateMatch = f.match(/^日期\|(.+)$/m);
                return dateMatch && datesToArchive.has(dateMatch[1].trim());
            });
            const remainingFragments = fragments.filter(f => {
                const dateMatch = f.match(/^日期\|(.+)$/m);
                return !dateMatch || !datesToArchive.has(dateMatch[1].trim());
            });

            if(fragmentsToArchive.length > 0) {
                await lorebookService.appendToEntry('日记片段-禁开', fragmentsToArchive.join('\n\n---\n\n'), '\n\n---\n\n');
                await lorebookService.writeToLorebook('日记片段', remainingFragments.join('\n\n---\n\n'));
                notificationService.info('日记片段存档', `已将 ${fragmentsToArchive.length} 条旧片段移入存档。`);
            }
        }
      });

      await this.processLogs<WeeklyReview>(messages, {
        tagName: '周刊',
        lorebookEntry: '周刊',
        storeKey: 'weeklyReviews',
        idKey: '刊号',
        idParser: (id) => parseInt(id, 10),
      });

    } catch (error) {
      console.error('[LogSyncService] Error during log sync:', error);
    } finally {
      this.isSyncing = false;
      console.log('[LogSyncService] Log sync finished.');
    }
  }
}

export const logSyncService = new LogSyncService();
