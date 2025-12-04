// @ts-nocheck
const LOREBOOK_NAME = '轮回-诸天万界';
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

export async function readFromLorebook(entryName: string, forceRefresh = false): Promise<string | null> {
  const entries = await getEntries(forceRefresh);
  if (!entries) return null;
  const entry = entries.find((e: any) => e.comment === entryName || e.name === entryName);
  return entry ? entry.content : null;
}

export async function writeToLorebook(
  entryName: string,
  content: string,
  options: { isEnabled: boolean; keys: string[] } = { isEnabled: true, keys: [] },
) {
  const allEntries = await getEntries(true); // Force refresh before writing
  if (!allEntries) return;

  const targetEntry = allEntries.find((e: any) => e.comment === entryName || e.name === entryName);

  try {
    if (targetEntry) {
      await TavernHelper.setLorebookEntries(LOREBOOK_NAME, [
        { uid: targetEntry.uid, content: content, enabled: options.isEnabled },
      ]);
    } else {
      const newEntryData: any = {
        comment: entryName,
        content: content,
        keys: [entryName],
        enabled: options.isEnabled,
        position: 'before_character_definition',
        order: 100,
      };
      await TavernHelper.createLorebookEntries(LOREBOOK_NAME, [newEntryData]);
    }
    entriesCache = null; // Invalidate cache after writing
  } catch (error) {
    console.error(`[LorebookService] 操作条目 "${entryName}" 时出错:`, error);
  }
}
