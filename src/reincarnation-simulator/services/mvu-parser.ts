import { cloneDeep, get, set, unset } from 'lodash';

// 移植自 梦星前端代码解析 (1).txt 和 UpdateVariable5.html 的核心逻辑
// 这些辅助函数用于解析AI返回的字符串格式的 _.set, _.add 等指令

function _trimQuotes(str: string): string {
  if (typeof str !== 'string') return str;
  return str.replace(/^['"` ]*(.*?)['"` ]*$/, '$1');
}

function _parseCommandValue(valStr: string): any {
  if (typeof valStr !== 'string') return valStr;
  const trimmed = valStr.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;
  try {
    // 首先尝试标准的JSON解析
    return JSON.parse(trimmed);
  } catch (e) {
    // 如果失败，并且看起来像对象或数组，尝试用Function构造函数作为最后的手段
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        return new Function(`return ${trimmed};`)();
      } catch (err) {
        /* 忽略错误，继续执行 */
      }
    }
  }
  // 如果所有方法都失败，则作为普通字符串处理
  return _trimQuotes(valStr);
}

function _findMatchingCloseParen(str: string, startPos: number): number {
  let parenCount = 1;
  let inQuote = false;
  let quoteChar = '';
  for (let i = startPos; i < str.length; i++) {
    const char = str[i];
    if ((char === '"' || char === "'" || char === '`') && str[i - 1] !== '\\') {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
      }
    }
    if (!inQuote) {
      if (char === '(') parenCount++;
      else if (char === ')') {
        parenCount--;
        if (parenCount === 0) return i;
      }
    }
  }
  return -1;
}

function _parseParameters(paramsString: string): string[] {
  const params: string[] = [];
  let currentParam = '';
  let inQuote = false;
  let quoteChar = '';
  let bracketCount = 0;
  let braceCount = 0;
  let parenCount = 0;
  for (let i = 0; i < paramsString.length; i++) {
    const char = paramsString[i];
    if ((char === '"' || char === "'" || char === '`') && (i === 0 || paramsString[i - 1] !== '\\')) {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
      }
    }
    if (!inQuote) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
    if (char === ',' && !inQuote && parenCount === 0 && bracketCount === 0 && braceCount === 0) {
      params.push(currentParam.trim());
      currentParam = '';
      continue;
    }
    currentParam += char;
  }
  if (currentParam.trim()) {
    params.push(currentParam.trim());
  }
  return params;
}

function _extractCommands(inputText: string): { command: string; args: string[] }[] {
  const results: { command: string; args: string[] }[] = [];
  let i = 0;
  while (i < inputText.length) {
    const match = inputText.substring(i).match(/_\.(set|assign|remove|add|insert)\(/);
    if (!match || match.index === undefined) break;

    const commandType = match[1];
    const start = i + match.index;
    const openParen = start + match[0].length;
    const closeParen = _findMatchingCloseParen(inputText, openParen);

    if (closeParen === -1) {
      i = openParen;
      continue;
    }

    // 指令必须以分号结尾
    let endPos = closeParen + 1;
    if (endPos >= inputText.length || inputText[endPos] !== ';') {
      i = closeParen + 1;
      continue;
    }
    endPos++;

    const paramsString = inputText.substring(openParen, closeParen);
    const params = _parseParameters(paramsString);

    results.push({ command: commandType, args: params });
    i = endPos;
  }
  return results;
}

/**
 * 前端回退MVU处理器。当后端invokeMvuScript失败时，此函数会解析AI返回的原始脚本字符串并尝试应用变量更新。
 * @param script - AI返回的完整UpdateVariable块内容。
 * @param currentMvuState - 当前的完整MVU状态对象。
 * @returns 如果成功应用了更改，则返回一个新的状态对象；否则返回null。
 */
export function applyMvuUpdateFallback(script: string, currentMvuState: any): any | null {
  if (!script || !currentMvuState) return null;

  const newState = cloneDeep(currentMvuState);
  let modified = false;

  const commands = _extractCommands(script);

  for (const command of commands) {
    try {
      const path = _trimQuotes(command.args[0]);

      switch (command.command) {
        case 'set': {
          const newValueStr = command.args.length >= 2 ? command.args[1] : undefined;
          if (newValueStr === undefined) continue;
          let newValue = _parseCommandValue(newValueStr);

          if (newValue instanceof Date) newValue = newValue.toISOString();

          set(newState.stat_data, path, newValue);
          modified = true;
          break;
        }
        case 'add': {
          const currentValue = get(newState.stat_data, path);
          const delta = _parseCommandValue(command.args[1]);
          if (typeof currentValue === 'number' && typeof delta === 'number') {
            set(newState.stat_data, path, currentValue + delta);
            modified = true;
          }
          break;
        }
        case 'remove': {
          unset(newState.stat_data, path);
          modified = true;
          break;
        }
        case 'assign':
        case 'insert': {
          if (command.args.length === 2) {
            const valueToAssign = _parseCommandValue(command.args[1]);
            const parentCollection = get(newState.stat_data, path);

            if (
              Array.isArray(parentCollection) &&
              parentCollection.length === 2 &&
              Array.isArray(parentCollection[0]) &&
              typeof parentCollection[1] === 'string'
            ) {
              const innerArray = parentCollection[0];
              const description = parentCollection[1];
              const newInnerArray = innerArray.concat(Array.isArray(valueToAssign) ? valueToAssign : [valueToAssign]);
              const newParentArray = [newInnerArray, description];
              set(newState.stat_data, path, newParentArray);
              modified = true;
            } else if (Array.isArray(parentCollection)) {
              const newCollection = parentCollection.concat(
                Array.isArray(valueToAssign) ? valueToAssign : [valueToAssign],
              );
              set(newState.stat_data, path, newCollection);
              modified = true;
            } else if (typeof parentCollection === 'object' && parentCollection !== null) {
              Object.assign(parentCollection, valueToAssign);
              modified = true;
            } else {
              set(newState.stat_data, path, valueToAssign);
              modified = true;
            }
          } else if (command.args.length >= 3) {
            const keyOrIndex = _parseCommandValue(command.args[1]);
            const valueToAssign = _parseCommandValue(command.args[2]);
            const collection = get(newState.stat_data, path);

            if (Array.isArray(collection)) {
              if (typeof keyOrIndex === 'number') {
                const newCollection = [...collection];
                newCollection.splice(keyOrIndex, 0, valueToAssign);
                set(newState.stat_data, path, newCollection);
                modified = true;
              }
            } else if (typeof collection === 'object' && collection !== null) {
              set(collection, String(keyOrIndex), valueToAssign);
              modified = true;
            } else {
              const newCollection: any = {};
              set(newCollection, String(keyOrIndex), valueToAssign);
              set(newState.stat_data, path, newCollection);
              modified = true;
            }
          }
          break;
        }
      }
    } catch (e) {
      console.error(`[MVU Fallback] 处理指令失败:`, command, e);
    }
  }

  return modified ? newState : null;
}
