import { lorebookService } from './LorebookService';

/**
 * @file worldbookUpdater.ts
 * @description (V3 - Smart Indent Text-based) 解析并应用来自AI响应的纯文本世界书更新指令。
 * 该版本采用纯文本操作，并实现了智能缩进调整，以100%保留AI生成格式的同时，完美融入目标文件结构。
 */

/**
 * 获取一行的有效缩进空格数。
 */
function getIndent(line: string): number {
  const match = line.match(/^\s*/);
  return match ? match[0].length : 0;
}

/**
 * 查找一个代码块的结束行号。
 */
function findBlockEnd(lines: string[], startIndex: number, indent: number): number {
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() !== '' && getIndent(line) <= indent) {
      return i;
    }
  }
  return lines.length;
}

/**
 * 查找指定路径在文本行数组中的范围。
 * 这是此服务的核心，它模拟了对YAML结构的遍历，但完全基于文本和缩进。
 */
function findPathRange(
  lines: string[],
  path: string,
): { startIndex: number; endIndex: number; parentIndent: number } | null {
  const pathParts = path.split('.');
  let searchLines = lines;
  let overallOffset = 0;
  let lastFoundIndex = -1;
  let lastIndent = -1;

  for (const part of pathParts) {
    // FIX: Use /([^\[]+)/ to support Unicode characters in array names.
    const arrayMatch = part.match(/([^[]+)\[(.+?)=(.+?)\]/);
    let foundInContext = false;

    if (arrayMatch) {
      const [, arrayName, key, value] = arrayMatch;

      // 1. Find the array's parent block (e.g., '历史纪元:')
      const arrayNameRegex = new RegExp(`^\\s*${arrayName.trim()}:`);
      let arrayNameFound = false;
      for (let i = 0; i < searchLines.length; i++) {
        const line = searchLines[i];
        const currentIndent = getIndent(line);
        if (currentIndent > lastIndent && arrayNameRegex.test(line)) {
          lastIndent = currentIndent;
          lastFoundIndex = overallOffset + i;
          const blockEndIndex = findBlockEnd(lines, lastFoundIndex, lastIndent);
          overallOffset = lastFoundIndex + 1;
          searchLines = lines.slice(overallOffset, blockEndIndex);
          arrayNameFound = true;
          break;
        }
      }
      if (!arrayNameFound) return null;

      // 2. Now, within this block, find the correct list item
      let itemFound = false;
      for (let j = 0; j < searchLines.length; j++) {
        const line = searchLines[j];
        if (line.trim().startsWith('-')) {
          const itemStartIndex = overallOffset + j;
          const itemIndent = getIndent(line);
          const itemEndIndex = findBlockEnd(lines, itemStartIndex, itemIndent);

          // Search for the key-value pair within this specific item's block
          for (let k = itemStartIndex; k < itemEndIndex; k++) {
            const lineInItem = lines[k];
            // Handle key on same line as '-' or on subsequent lines
            const testLine = k === itemStartIndex ? lineInItem.replace(/^\s*-\s*/, '  ') : lineInItem;
            const keyRegex = new RegExp(`^\\s*${key.trim()}:\\s*['"]?${value.trim()}['"]?`);

            if (keyRegex.test(testLine)) {
              // Found the matching item, update context for the next path part
              lastFoundIndex = itemStartIndex;
              lastIndent = itemIndent;
              overallOffset = itemStartIndex + 1;
              searchLines = lines.slice(overallOffset, itemEndIndex);
              itemFound = true;
              break;
            }
          }
        }
        if (itemFound) break;
      }
      foundInContext = itemFound;
      if (!foundInContext) return null;
    } else {
      const partRegex = new RegExp(`^\\s*${part.trim()}:`);
      for (let i = 0; i < searchLines.length; i++) {
        const line = searchLines[i];
        const currentIndent = getIndent(line);

        if (currentIndent > lastIndent && partRegex.test(line)) {
          lastIndent = currentIndent;
          lastFoundIndex = overallOffset + i;
          const blockEndIndex = findBlockEnd(lines, lastFoundIndex, lastIndent);
          overallOffset = lastFoundIndex + 1;
          searchLines = lines.slice(overallOffset, blockEndIndex);
          foundInContext = true;
          break;
        }
      }
      if (!foundInContext) return null;
    }
  }

  if (lastFoundIndex !== -1) {
    const endIndex = findBlockEnd(lines, lastFoundIndex, lastIndent);
    return { startIndex: lastFoundIndex, endIndex, parentIndent: lastIndent };
  }

  return null;
}

/**
 * (核心修复) 应用“添加”指令，并智能调整缩进。
 */
function applyAdd(lines: string[], path: string, contentToAdd: string): string[] {
  const range = findPathRange(lines, path);

  if (!range) {
    console.error(`[WorldUpdateService] ADD: 无法在内容中找到路径: ${path}`);
    return lines;
  }

  const { endIndex, parentIndent } = range;
  const contentLines = contentToAdd.split('\n');
  if (contentLines.length === 0) return lines;

  // 确定目标缩进层级
  // 列表项 `-` 应该在父键的下一级缩进（通常是+2）
  const targetItemIndent = parentIndent + 2;

  // 找到要添加内容的基准缩进
  const firstLineIndex = contentLines.findIndex(l => l.trim() !== '');
  if (firstLineIndex === -1) return lines; // 内容为空
  const contentBaseIndent = getIndent(contentLines[firstLineIndex]);

  // 计算我们需要的缩进偏移量
  const indentShift = targetItemIndent - contentBaseIndent;

  // 应用偏移量到每一行
  const newLines = contentLines.map(line => {
    if (line.trim() === '') return line; // 保留空行
    const originalIndent = getIndent(line);
    const newIndent = Math.max(0, originalIndent + indentShift);
    return ' '.repeat(newIndent) + line.trimStart();
  });

  // 在目标块的末尾插入调整好缩进的新行
  lines.splice(endIndex, 0, ...newLines);
  console.log(`[WorldUpdateService] 成功将内容智能缩进后添加到路径: ${path}`);
  return lines;
}

function applyReplace(lines: string[], path: string, newContent: string): string[] {
  const range = findPathRange(lines, path);
  if (!range) {
    console.error(`[WorldUpdateService] REPLACE: 无法在内容中找到路径: ${path}`);
    return lines;
  }
  const { startIndex, endIndex, parentIndent } = range;
  const contentIndent = parentIndent + 2;

  const contentLines = newContent.split('\n').map(line => ' '.repeat(contentIndent) + line);

  lines.splice(startIndex + 1, endIndex - (startIndex + 1), ...contentLines);
  console.log(`[WorldUpdateService] 成功替换路径内容: ${path}`);
  return lines;
}

function applyRemove(lines: string[], path: string, contentToRemove: string): string[] {
  const range = findPathRange(lines, path);
  if (!range) {
    console.error(`[WorldUpdateService] REMOVE: 无法在内容中找到路径: ${path}`);
    return lines;
  }
  const { startIndex, endIndex } = range;

  const contentToRemoveLines = contentToRemove
    .trim()
    .split('\n')
    .map(l => l.trim());
  const blockToSearchIn = lines.slice(startIndex + 1, endIndex);

  let foundIndexInBlock = -1;

  for (let i = 0; i <= blockToSearchIn.length - contentToRemoveLines.length; i++) {
    let isMatch = true;
    for (let j = 0; j < contentToRemoveLines.length; j++) {
      if (blockToSearchIn[i + j].trim() !== contentToRemoveLines[j]) {
        isMatch = false;
        break;
      }
    }
    if (isMatch) {
      foundIndexInBlock = i;
      break;
    }
  }

  if (foundIndexInBlock !== -1) {
    const removeStartIndex = startIndex + 1 + foundIndexInBlock;
    lines.splice(removeStartIndex, contentToRemoveLines.length);
    console.log(`[WorldUpdateService] 成功从路径中移除内容: ${path}`);
  } else {
    console.warn(`[WorldUpdateService] REMOVE: 在路径 "${path}" 下未找到要移除的内容。`);
  }
  return lines;
}

class WorldUpdateService {
  public async applyModifications(modificationBlock: string, targetEntryName: string): Promise<void> {
    if (!modificationBlock || !targetEntryName) {
      return;
    }

    const currentContent = await lorebookService.readFromLorebook(targetEntryName);
    if (currentContent === null) {
      console.error(`[WorldUpdateService] 读取世界书条目失败: "${targetEntryName}"`);
      return;
    }

    let lines = currentContent.split('\n');
    const originalContent = currentContent;

    const instructions = modificationBlock
      .split(/(?=\n(?:替换 ')|(?=\n(?:添加 到 '))|(?=\n(?:从 '))|^替换 '|^添加 到 '|^从 ')/g)
      .filter(s => s.trim());

    for (const instruction of instructions) {
      const trimmedInstruction = instruction.trim();
      const addMatch = trimmedInstruction.match(/^添加 到 '([^']*)' 内容为:\s*([\s\S]*)/);
      const replaceMatch = trimmedInstruction.match(/^替换 '([^']*)' 内容为:\s*([\s\S]*)/);
      const removeMatch = trimmedInstruction.match(/^从 '([^']*)' 中移除:\s*([\s\S]*)/);

      if (addMatch) {
        const [, path, content] = addMatch;
        const idMatch = content.match(/ID:\s*(\S+)/);
        if (idMatch) {
          const id = idMatch[1];
          const idCheckPattern = new RegExp(`ID:\\s*${id}`);
          if (idCheckPattern.test(originalContent)) {
            console.warn(`[WorldUpdateService] ID "${id}" 已存在，跳过 ADD 防止重复录入。`);
            continue;
          }
        }
        lines = applyAdd(lines, path, content);
      } else if (replaceMatch) {
        const [, path, content] = replaceMatch;
        lines = applyReplace(lines, path, content);
      } else if (removeMatch) {
        const [, path, content] = removeMatch;
        lines = applyRemove(lines, path, content);
      }
    }

    const updatedContent = lines.join('\n');

    if (updatedContent.trim() !== originalContent.trim()) {
      console.log(`[WorldUpdateService] 检测到内容变更，正在写入条目: "${targetEntryName}"`);
      await lorebookService.writeToLorebook(targetEntryName, updatedContent);
    } else {
      console.log(`[WorldUpdateService] 内容无变更，跳过写入操作。`);
    }
  }
}

export const worldUpdateService = new WorldUpdateService();
