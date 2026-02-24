import { eventBus } from './EventBus';
import { lorebookService } from './LorebookService';

class MemoryService {
  private readonly INSTANT_MEMORY_KEY = '[系统]瞬时记忆';
  private readonly SHORT_TERM_MEMORY_KEY = '[系统]短期记忆';
  private readonly LONG_TERM_MEMORY_KEY = '[系统]长期记忆';
  private readonly DIRECTOR_LOG_KEY = '导演场记';

  // UI配置将通过setConfig注入，这里只保留默认值
  private config = {
    instantMemoryCount: 10,
    shortTermMemoryCount: 20,
    longTermMemoryCount: 40,
  };

  /**
   * (新) 处理导演场记，将其拆分并存入不同的记忆层级。
   */
  public async processDirectorLog(): Promise<void> {
    console.log('[MemoryService V3] Processing Director Log...');
    try {
      const rawLogContent = await lorebookService.readFromLorebook(this.DIRECTOR_LOG_KEY, true);

      if (!rawLogContent) {
        console.warn('[MemoryService V3] Director Log is empty. No new memory entries to add.');
        return;
      }

      // Split the log by "剧本ID|" to handle multiple appended entries and get the latest one.
      const logEntries = rawLogContent.split(/(?=剧本ID\|)/).filter(entry => entry.trim() !== '');
      const directorLogContent = logEntries.length > 0 ? logEntries[logEntries.length - 1] : '';

      if (!directorLogContent) {
        console.warn(
          '[MemoryService V3] Processed Director Log content is empty after filtering. No new memory entries to add.',
        );
        return;
      }

      const instantContent = this._formatInstantContent(directorLogContent);
      const shortTermContent = this._formatShortTermContent(directorLogContent);
      const longTermContent = this._formatLongTermContent(directorLogContent);

      await this._updateMemoryTier(this.INSTANT_MEMORY_KEY, instantContent, this.config.instantMemoryCount);
      await this._updateMemoryTier(this.SHORT_TERM_MEMORY_KEY, shortTermContent, this.config.shortTermMemoryCount);
      await this._updateMemoryTier(this.LONG_TERM_MEMORY_KEY, longTermContent, this.config.longTermMemoryCount);

      console.log('[MemoryService V3] Director Log processed and memory tiers updated.');
      eventBus.emit('memoryUpdated');
    } catch (error) {
      console.error('[MemoryService V3] Failed to process Director Log:', error);
    }
  }

  /**
   * (新) 提取导演场记中指定区块的内容
   */
  private _extractSection(content: string, sectionName: string): string {
    const regex = new RegExp(`【${sectionName}】([\\s\\S]*?)(?=\\n【|$)`);
    const match = content.match(regex);
    return match && match[1] ? match[1].trim() : '无';
  }

  /**
   * (新) 格式化瞬时记忆内容
   */
  private _formatInstantContent(logContent: string): string {
    const scriptIdMatch = logContent.match(/^剧本ID\|(.+)/m);
    const scriptIdLine = `剧本ID|${scriptIdMatch ? scriptIdMatch[1].trim() : '未知'}`;
    const anchorContent = `【下回合锚点预告】\n${this._extractSection(logContent, '下回合锚点预告')}`;

    // 根据用户反馈，瞬时记忆需要的是“世界线变动记录”的全部内容，并将其整体作为“关键情节完成度”。
    const worldLineEditBlockContent = this._extractSection(logContent, '世界线变动记录');
    const progressContent = `【关键情节完成度】\n${worldLineEditBlockContent}`;

    return [scriptIdLine, anchorContent, progressContent].join('\n\n---\n\n').trim();
  }

  /**
   * (新) 格式化短期记忆内容
   */
  private _formatShortTermContent(logContent: string): string {
    const scriptIdMatch = logContent.match(/^剧本ID\|(.+)/m);
    const scriptIdLine = `剧本ID|${scriptIdMatch ? scriptIdMatch[1].trim() : '未知'}`;

    let npcAnalysisText = '无';
    // “NPC表演分析”是“镜头与表演分析”的子项
    const performanceBlock = this._extractSection(logContent, '镜头与表演分析');
    if (performanceBlock !== '无') {
      const npcAnalysisRegex = /NPC表演分析\|([\s\S]*)/;
      const match = performanceBlock.match(npcAnalysisRegex);
      if (match && match[1]) {
        npcAnalysisText = match[1].trim();
      }
    }

    const npcAnalysisContent = `【NPC表演分析】\n${npcAnalysisText}`;
    const bbsContent = `【校园BBS】\n${this._extractSection(logContent, '校园BBS')}`;
    return [scriptIdLine, npcAnalysisContent, bbsContent].join('\n\n---\n\n').trim();
  }

  /**
   * (新) 格式化长期记忆内容
   */
  private _formatLongTermContent(logContent: string): string {
    const scriptIdMatch = logContent.match(/^剧本ID\|(.+)/m);
    const scriptIdLine = `剧本ID|${scriptIdMatch ? scriptIdMatch[1].trim() : '未知'}`;

    // 导演意图是一个键值对，而不是一个区块
    const directorIntentRegex = /导演意图\|([\s\S]*?)(?=\n---|$)/;
    const directorIntentMatch = logContent.match(directorIntentRegex);
    const directorIntentText = directorIntentMatch && directorIntentMatch[1] ? directorIntentMatch[1].trim() : '无';
    const directorIntentContent = `【导演意图】\n${directorIntentText}`;

    // 提取“镜头与表演分析”区块，并移除内部的“NPC表演分析”部分
    let performanceAnalysisText = this._extractSection(logContent, '镜头与表演分析');
    if (performanceAnalysisText !== '无') {
      const npcAnalysisIndex = performanceAnalysisText.indexOf('NPC表演分析|');
      if (npcAnalysisIndex !== -1) {
        performanceAnalysisText = performanceAnalysisText.substring(0, npcAnalysisIndex).trim();
      }
    }
    const performanceAnalysisContent = `【镜头与表演分析】\n${performanceAnalysisText}`;

    const narrativePacingContent = `【叙事节奏掌控】\n${this._extractSection(logContent, '叙事节奏掌控')}`;

    return [scriptIdLine, directorIntentContent, performanceAnalysisContent, narrativePacingContent]
      .join('\n\n---\n\n')
      .trim();
  }

  /**
   * (保留) 写入世界书条目，并确保其被激活
   */
  private async _updateMemoryTier(key: string, newEntry: string, limit: number): Promise<void> {
    const SEPARATOR = '\n\n<--MEMORY_ENTRY_SEPARATOR-->\n\n';
    let existingContent: string | null = '';
    try {
      existingContent = await lorebookService.readFromLorebook(key, true);
    } catch (error) {
      console.log(`[MemoryService V3] Could not read memory tier "${key}", assuming it's new.`);
    }

    let entries: string[] = [];
    if (existingContent && !existingContent.startsWith('暂无')) {
      entries = existingContent.split(SEPARATOR);
    }

    // Prevent duplicate entries
    if (entries.length > 0 && entries[0] === newEntry) {
      console.log(`[MemoryService V3] Skipping update for "${key}" as the new entry is identical to the latest one.`);
      return;
    }

    // Prepend new entry
    entries.unshift(newEntry);

    // Truncate to limit
    const truncatedEntries = entries.slice(0, limit);

    // Join and write back
    const newContent = truncatedEntries.join(SEPARATOR);
    await this.writeMemory(key, newContent);
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
    console.log('[MemoryService V2] Config updated:', this.config);
    this.processDirectorLog();
  }
}

export const memoryService = new MemoryService();
