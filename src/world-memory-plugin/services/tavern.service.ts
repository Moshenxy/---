import type { EpisodicMemoryUnit, SynthesisEntry, Nature, NatureTrait, Cognition, CognitiveStatement } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../utils/logger';
import { NatureSchema, CognitionSchema, EpisodicMemoryUnitSchema } from '../types';

// A helper type for deep partial objects
type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

// Define the structure for memory creation arguments
export interface MemoryCreationData {
  type: 'nature' | 'cognition' | 'episodic';
  subject?: string;
  content: string | EpisodicMemoryUnit;
  keywords?: string[];
  supportingMemories?: string[];
}

/**
 * @file tavern.service.ts
 * @description 封装所有与酒馆世界书的 API 交互。
 */
export class TavernService {
  public static async getTargetWorldbookName(): Promise<string> {
    try {
      const charBooks = await getCharWorldbookNames('current');
      if (charBooks?.primary) return charBooks.primary;
      return await getOrCreateChatWorldbook('current', '[AI]聊天记忆库');
    } catch (error) {
      const fallbackBook = '默认记忆世界书';
      const worldbooks = await getWorldbookNames();
      if (!worldbooks.includes(fallbackBook)) await createWorldbook(fallbackBook);
      return fallbackBook;
    }
  }

  public static async findNatureEntry(): Promise<WorldbookEntry | null> {
    try {
      const worldbookName = await this.getTargetWorldbookName();
      const book = await getWorldbook(worldbookName);
      return book?.find(e => e.name?.startsWith('本性-')) ?? null;
    } catch (error) {
      return null;
    }
  }

  public static getCharacterContext() {
    const char = getCharData('current');
    if (!char) return null;
    return {
      name: char.name,
      description: char.description,
      personality: char.personality,
      scenario: char.scenario,
    };
  }

  public static async getRecentMemories(count: number = 10): Promise<EpisodicMemoryUnit[]> {
    try {
      const worldbookName = await this.getTargetWorldbookName();
      const book = await getWorldbook(worldbookName);
      if (!book) return [];
      return book
        .filter(entry => entry.name?.startsWith('记忆-') && entry.extra?.memoryData?.timestamp)
        .sort(
          (a, b) =>
            new Date(b.extra?.memoryData?.timestamp ?? 0).getTime() -
            new Date(a.extra?.memoryData?.timestamp ?? 0).getTime(),
        )
        .slice(0, count)
        .map(entry => entry.extra!.memoryData as EpisodicMemoryUnit);
    } catch (error) {
      return [];
    }
  }

  public static async getEpisodicEntries(): Promise<WorldbookEntry[]> {
    try {
      const worldbookName = await this.getTargetWorldbookName();
      const book = await getWorldbook(worldbookName);
      if (!book) return [];
      return book.filter(entry => entry.name?.startsWith('记忆-'));
    } catch (error) {
      console.error('[TavernService] 获取情景记忆条目时出错:', error);
      return [];
    }
  }

  public static async getCognitionEntries(): Promise<WorldbookEntry[]> {
    try {
      const worldbookName = await this.getTargetWorldbookName();
      const book = await getWorldbook(worldbookName);
      if (!book) return [];
      return book.filter(entry => entry.name?.startsWith('认知-'));
    } catch (error) {
      return [];
    }
  }
  public static async getNature(): Promise<Nature | null> {
    const natureEntry = await this.findNatureEntry();
    if (!natureEntry || !natureEntry.content) return null;
    try {
      return NatureSchema.parse(JSON.parse(natureEntry.content));
    } catch (error) {
      console.error('[TavernService] 解析本性条目失败:', error);
      return null;
    }
  }

  public static async getAllCognitions(): Promise<Cognition> {
    const cognitionEntries = await this.getCognitionEntries();
    let allCognitions: Cognition = [];
    for (const entry of cognitionEntries) {
      if (!entry.content) continue;
      try {
        const cognition = CognitionSchema.parse(JSON.parse(entry.content));
        allCognitions = allCognitions.concat(cognition);
      } catch (error) {
        console.error(`[TavernService] 解析认知条目 "${entry.name}" 失败:`, error);
      }
    }
    return allCognitions;
  }

  private static async deleteEntries(predicate: (entry: WorldbookEntry) => boolean): Promise<number> {
    try {
      const worldbookName = await this.getTargetWorldbookName();
      const { deleted_entries } = await deleteWorldbookEntries(worldbookName, predicate);
      log(`从 ${worldbookName} 中删除了 ${deleted_entries.length} 个条目。`);
      return deleted_entries.length;
    } catch (error) {
      toastr.error('删除条目失败。');
      return 0;
    }
  }

  public static async deleteNatureEntries() {
    return this.deleteEntries(e => e.name?.startsWith('本性-'));
  }
  public static async deleteCognitionEntries() {
    return this.deleteEntries(e => e.name?.startsWith('认知-'));
  }
  public static async deleteEpisodicEntries() {
    return this.deleteEntries(e => e.name?.startsWith('记忆-'));
  }
  public static async deleteAllMemoryEntries() {
    const count = await this.deleteEntries(e => ['本性-', '认知-', '记忆-'].some(prefix => e.name?.startsWith(prefix)));
    if (count > 0) toastr.success(`成功删除了 ${count} 个记忆相关条目！`);
    else toastr.info('没有找到可删除的记忆条目。');
  }

  public static async deleteMemoriesByNames(names: string[]): Promise<number> {
    if (names.length === 0) return 0;
    const nameSet = new Set(names);
    return this.deleteEntries(e => (e.name ? nameSet.has(e.name) : false));
  }

  public static async batchSaveFromSynthesis(synthesisResult: SynthesisEntry[]): Promise<void> {
    const worldbookName = await this.getTargetWorldbookName();
    const placeholderMap = new Map<string, string>();
    const book = await getWorldbook(worldbookName);

    const episodicEntriesToCreate: PartialDeep<WorldbookEntry>[] = [];
    for (const item of synthesisResult.filter(i => i.type === 'episodic')) {
      if (!item.memory_data || !item.placeholder_id) continue;
      const entryName = `记忆-${item.memory_data.id.substring(4, 12)}`;
      placeholderMap.set(item.placeholder_id, entryName);
      if (book.find(e => e.name === entryName)) continue;
      episodicEntriesToCreate.push({
        name: entryName,
        content: JSON.stringify(item.memory_data, null, 2),
        strategy: { type: 'selective', keys: item.memory_data.summary.keywords },
        position: { type: 'before_character_definition', order: 0 },
        enabled: true,
        extra: { createdBy: 'WorldMemoryPlugin_Synthesis', memoryData: item.memory_data },
      });
    }

    if (episodicEntriesToCreate.length > 0) {
      await createWorldbookEntries(worldbookName, episodicEntriesToCreate);
    }

    const natureItems = synthesisResult.filter(item => item.type === 'nature');
    if (natureItems.length > 0) {
      const charName = getCharData('current')?.name ?? 'default';
      const newTraits = natureItems.map(item => ({
        id: `nature-${Math.random().toString(36).substring(2, 9)}`,
        trait: item.content ?? '',
        description: item.content ?? '',
        evolution: [],
        supporting_memories: item.supporting_memories?.map(id => placeholderMap.get(id)!).filter(Boolean) ?? [],
      }));
      await this.createOrUpdateNatureEntry(worldbookName, charName, newTraits);
    }

    for (const item of synthesisResult.filter(i => i.type === 'cognition')) {
      const realSupportingMemories = item.supporting_memories?.map(id => placeholderMap.get(id)!).filter(Boolean) ?? [];
      await this.createOrUpdateCognitionEntry(
        worldbookName,
        item.subject!,
        item.content!,
        item.keywords,
        realSupportingMemories,
      );
    }
    toastr.success('人格创生完成！');
  }

  public static async saveMemory(data: MemoryCreationData): Promise<void> {
    const worldbookName = await this.getTargetWorldbookName();
    if (data.type === 'episodic') {
      return this.createEpisodicMemory(worldbookName, data.content as EpisodicMemoryUnit);
    }
  }

  private static async createEpisodicMemory(worldbookName: string, memory: EpisodicMemoryUnit): Promise<void> {
    const entryName = `记忆-${memory.id.substring(4, 12)}`;
    const book = await getWorldbook(worldbookName);
    if (book.find(e => e.name === entryName)) {
      return;
    }
    await createWorldbookEntries(worldbookName, [
      {
        name: entryName,
        content: JSON.stringify(memory, null, 2),
        strategy: { type: 'selective', keys: memory.summary.keywords },
        position: { type: 'before_character_definition', order: 0 },
        enabled: true,
        extra: { createdBy: 'WorldMemoryPluginV2', memoryData: memory },
      },
    ]);
  }

  private static async createOrUpdateCognitionEntry(
    worldbookName: string,
    subject: string,
    statement: string,
    keywords: string[] = [],
    supportingMemories: string[] = [],
  ): Promise<void> {
    const entryName = `认知-${subject}`;

    // 尝试获取游戏内时间，如果失败则使用现实时间
    let gameTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
    try {
      if (typeof replaceVariables === 'function') {
        // 构造一个对象，让 replaceVariables 替换其中的宏
        const timeObj = { time: '{{date}} {{time}}' };
        replaceVariables(timeObj, { type: 'script' });

        // 如果替换后的值与原宏不同，说明宏生效了
        if (timeObj.time && timeObj.time !== '{{date}} {{time}}') {
          gameTime = timeObj.time;
        }
      }
    } catch (e) {
      log('[TavernService] 获取游戏内时间失败，回退到现实时间。', e);
    }

    const newStatement: CognitiveStatement = {
      id: uuidv4(),
      timestamp: gameTime,
      statement,
      supporting_memories: supportingMemories,
    };

    await updateWorldbookWith(worldbookName, entries => {
      const entryIndex = entries.findIndex(e => e.name === entryName);

      if (entryIndex > -1) {
        const entryToUpdate = entries[entryIndex];
        let currentCognition: Cognition = [];
        try {
          // 尝试解析现有的认知数组
          currentCognition = CognitionSchema.parse(JSON.parse(entryToUpdate.content || '[]'));
        } catch (e) {
          log(`[TavernService] 解析认知条目 "${entryName}" 失败，将创建新的数组。`, e);
          currentCognition = [];
        }

        // TODO: 在未来实现相似度检查和合并逻辑
        // 目前，我们仍然只是追加
        currentCognition.push(newStatement);

        entryToUpdate.content = JSON.stringify(currentCognition, null, 2);

        // 更新关键词 (虽然是常驻，但保留关键词作为元数据)
        if (entryToUpdate.strategy) {
          const existingKeywords = entryToUpdate.strategy.keys ?? [];
          entryToUpdate.strategy.keys = [...new Set([...existingKeywords, ...keywords])];
          // 确保策略是常驻
          entryToUpdate.strategy.type = 'constant';
        }

        entries[entryIndex] = entryToUpdate;
      } else {
        // 如果条目不存在，则创建一个新的
        const newEntry: PartialDeep<WorldbookEntry> = {
          name: entryName,
          content: JSON.stringify([newStatement], null, 2),
          strategy: { type: 'constant', keys: keywords } as any, // 改为常驻
          position: { type: 'before_character_definition', order: 10 },
          enabled: true,
          extra: { createdBy: 'WorldMemoryPlugin' },
        };
        entries.push(newEntry as WorldbookEntry);
      }
      return entries;
    });
    log(`[TavernService] 已更新认知条目: "${entryName}"`);
  }

  private static async createOrUpdateNatureEntry(
    worldbookName: string,
    characterName: string,
    newOrUpdatedTraits: NatureTrait[],
  ): Promise<void> {
    const entryName = `本性-${characterName}`;

    await updateWorldbookWith(worldbookName, entries => {
      const entryIndex = entries.findIndex(e => e.name === entryName);

      if (entryIndex > -1) {
        const entryToUpdate = entries[entryIndex];
        let currentNature: Nature = [];
        try {
          currentNature = NatureSchema.parse(JSON.parse(entryToUpdate.content || '[]'));
        } catch (e) {
          log(`[TavernService] 解析本性条目 "${entryName}" 失败，将创建新的数组。`, e);
          currentNature = [];
        }

        for (const trait of newOrUpdatedTraits) {
          const existingTraitIndex = currentNature.findIndex(t => t.id === trait.id);
          if (existingTraitIndex > -1) {
            // Update existing trait (e.g., add to evolution history)
            currentNature[existingTraitIndex] = trait;
          } else {
            // Add new trait
            currentNature.push(trait);
          }
        }

        entryToUpdate.content = JSON.stringify(currentNature, null, 2);
        entries[entryIndex] = entryToUpdate;
      } else {
        const newEntry: PartialDeep<WorldbookEntry> = {
          name: entryName,
          content: JSON.stringify(newOrUpdatedTraits, null, 2),
          strategy: { type: 'constant' },
          position: { type: 'at_depth', depth: 0, role: 'system', order: -1 },
          enabled: true,
          extra: { createdBy: 'WorldMemoryPlugin' },
        };
        entries.push(newEntry as WorldbookEntry);
      }
      return entries;
    });
    log(`[TavernService] 已更新本性条目: "${entryName}"`);
  }

  public static async updateMemoryContent(
    nodeId: string,
    nodeType: 'NATURE' | 'COGNITION' | 'MEMORY',
    parentEntryName: string,
    payload: { [key: string]: any },
  ): Promise<void> {
    const worldbookName = await this.getTargetWorldbookName();
    let entryName = parentEntryName;

    if (nodeType === 'MEMORY') {
      entryName = nodeId;
    }

    await updateWorldbookWith(worldbookName, entries => {
      const entryToUpdate = entries.find(e => e.name === entryName);
      if (!entryToUpdate) {
        console.error(`[TavernService] 无法找到用于更新的条目: ${entryName}`);
        return entries;
      }

      try {
        if (nodeType === 'NATURE') {
          const nature = NatureSchema.parse(JSON.parse(entryToUpdate.content || '[]'));
          const traitIndex = nature.findIndex(t => `nature-${t.id}` === nodeId);
          if (traitIndex > -1) {
            nature[traitIndex] = { ...nature[traitIndex], ...payload };
            entryToUpdate.content = JSON.stringify(nature, null, 2);
          }
        } else if (nodeType === 'COGNITION') {
          const cognition = CognitionSchema.parse(JSON.parse(entryToUpdate.content || '[]'));
          const statementIndex = cognition.findIndex(s => `cognition-${s.id}` === nodeId);
          if (statementIndex > -1) {
            cognition[statementIndex] = { ...cognition[statementIndex], ...payload };
            entryToUpdate.content = JSON.stringify(cognition, null, 2);
          }
        } else if (nodeType === 'MEMORY') {
          const memory = EpisodicMemoryUnitSchema.parse(JSON.parse(entryToUpdate.content || '{}'));

          if (payload.summary_text !== undefined) {
            memory.summary.text = payload.summary_text;
          }
          if (payload.keywords !== undefined) {
            memory.summary.keywords = payload.keywords;
          }
          if (payload.visual !== undefined) {
            memory.flashbulb_fragments.visual = payload.visual;
          }
          if (payload.auditory !== undefined) {
            memory.flashbulb_fragments.auditory = payload.auditory;
          }
          if (payload.somatic !== undefined) {
            memory.flashbulb_fragments.somatic = payload.somatic;
          }

          entryToUpdate.content = JSON.stringify(memory, null, 2);
        }
      } catch (error) {
        console.error(`[TavernService] 更新条目 "${entryName}" 内容时出错:`, error);
      }

      return entries;
    });

    log(`[TavernService] 已更新条目内容: "${entryName}"`);
  }
}
