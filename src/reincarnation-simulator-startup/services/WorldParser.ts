import type { WorldDefinition } from '../types/world';

/**
 * A robust, non-regex based parser for the custom YAML-like format.
 */
export function parseWorldLoreForMap(text: string): WorldDefinition | null {
  if (!text) {
    console.warn('[WorldMapParser] Received empty or null lore content.');
    return null;
  }

  const automationRuleMarker = '自动化规则:';
  const startIndex = text.indexOf(automationRuleMarker);
  if (startIndex === -1) {
    console.error('[WorldMapParser] "自动化规则:" block not found in the lorebook entry.');
    return null;
  }

  const yamlText = text.substring(startIndex);
  const lines = yamlText.split('\n').slice(1); // Skip the "自动化规则:" line

  const root = {};
  const stack: { level: number; obj: any }[] = [{ level: -1, obj: root }];

  for (const line of lines) {
    if (line.trim() === '') continue;

    const indentMatch = line.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0].length : 0;
    const trimmedLine = line.trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1].level) {
      stack.pop();
    }

    let parentObj = stack[stack.length - 1].obj;

    if (trimmedLine.startsWith('- ')) {
      const listItemContent = trimmedLine.substring(2).trim();
      
      if (!Array.isArray(parentObj)) {
          const grandParent = stack[stack.length - 2].obj;
          const lastKey = Object.keys(grandParent).pop();
          if (lastKey && grandParent[lastKey] === parentObj) {
              parentObj = [];
              grandParent[lastKey] = parentObj;
              stack[stack.length-1].obj = parentObj;
          } else {
              continue; 
          }
      }

      const separatorIndex = listItemContent.indexOf(':');
      if (separatorIndex === -1) {
        parentObj.push(parseValue(listItemContent));
      } else {
        const newListItem = {};
        parentObj.push(newListItem);
        stack.push({ level: indent, obj: newListItem });
        processKeyValue(listItemContent, newListItem, indent, stack);
      }
    } else {
      processKeyValue(trimmedLine, parentObj, indent, stack);
    }
  }

  return root as WorldDefinition;
}

function processKeyValue(line: string, parent: any, indent: number, stack: any[]) {
  const separatorIndex = line.indexOf(':');
  if (separatorIndex > -1) {
    const key = line.substring(0, separatorIndex).trim();
    const valueStr = line.substring(separatorIndex + 1).trim();

    if (valueStr === '') {
      const newChild = {};
      parent[key] = newChild;
      stack.push({ level: indent, obj: newChild });
    } else if (valueStr.startsWith('{') && valueStr.endsWith('}')) {
      const newObj = {};
      parent[key] = newObj;
      const objContent = valueStr.slice(1, -1).trim();
      const pairs = objContent.split(',').map(p => p.trim());
      for (const pair of pairs) {
        processKeyValue(pair, newObj, indent + 2, stack);
      }
    } else {
      parent[key] = parseValue(valueStr);
    }
  }
}

function parseValue(value: string): any {
  const trimmed = value.trim();

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    const inner = trimmed.slice(1, -1);
    if (inner.startsWith('[') && inner.endsWith(']')) {
        return parseValue(inner);
    }
    return inner;
  }
  
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const content = trimmed.slice(1, -1).trim();
      const parts = [];
      let buffer = '';
      let inQuotes = false;
      let bracketLevel = 0;

      for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (char === "'" || char === '"') {
          inQuotes = !inQuotes;
        }
        if (!inQuotes) {
          if (char === '[') bracketLevel++;
          if (char === ']') bracketLevel--;
          if (char === ',' && bracketLevel === 0) {
            parts.push(buffer.trim());
            buffer = '';
            continue;
          }
        }
        buffer += char;
      }
      if (buffer) {
        parts.push(buffer.trim());
      }
      
      return parts.map(part => parseValue(part));

    } catch (e) {
      // Fallback
    }
  }

  if (trimmed.toLowerCase() === 'true') return true;
  if (trimmed.toLowerCase() === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed !== '' && !isNaN(Number(trimmed)) && !trimmed.includes('x')) {
    return Number(trimmed);
  }

  return trimmed;
}