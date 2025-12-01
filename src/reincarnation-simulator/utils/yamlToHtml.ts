/**
 * 将简单的、基于缩进的类YAML文本转换为HTML字符串。
 * @param text - 要转换的类YAML字符串。
 * @returns 格式化后的HTML字符串。
 */
export function yamlToHtml(text: string): string {
  if (!text) return '<p>无内容</p>';

  const lines = text.split('\n');
  let html = '';
  let inList = false;

  lines.forEach(line => {
    if (line.trim() === '') return;

    const indent = (line.match(/^\s*/) || [''])[0].length;
    const trimmedLine = line.trim();

    // 结束列表
    if (inList && !trimmedLine.startsWith('- ')) {
      html += '</ul>';
      inList = false;
    }

    if (trimmedLine.startsWith('- ')) {
      // 列表项
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      // 移除 "- " 并处理内部的 "key: value"
      const listItemContent = formatLine(trimmedLine.substring(2).trim());
      html += `<li>${listItemContent}</li>`;
    } else {
      const separatorIndex = trimmedLine.indexOf(':');
      if (separatorIndex > -1) {
        const key = trimmedLine.substring(0, separatorIndex).trim();
        const value = trimmedLine.substring(separatorIndex + 1).trim();

        if (value) {
          // 键值对
          html += `<p><strong>${key}:</strong> ${value}</p>`;
        } else {
          // 作为一个小标题
          html += `<h4>${key}</h4>`;
        }
      } else {
         // 没有冒号的行，作为普通段落
         html += `<p>${trimmedLine}</p>`;
      }
    }
  });

  // 关闭未闭合的列表
  if (inList) {
    html += '</ul>';
  }

  return html;
}

/**
 * 格式化单行内容，将 "key: value" 转换为 "<strong>key:</strong> value"
 */
function formatLine(line: string): string {
    const separatorIndex = line.indexOf(':');
    if(separatorIndex > -1) {
        const key = line.substring(0, separatorIndex).trim();
        const value = line.substring(separatorIndex + 1).trim();
        if (key && value) {
            return `<strong>${key}:</strong> ${value}`;
        }
    }
    return line;
}