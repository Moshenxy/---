import { eventBus } from './EventBus';
import { lorebookService } from './LorebookService';
import type { WorldLogEntry } from '../types';

class MemoryService {
  private readonly INSTANT_MEMORY_KEY = '[系统]瞬时记忆';
  private readonly SHORT_TERM_MEMORY_KEY = '[系统]短期记忆';
  private readonly LONG_TERM_MEMORY_KEY = '[系统]长期记忆';

  private config = {
    instantMemoryCount: 15,
    shortTermMemoryCount: 30,
    longTermMemoryCount: 60,
  };

  public async updateMemory(worldLog: WorldLogEntry[]): Promise<void> {
    console.log('[MemoryService] Updating all memory tiers for Oregairu-verse...');
    try {
      await this.updateInstantMemory(worldLog);
      await this.updateShortTermMemory(worldLog);
      await this.updateLongTermMemory(worldLog);
      console.log('[MemoryService] All memory tiers updated successfully.');
      eventBus.emit('memoryUpdated');
    } catch (error) {
      console.error('[MemoryService] Failed to update memory tiers:', error);
    }
  }

  public async updateInstantMemory(worldLog: WorldLogEntry[]): Promise<void> {
    const logs = worldLog.slice(-this.config.instantMemoryCount);
    if (logs.length === 0) {
      await this.writeMemory(this.INSTANT_MEMORY_KEY, '暂无瞬时记忆。');
      return;
    }
  
    const newContent = logs.map(log => {
        return [
          `序号|${log.序号}`,
          `日期|${log.日期}`,
          `标题|${log.标题}`,
          `地点|${log.地点}`,
          `人物|${log.人物}`,
          `描述|${log.描述}`,
          `人物关系|${log.人物关系 || '无'}`,
          `重要信息|${log.重要信息 || '无'}`,
          `暗线与伏笔|${log.暗线与伏笔 || '无'}`,
          `自动化系统|${log.自动化系统 || '无'}`,
        ].join('\n');
      }).join('\n\n---\n\n');
  
    await this.writeMemory(this.INSTANT_MEMORY_KEY, newContent.trim());
    console.log('[MemoryService] Instant memory updated.');
  }

  public async updateShortTermMemory(worldLog: WorldLogEntry[]): Promise<void> {
    const logs = worldLog.slice(-this.config.shortTermMemoryCount);
    if (logs.length === 0) {
      await this.writeMemory(this.SHORT_TERM_MEMORY_KEY, '暂无短期记忆。');
      return;
    }

    const newContent = logs.map(log => {
        const coreInteraction = log.重要信息?.match(/【核心互动】(.*?)(【|$)/)?.[1] || '无';
        const relationChange = log.重要信息?.match(/【关系变动】(.*?)(【|$)/)?.[1] || '无';
        return [
          `日期|${log.日期}`,
          `地点|${log.地点}`,
          `人物|${log.人物}`,
          `描述|${log.描述}`,
          `核心互动|${coreInteraction}`,
          `关系变动|${relationChange}`,
        ].join('\n');
      }).join('\n\n---\n\n');

    await this.writeMemory(this.SHORT_TERM_MEMORY_KEY, newContent.trim());
    console.log('[MemoryService] Short-term memory updated.');
  }

  public async updateLongTermMemory(worldLog: WorldLogEntry[]): Promise<void> {
    const logs = worldLog.slice(-this.config.longTermMemoryCount);
    if (logs.length === 0) {
      await this.writeMemory(this.LONG_TERM_MEMORY_KEY, '暂无长期记忆。');
      return;
    }

    const newContent = logs.map(log => {
      const coreConflict = log.重要信息?.match(/【核心冲突】(.*?)(【|$)/)?.[1] || '无';
      return [
        `日期|${log.日期}`,
        `描述|${log.描述}`,
        `核心冲突|${coreConflict}`,
      ].join('\n');
    }).join('\n\n---\n\n');

    await this.writeMemory(this.LONG_TERM_MEMORY_KEY, newContent.trim());
    console.log('[MemoryService] Long-term memory updated.');
  }

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
    console.log('[MemoryService] Config updated:', this.config);
  }
}

export const memoryService = new MemoryService();
