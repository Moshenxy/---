// 声明全局 TavernHelper API
declare const TavernHelper: any;

const LOREBOOK_NAME = '综漫-春物';
let entriesCache: any[] | null = null;

async function getEntries(forceRefresh = false) {
  if (entriesCache && !forceRefresh) {
    return entriesCache;
  }
  try {
    const entries = await TavernHelper.getLorebookEntries(LOREBOOK_NAME);
    if (!entries) {
      console.error(`[LorebookService] 无法获取名为 "${LOREBOOK_NAME}" 的世界书的条目，或该世界书不存在。`);
      entriesCache = null;
      return null;
    }
    entriesCache = entries;
    return entries;
  } catch (error) {
    console.error(`[LorebookService] 调用 getLorebookEntries 时出错:`, error);
    return null;
  }
}

function findEntryByComment(comment: string): any | null {
  if (!entriesCache) {
    console.warn('[LorebookService] findEntryByComment called before cache was populated.');
    return null;
  }
  return entriesCache.find((e: any) => e.comment === comment) || null;
}

async function readFromLorebook(entryName: string, forceRefresh = false): Promise<string | null> {
  const entries = await getEntries(forceRefresh);
  if (!entries) return null;
  const entry = entries.find((e: any) => e.comment === entryName || e.name === entryName);
  return entry ? entry.content : null;
}

async function writeToLorebook(
  entryName: string,
  content: string,
  options: { isEnabled: boolean; keys: string[] } = { isEnabled: true, keys: [] },
) {
  console.log(`[Roo Debug] Lorebook: Preparing to write/create entry: "${entryName}".`);
  const allEntries = await getEntries();
  if (!allEntries) return;

  const targetEntry = allEntries.find((e: any) => e.comment === entryName || e.name === entryName);

  try {
    if (targetEntry) {
      // --- 更新逻辑 ---
      console.log(`[Roo Debug] Lorebook: Entry "${entryName}" exists. Updating with setLorebookEntries.`);
      await TavernHelper.setLorebookEntries(LOREBOOK_NAME, [
        { uid: targetEntry.uid, content: content, enabled: options.isEnabled },
      ]);
    } else {
      // --- 创建逻辑 (严格参考 UpdateVariable5.html) ---
      console.log(`[Roo Debug] Lorebook: Entry "${entryName}" does not exist. Creating with createLorebookEntries.`);

      const baseKey = entryName.replace(/\(\d+\)$/, '');
      const baseEntryTemplate = allEntries.find((entry: any) => entry.comment === baseKey || entry.name === baseKey);

      // 构建一个最基础、最安全的对象
      const newEntryData: any = {
        comment: entryName,
        content: content,
        keys: [entryName],
        enabled: options.isEnabled,
        position: 'before_character_definition',
        order: 100,
      };

      // 如果找到模板，则继承模板的属性，这是成功的关键
      if (baseEntryTemplate) {
        Object.assign(newEntryData, {
          keys: [...(baseEntryTemplate.keys || []), entryName],
          selective: baseEntryTemplate.selective,
          constant: baseEntryTemplate.constant,
          position: baseEntryTemplate.position,
          order: baseEntryTemplate.order,
          case_sensitive: baseEntryTemplate.case_sensitive,
        });
      }

      console.log(
        `[Roo Debug] Lorebook: Calling createLorebookEntries for "${entryName}" with payload:`,
        JSON.stringify(newEntryData),
      );
      await TavernHelper.createLorebookEntries(LOREBOOK_NAME, [newEntryData]);
    }
    console.log(`[LorebookService] API call for "${entryName}" completed successfully.`);
    entriesCache = null; // 关键：操作完成后清除缓存
  } catch (error) {
    console.error(`[LorebookService] 操作条目 "${entryName}" 时出错:`, error);
  }
}

async function appendToEntry(entryName: string, newContent: string, separator = '\n\n---\n\n'): Promise<void> {
  console.log(`[Roo Debug] Lorebook: Appending to entry "${entryName}".`);
  try {
    const existingContent = await readFromLorebook(entryName);
    const content = existingContent ? `${existingContent}${separator}${newContent}` : newContent;
    // `writeToLorebook` 现在能正确处理创建和更新
    await writeToLorebook(entryName, content);
  } catch (error) {
    console.error(`[LorebookService] 追加内容到条目 "${entryName}" 时出错:`, error);
  }
}

import { parseWorldLoreForMap } from '../modules/world-map/services/WorldMapParser';
import type { Epoch, WorldDefinition } from '../types/world';

async function loadAndParseWorldData(worldName = '主世界'): Promise<Epoch | null> {
  try {
    const content = await readFromLorebook(worldName);
    if (!content) {
      console.warn(`[LorebookService] 未能读取到名为 "${worldName}" 的世界书条目内容。`);
      return null;
    }

    const worldData = parseWorldLoreForMap(content) as WorldDefinition | null;

    if (worldData && worldData.历史纪元 && worldData.元规则) {
      // 优先使用当前纪元ID
      const currentEpochId = worldData.元规则.当前纪元ID;
      if (currentEpochId && worldData.历史纪元[currentEpochId]) {
        return worldData.历史纪元[currentEpochId];
      }
      // 降级方案：返回第一个可扮演的纪元
      const firstPlayableEpoch = Object.values(worldData.历史纪元).find(epoch => epoch.可扮演);
      if (firstPlayableEpoch) {
        return firstPlayableEpoch;
      }
    }

    console.warn(`[LorebookService] 在 "${worldName}" 的世界数据中未能找到激活的纪元信息。`);
    return null;
  } catch (error) {
    console.error(`[LorebookService] 解析世界数据 "${worldName}" 时出错:`, error);
    return null;
  }
}

export const lorebookService = {
  getEntries,
  readFromLorebook,
  writeToLorebook,
  appendToEntry,
  findEntryByComment,
  setEntryEnabled,
  loadAndParseWorldData, // 导出新方法
};

async function setEntryEnabled(entryName: string, isEnabled: boolean): Promise<void> {
  console.log(`[LorebookService] Setting entry "${entryName}" enabled status to: ${isEnabled}`);
  try {
    const allEntries = await getEntries();
    if (!allEntries) return;

    const targetEntry = allEntries.find((e: any) => e.comment === entryName || e.name === entryName);

    if (targetEntry) {
      // [PATCH] 必须传递完整的条目对象，否则会丢失其他属性
      const updatedEntry = { ...targetEntry, enabled: isEnabled };
      await TavernHelper.setLorebookEntries(LOREBOOK_NAME, [updatedEntry]);
      console.log(`[LorebookService] Successfully set "${entryName}" enabled=${isEnabled}.`);
    } else {
      // 如果条目不存在，可以选择创建一个禁用的条目作为占位符，或直接忽略
      console.warn(`[LorebookService] setEntryEnabled: Entry "${entryName}" not found. Skipping.`);
    }
  } catch (error) {
    console.error(`[LorebookService] 操作条目 "${entryName}" 启用状态时出错:`, error);
  }
}
