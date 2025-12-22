import { get } from 'lodash';
import { lorebookService } from './LorebookService';
import { memoryService } from './MemoryService';
import { notificationService } from './NotificationService';
import { serviceLocator } from './service-locator';

/**
 * 解析AI响应文本中的键值对块。
 * @param block - 要解析的文本块。
 * @returns 解析后的键值对对象。
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

class TavernClockService {
  /**
   * 处理AI响应中所有与世界书写入相关的标签。
   * @param fullMessageContent - AI返回的完整消息内容。
   */
  public async processAfterTick(fullMessageContent: string): Promise<void> {
    console.log('[TavernClockService] Processing post-tick lorebook writes...');
    await this.processWorldLog(fullMessageContent);
    await this.processSettlement(fullMessageContent);
    await this.processSummaries(fullMessageContent);
    console.log('[TavernClockService] Post-tick processing complete.');
  }

  /**
   * 解析并处理 <本世历程> 标签。
   */
  private async processWorldLog(content: string): Promise<void> {
    const processLogRegex = /<本世历程>([\s\S]+?)<\/本世历程>/g;
    let match;
    while ((match = processLogRegex.exec(content)) !== null) {
      try {
        const block = parseBlock(match[1]);
        const newLogEntry: any = {
          ...block,
          序号: parseInt(block['序号'], 10),
          标签: block['标签']
            ? block['标签']
                .replace(/[[\]"]/g, '')
                .split(',')
                .map(t => t.trim())
                .filter(t => t)
            : [],
        };

        if (isNaN(newLogEntry.序号)) continue;

        const store = serviceLocator.get('store');
        const isDuplicate = store.worldLog.some((log: any) => log.序号 === newLogEntry.序号);
        if (!isDuplicate) {
          store.worldLog.push(newLogEntry);
          store.worldLog.sort((a: any, b: any) => a.序号 - b.序号);

          const logContentToWrite = Object.entries(newLogEntry)
            .map(([key, value]) => `${key}|${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');

          await lorebookService.appendToEntry('本世历程', logContentToWrite, '\n\n---\n\n');
          console.log(`[TavernClockService] Appended new log (序号: ${newLogEntry.序号}) to "本世历程".`);

          // 在更新日志后立即更新记忆系统
          await memoryService.updateMemory(store.worldLog);
        }
      } catch (error) {
        console.error('[TavernClockService] Error processing <本世历程> block:', error);
      }
    }
  }

  /**
   * 解析并处理 <往世涟漪> 标签。
   */
  private async processSettlement(content: string): Promise<void> {
    const settlementRegex = /<往世涟漪>([\s\S]+?)<\/往世涟漪>/g;
    const match = settlementRegex.exec(content);
    if (match) {
      try {
        const block = parseBlock(match[1]);
        const settlementData = {
          第x世: parseInt(block['第x世'], 10) || 0,
          事件脉络: block['事件脉络'] || '',
          本世概述: block['本世概述'] || '',
          本世成就: block['本世成就'] || '',
          本世获得物品: block['本世获得物品'] || block['本世遗珍'] || '', // 兼容旧字段
          本世人物关系网: block['本世人物关系网'] || block['红尘羁绊'] || '', // 兼容旧字段
          死亡原因: block['死亡原因'] || block['陨落之因'] || '', // 兼容旧字段
          本世总结: block['本世总结'] || block['真我一念'] || '', // 兼容旧字段
          本世评价: block['本世评价'] || block['涟漪余波'] || '', // 兼容旧字段
        };
        const store = serviceLocator.get('store');
        store.settlementData = settlementData;

        const settlementContent = Object.entries(settlementData)
          .map(([key, value]) => `${key}|${value}`)
          .join('\n');

        await lorebookService.writeToLorebook('往世涟漪', settlementContent, { isEnabled: true, keys: ['往世涟漪'] });
        console.log('[TavernClockService] Wrote settlement data to "往世涟漪".');

        // 清空“本世历程”
        await lorebookService.writeToLorebook('本世历程', '', { isEnabled: true, keys: ['本世历程'] });
        store.worldLog = []; // 同时清空前端状态
        console.log('[TavernClockService] Cleared "本世历程" after settlement.');
      } catch (error) {
        console.error('[TavernClockService] Error processing <往世涟漪> block:', error);
      }
    }
  }

  /**
   * 解析并处理摘要标签。
   */
  private async processSummaries(content: string): Promise<void> {
    const mainWorldSummaryRegex = /<主世界摘要>([\s\S]+?)<\/主世界摘要>/g;
    const avatarWorldSummaryRegex = /<化身世界摘要>([\s\S]+?)<\/化身世界摘要>/g;
    let match;

    const processAndWriteSummary = async (summaryContent: string, entryName: string, toastrTitle: string) => {
      const parsed = parseBlock(summaryContent);
      const title = parsed['标题'] || toastrTitle;
      const description = parsed['描述'] || summaryContent;

      const existingSummaries = await lorebookService.readFromLorebook(entryName);
      if (existingSummaries && existingSummaries.includes(description)) {
        console.log(`[TavernClockService] Summary content already exists in "${entryName}". Skipping.`);
        return;
      }

      notificationService.info(title, description);
      const formattedSummary = `标题|${title}\n描述|${description}\n标签|${parsed['标签'] || ''}`;
      await lorebookService.appendToEntry(entryName, formattedSummary, '\n\n---\n\n');
    };

    if ((match = mainWorldSummaryRegex.exec(content)) !== null) {
      await processAndWriteSummary(match[1].trim(), '[系统]主世界摘要', '主世界动态');
    }
    if ((match = avatarWorldSummaryRegex.exec(content)) !== null) {
      await processAndWriteSummary(match[1].trim(), '[系统]化身世界摘要', '化身世界动态');
    }
  }
}

export const tavernClockService = new TavernClockService();
export { TavernClockService };
