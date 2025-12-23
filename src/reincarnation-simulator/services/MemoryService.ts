import { lorebookService } from './LorebookService';
import type { WorldLogEntry } from '../types';
import { eventBus } from './EventBus';

class MemoryService {
  private readonly INSTANT_MEMORY_KEY = '[系统]瞬时记忆';
  private readonly SHORT_TERM_MEMORY_KEY = '[系统]短期记忆';
  private readonly LONG_TERM_MEMORY_KEY = '[系统]长期记忆';

  // 可配置的参数
  private config = {
    instantMemoryCount: 15,
    shortTermMemoryCount: 30, // 优化上下文长度
    longTermMemoryCount: 60, // 优化上下文长度
  };

  /**
   * 更新所有层级的记忆
   */
  public async updateMemory(worldLog: WorldLogEntry[]): Promise<void> {
    console.log('[MemoryService] Updating all memory tiers...');
    try {
      // 改为串行调用以避免竞态条件
      await this.updateInstantMemory(worldLog);
      await this.updateShortTermMemory(worldLog);
      await this.updateLongTermMemory(worldLog);
      console.log('[MemoryService] All memory tiers updated successfully.');
      eventBus.emit('memory-updated'); // 发出事件通知UI更新
    } catch (error) {
      console.error('[MemoryService] Failed to update memory tiers:', error);
    }
  }

  /**
   * 更新瞬时记忆 (正文)
   */
  private async updateInstantMemory(worldLog: WorldLogEntry[]): Promise<void> {
    const logs = worldLog.slice(-this.config.instantMemoryCount);
    if (logs.length === 0) {
      await this.writeMemory(this.INSTANT_MEMORY_KEY, '暂无瞬时记忆。');
      return;
    }
    
    const content = logs.map(log => {
      // 确保所有字段都以 key|value 的形式正确格式化
      return [
        `序号|${log.序号}`,
        `日期|${log.日期}`,
        `标题|${log.标题}`,
        `地点|${log.地点}`,
        `人物|${log.人物}`,
        `描述|${log.描述}`,
        `人物关系|${log.人物关系}`,
        `标签|${Array.isArray(log.标签) ? log.标签.join(', ') : log.标签}`,
        `重要信息|${log.重要信息}`,
        `暗线与伏笔|${log.暗线与伏笔}`,
        `自动化系统|${log.自动化系统}`
      ].join('\n');
    }).join('\n\n---\n\n');

    await this.writeMemory(this.INSTANT_MEMORY_KEY, content.trim());
  }

  /**
   * 更新短期记忆 (小总结)
   */
  private async updateShortTermMemory(worldLog: WorldLogEntry[]): Promise<void> {
    const logs = worldLog.slice(-this.config.shortTermMemoryCount);
    if (logs.length === 0) {
      await this.writeMemory(this.SHORT_TERM_MEMORY_KEY, '暂无短期记忆。');
      return;
    }

    const content = logs.map(log => {
      // 短期记忆：提取核心信息，保持key|value结构
      return [
        `序号|${log.序号}`,
        `日期|${log.日期}`,
        `标题|${log.标题}`,
        `人物|${log.人物}`,
        `描述|${log.描述}`
      ].join('\n');
    }).join('\n\n---\n\n');

    await this.writeMemory(this.SHORT_TERM_MEMORY_KEY, content.trim());
  }

  /**
   * 更新长期记忆 (大总结)
   */
  private async updateLongTermMemory(worldLog: WorldLogEntry[]): Promise<void> {
    const logs = worldLog.slice(-this.config.longTermMemoryCount);
    if (logs.length === 0) {
      await this.writeMemory(this.LONG_TERM_MEMORY_KEY, '暂无长期记忆。');
      return;
    }

    const content = logs.map(log => `[${log.日期}] ${log.标题}: ${log.描述}`).join('\n');

    await this.writeMemory(this.LONG_TERM_MEMORY_KEY, content);
  }

  /**
   * 写入世界书条目，并确保其被激活
   * @param key 条目名
   * @param content 内容
   */
  private async writeMemory(key: string, content: string): Promise<void> {
    await lorebookService.writeToLorebook(key, content, {
      isEnabled: true,
      keys: [key],
    });
  }

  public getConfig() {
    return this.config;
  }

  public setConfig(newConfig: Partial<typeof this.config>) {
    this.config = { ...this.config, ...newConfig };
    // 可以在这里添加保存到localStorage的逻辑
    console.log('[MemoryService] Config updated:', this.config);
  }
}

export const memoryService = new MemoryService();
