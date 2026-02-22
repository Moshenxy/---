/**
 * 尝试将一个字符串解析为 { key: "value", ... } 格式的对象。
 * @param str - 要解析的字符串。
 * @returns 解析后的对象，或原始字符串。
 */
function tryParseObject(str: string): any {
  str = str.trim();
  if (str.startsWith('{') && str.endsWith('}')) {
    try {
      // 移除花括号并按逗号分割
      const properties = str.slice(1, -1).split(',');
      const obj: any = {};
      for (const prop of properties) {
        const parts = prop.split(':');
        if (parts.length === 2) {
          const key = parts[0].trim().replace(/["']/g, '');
          const value = parts[1].trim().replace(/["']/g, '');
          obj[key] = value;
        }
      }
      return obj;
    } catch (e) {
      // 解析失败，返回原始字符串
      return str;
    }
  }
  return str;
}

/**
 * 解析一个简单的、基于缩进的类YAML字符串为嵌套的JavaScript对象。
 * @param text - 要解析的字符串。
 * @returns 解析后的对象。
 */
export function parseSimpleYaml(text: string): any {
  if (!text) return null;

  const lines = text.split('\n');
  const result: any = {};
  const stack: { obj: any; indent: number }[] = [{ obj: result, indent: -1 }];

  for (const line of lines) {
    if (line.trim() === '') continue;

    const indent = (line.match(/^\s*/) || [''])[0].length;
    const trimmedLine = line.trim();

    while (indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].obj;

    if (trimmedLine.startsWith('- ')) {
      const value = trimmedLine.substring(2).trim();
      // 列表项应该被添加到父级（它是一个数组）
      if (Array.isArray(parent)) {
        // 如果列表项本身是 "key: value"
        const separatorIndex = value.indexOf(':');
        if (separatorIndex > -1) {
          const key = value.substring(0, separatorIndex).trim();
          const val = value.substring(separatorIndex + 1).trim();
          const newObj: any = {};
          newObj[key] = val;
          parent.push(newObj);
          stack.push({ obj: newObj, indent });
        } else {
          parent.push(value);
        }
      }
    } else {
      const separatorIndex = trimmedLine.indexOf(':');
      if (separatorIndex > -1) {
        const key = trimmedLine.substring(0, separatorIndex).trim();
        const value = trimmedLine.substring(separatorIndex + 1).trim();

        if (value) {
          parent[key] = tryParseObject(value);
        } else {
          // 这是一个新的对象/列表的开始
          const nextLineIndex = lines.indexOf(line) + 1;
          if (nextLineIndex < lines.length && lines[nextLineIndex].trim().startsWith('-')) {
            const newList: any[] = [];
            parent[key] = newList;
            stack.push({ obj: newList, indent });
          } else {
            const newObj = {};
            parent[key] = newObj;
            stack.push({ obj: newObj, indent });
          }
          
          /**
           * 尝试将一个字符串解析为 { key: "value", ... } 格式的对象。
           * @param str - 要解析的字符串。
           * @returns 解析后的对象，或原始字符串。
           */
          function tryParseObject(str: string): any {
            str = str.trim();
            if (str.startsWith('{') && str.endsWith('}')) {
              try {
                // 移除花括号并按逗号分割
                const properties = str.slice(1, -1).split(',');
                const obj: any = {};
                for (const prop of properties) {
                  const parts = prop.split(':');
                  if (parts.length === 2) {
                    const key = parts[0].trim().replace(/["']/g, '');
                    const value = parts[1].trim().replace(/["']/g, '');
                    obj[key] = value;
                  }
                }
                return obj;
              } catch (e) {
                // 解析失败，返回原始字符串
                return str;
              }
            }
            return str;
          }
        }
      }
    }
  }

  // 如果顶层只有一个'自动化规则'键，则直接返回其内容
  if (Object.keys(result).length === 1 && result['自动化规则']) {
    return result['自动化规则'];
  }

  return result;
}
