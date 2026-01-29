/**
 * @file Lorebook Service
 * This module provides a centralized and abstracted interface for all interactions
 * with the TavernHelper's lorebook/worldbook functionalities.
 */

const LOREBOOK_NAME = '轮回-诸天万界';

/**
 * Reads the content of a specific lorebook entry.
 * @param entryName The name (comment) of the lorebook entry.
 * @returns The content of the entry, or null if not found.
 */
export async function readFromLorebook(entryName: string): Promise<string | null> {
    try {
        const allEntries = await TavernHelper.getLorebookEntries(LOREBOOK_NAME);
        const entry = allEntries.find((e: any) => e.comment === entryName);
        return entry ? entry.content : null;
    } catch (error) {
        console.error(`[Lorebook] Failed to read from entry "${entryName}" in book "${LOREBOOK_NAME}":`, error);
        return null;
    }
}

/**
 * Writes content to a specific lorebook entry, overwriting existing content.
 * @param entryName The name (comment) of the lorebook entry.
 * @param content The content to write.
 */
export async function writeToLorebook(entryName: string, content: string): Promise<void> {
    try {
        const allEntries = await TavernHelper.getLorebookEntries(LOREBOOK_NAME);
        const entry = allEntries.find((e: any) => e.comment === entryName);

        if (entry) {
            await TavernHelper.setLorebookEntries(LOREBOOK_NAME, [{ uid: entry.uid, content }]);
        } else {
            await TavernHelper.createLorebookEntries(LOREBOOK_NAME, [{ comment: entryName, content, keys: [entryName], enabled: true }]);
        }
        console.log(`[Lorebook] Successfully wrote to entry: ${entryName} in book: ${LOREBOOK_NAME}`);
    } catch (error) {
        console.error(`[Lorebook] Failed to write to entry "${entryName}" in book "${LOREBOOK_NAME}":`, error);
        throw error;
    }
}

/**
 * Appends content to a specific lorebook entry by its name.
 * @param entryName The name (comment) of the lorebook entry.
 * @param newContent The new content to append.
 * @param separator The separator to use between old and new content.
 */
export async function appendToLorebook(entryName: string, newContent: string, separator: string = '\n\n'): Promise<void> {
    try {
        const allEntries = await TavernHelper.getLorebookEntries(LOREBOOK_NAME);
        const entry = allEntries.find((e: any) => e.comment === entryName);

        if (entry) {
            const updatedContent = entry.content ? `${entry.content}${separator}${newContent}` : newContent;
            await TavernHelper.setLorebookEntries(LOREBOOK_NAME, [{ uid: entry.uid, content: updatedContent }]);
        } else {
            await TavernHelper.createLorebookEntries(LOREBOOK_NAME, [{ comment: entryName, content: newContent, keys: [entryName], enabled: true }]);
        }
        console.log(`[Lorebook] Successfully appended to entry: ${entryName} in book: ${LOREBOOK_NAME}`);
    } catch (error) {
        console.error(`[Lorebook] Failed to append to entry "${entryName}" in book "${LOREBOOK_NAME}":`, error);
        throw error;
    }
}

/**
 * Appends content to a specific lorebook entry by its index.
 * @param entryIndex The index of the lorebook entry (0-based).
 * @param newContent The new content to append.
 * @param separator The separator to use between old and new content.
 * @param bookName The name of the lorebook.
 */
export async function appendToLorebookByIndex(entryIndex: number, newContent: string, separator: string = '\n\n', bookName: string): Promise<void> {
   try {
       let allEntries = await TavernHelper.getLorebookEntries(bookName);
       
       // 如果条目数量不足，则创建占位条目直到满足索引
       while (allEntries.length <= entryIndex) {
           const placeholder = {
               comment: `占位条目-${allEntries.length}`,
               content: '',
               keys: [`placeholder-${allEntries.length}`],
               enabled: true,
           };
           await TavernHelper.createLorebookEntries(bookName, [placeholder]);
           // 重新获取条目列表以确认创建成功
           allEntries = await TavernHelper.getLorebookEntries(bookName);
       }

       const entry = allEntries[entryIndex];
       const updatedContent = entry.content ? `${entry.content}${separator}${newContent}` : newContent;
       
       // 如果目标条目是占位条目，我们可能希望更新它的comment
       const updatePayload: any = { uid: entry.uid, content: updatedContent };
       if (entry.comment.startsWith('占位条目-') && entryIndex === 18) { // 18是第19个条目的索引
           updatePayload.comment = '诸天万界';
           updatePayload.keys = ['诸天万界'];
       }

       await TavernHelper.setLorebookEntries(bookName, [updatePayload]);
       console.log(`[Lorebook] Successfully appended to entry at index ${entryIndex} in book: ${bookName}`);
   } catch (error) {
       console.error(`[Lorebook] Failed to append to entry at index ${entryIndex} in book "${bookName}":`, error);
       throw error;
   }
}

/**
 * Reads the content of a specific lorebook entry by its index.
 * @param entryIndex The index of the lorebook entry (0-based).
 * @param bookName The name of the lorebook.
 * @returns The content of the entry, or null if not found.
 */
export async function readFromLorebookByIndex(entryIndex: number, bookName: string): Promise<string | null> {
   try {
       const allEntries = await TavernHelper.getLorebookEntries(bookName);
       if (entryIndex < 0 || entryIndex >= allEntries.length) {
           console.warn(`[Lorebook] Entry index ${entryIndex} is out of bounds for book "${bookName}".`);
           return null;
       }
       const entry = allEntries[entryIndex];
       return entry ? entry.content : null;
   } catch (error) {
       console.error(`[Lorebook] Failed to read from entry at index ${entryIndex} in book "${bookName}":`, error);
       return null;
   }
}
