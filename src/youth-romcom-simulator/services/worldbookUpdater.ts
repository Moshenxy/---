/**
 * @file worldbookUpdater.ts
 * @description 解析并应用来自AI响应的纯文本世界书更新指令，支持路径自动创建和基于ID的防重。
 */

/**
 * 获取一行的缩进空格数。
 */
function getIndent(line: string): number {
  const match = line.match(/^\s*/);
  return match ? match[0].length : 0;
}

/**
 * 查找路径。这个版本只查找，不创建。
 */
function findPathRange(
  lines: string[],
  path: string,
): { startIndex: number; endIndex: number; parentIndent: number } | null {
  const pathParts = path.split('.');
  let searchContext = { lines, offset: 0 };
  let parentIndent = -1;
  let lastFoundIndex = -1;

  for (const part of pathParts) {
    let found = false;
    // 在当前上下文中查找
    const relativeIndex = searchContext.lines.findIndex(
      line => (parentIndent === -1 || getIndent(line) > parentIndent) && line.trim().startsWith(part + ':'),
    );

    if (relativeIndex !== -1) {
      const absoluteIndex = searchContext.offset + relativeIndex;
      const line = lines[absoluteIndex];
      parentIndent = getIndent(line);
      lastFoundIndex = absoluteIndex;

      const blockEnd = findBlockEnd(lines, absoluteIndex, parentIndent);
      searchContext = {
        lines: lines.slice(absoluteIndex + 1, blockEnd),
        offset: absoluteIndex + 1,
      };
      found = true;
    }

    if (!found) return null;
  }

  if (lastFoundIndex === -1) return null;

  const endIndex = findBlockEnd(lines, lastFoundIndex, parentIndent);
  return { startIndex: lastFoundIndex, endIndex, parentIndent };
}

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
 * 应用“添加”指令，如果路径不存在则自动创建。
 */
function applyAdd(lines: string[], path: string, contentToAdd: string): string[] {
  let range = findPathRange(lines, path);

  // 如果路径不存在，则尝试创建它
  if (!range) {
    console.log(`[worldbookUpdater] ADD: 路径 "${path}" 不存在，尝试创建...`);
    const pathParts = path.split('.');
    let currentPath = '';

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const nextPath = currentPath ? `${currentPath}.${part}` : part;
      if (!findPathRange(lines, nextPath)) {
        const parentRange = currentPath
          ? findPathRange(lines, currentPath)
          : { endIndex: lines.length, parentIndent: -2 };
        if (parentRange) {
          const newKeyIndent = parentRange.parentIndent + 2;
          const newKeyLine = ' '.repeat(newKeyIndent) + part + ':';
          lines.splice(parentRange.endIndex, 0, newKeyLine);
          console.log(`[worldbookUpdater] 已创建缺失的键: "${part}"`);
        } else {
          console.error(`[worldbookUpdater] 无法创建路径，因为父路径 "${currentPath}" 无法定位。`);
          return lines;
        }
      }
      currentPath = nextPath;
    }
    // 创建后重新获取范围
    range = findPathRange(lines, path);
    if (!range) {
      console.error(`[worldbookUpdater] 路径创建失败，无法添加内容。`);
      return lines;
    }
  }

  const { endIndex, parentIndent } = range;
  const targetItemIndent = parentIndent + 2;
  const contentLines = contentToAdd.split('\n');
  if (contentLines.length === 0) return lines;

  const firstLineIndex = contentLines.findIndex(l => l.trim() !== '');
  if (firstLineIndex === -1) return lines;

  const baseContentIndent = getIndent(contentLines[firstLineIndex]);
  const indentShift = targetItemIndent - baseContentIndent;

  const newLines = contentLines.map(line => {
    if (line.trim() === '') return line;
    return ' '.repeat(Math.max(0, getIndent(line) + indentShift)) + line.trimStart();
  });

  lines.splice(endIndex, 0, ...newLines);
  console.log(`[worldbookUpdater] 成功将内容添加到路径: ${path}`);
  return lines;
}

// ... (applyReplace and applyRemove remain the same)
function applyReplace(lines: string[], path: string, newContent: string): string[] {
  const range = findPathRange(lines, path);
  if (!range) {
    console.error(`[worldbookUpdater] REPLACE: 无法在内容中找到路径: ${path}`);
    return lines;
  }
  const { startIndex, endIndex, parentIndent } = range;
  const contentIndent = parentIndent + 2;
  const contentLines = newContent.split('\n').map(line => ' '.repeat(contentIndent) + line);
  lines.splice(startIndex + 1, endIndex - (startIndex + 1), ...contentLines);
  console.log(`[worldbookUpdater] 成功替换路径内容: ${path}`);
  return lines;
}

function applyRemove(lines: string[], path: string, contentToRemove: string): string[] {
  const range = findPathRange(lines, path);
  if (!range) {
    console.error(`[worldbookUpdater] REMOVE: 无法在内容中找到路径: ${path}`);
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
    console.log(`[worldbookUpdater] 成功从路径中移除内容: ${path}`);
  } else {
    console.warn(`[worldbookUpdater] REMOVE: 在路径 "${path}" 下未找到要移除的内容。`);
  }
  return lines;
}

/**
 * 解析并应用更新指令到现有的世界书内容上。
 */
export function applyWorldbookUpdates(existingContent: string, modificationCommands: string): string {
  let lines = existingContent.split('\n');
  const commands = modificationCommands.trim().split(/(?=\n替换 '|\n添加 到 '|\n从 '|^替换 '|^添加 到 '|^从 ')/g);

  for (const command of commands) {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) continue;

    const addMatch = trimmedCommand.match(/^添加 到 '([^']*)' 内容为:/);
    if (addMatch) {
      const path = addMatch[1];
      const contentToAdd = trimmedCommand.substring(addMatch[0].length);

      // 核心修复：基于ID的通用防重机制
      const idMatch = contentToAdd.match(/^\s*-\s*ID:\s*(\S+)/m);
      if (idMatch) {
        const id = idMatch[1];
        const idCheckPattern = new RegExp(`ID:\\s*${id}`);
        if (idCheckPattern.test(existingContent)) {
          console.warn(`[worldbookUpdater] ID "${id}" 已存在，跳过 ADD 防止重复录入。`);
          continue;
        }
      } else if (existingContent.includes(contentToAdd.trim())) {
        // 对没有ID的内容块，保留基于文本的模糊检查
        console.warn(`[worldbookUpdater] 内容已存在 (无ID)，跳过 ADD 防止重复录入。`);
        continue;
      }

      lines = applyAdd(lines, path, contentToAdd);
      existingContent = lines.join('\n');
      continue;
    }

    const replaceMatch = trimmedCommand.match(/^替换 '([^']*)' 内容为:/);
    if (replaceMatch) {
      const path = replaceMatch[1];
      const newContent = trimmedCommand.substring(replaceMatch[0].length).trim();
      lines = applyReplace(lines, path, newContent);
      existingContent = lines.join('\n');
      continue;
    }

    const removeMatch = trimmedCommand.match(/^从 '([^']*)' 中移除:/);
    if (removeMatch) {
      const path = removeMatch[1];
      const contentToRemove = trimmedCommand.substring(removeMatch[0].length).trim();
      lines = applyRemove(lines, path, contentToRemove);
      existingContent = lines.join('\n');
      continue;
    }
  }

  return lines.join('\n');
}
