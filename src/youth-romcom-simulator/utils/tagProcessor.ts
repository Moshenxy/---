/**
 * 确保AI响应文本中 &#x60;<thinking>&#x60; 和 &#x60;<gametxt>&#x60; 标签的完整性和正确性。
 * @param text - 从AI获取的原始响应文本。
 * @returns - 经过处理和规范化的文本。
 */
export function processTags(text: string): string {
  let processedText = text;

  // 优先修复常见的标签拼写错误
  // 使用正则表达式修复 thinking 的各种错误拼写
  processedText = processedText.replace(/<\/?think(ing)?>/g, (match) => {
    return match.startsWith('</') ? '</thinking>' : '<thinking>';
  });
  
  // 使用正则表达式修复 gametxt 的各种错误拼写
  processedText = processedText.replace(/<\/?(game-?txt|gamet-?xt|gametxtt)>/g, (match) => {
    return match.startsWith('</') ? '</gametxt>' : '<gametxt>';
  });

  // 1. 检查 <thinking> 标签是否存在，如果不存在则在最上面添加一个
  if (!processedText.includes('<thinking>')) {
    processedText = '<thinking>\n</thinking>\n' + processedText;
  }

  // 2. 检查 <thinking> 标签是否闭合
  const thinkingOpenIndex = processedText.indexOf('<thinking>');
  const thinkingCloseIndex = processedText.indexOf('</thinking>');
  const gametxtOpenIndex = processedText.indexOf('<gametxt>');

  if (thinkingOpenIndex !== -1 && thinkingCloseIndex === -1) {
    if (gametxtOpenIndex !== -1 && gametxtOpenIndex > thinkingOpenIndex) {
      // 在 <gametxt> 前闭合
      processedText = 
        processedText.slice(0, gametxtOpenIndex) + 
        '</thinking>\n' + 
        processedText.slice(gametxtOpenIndex);
    } else {
      // 如果没有 <gametxt>，则在文本末尾闭合
      processedText += '\n</thinking>';
    }
  }

  // 3. 检测 <thinking> 标签包裹内容，将内容所有 < 和 > 都删掉
  const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/g;
  processedText = processedText.replace(thinkingRegex, (match, content) => {
    const sanitizedContent = content.replace(/<|>/g, '');
    return `<thinking>${sanitizedContent}</thinking>`;
  });

  // 重新获取 thinkingCloseIndex
  const newThinkingCloseIndex = processedText.indexOf('</thinking>');

  // 4. 检测 <gametxt> 标签是否存在，如果不存在则在 </thinking> 后添加
  if (newThinkingCloseIndex !== -1 && !processedText.includes('<gametxt>')) {
    processedText = 
      processedText.slice(0, newThinkingCloseIndex + '</thinking>'.length) + 
      '\n<gametxt></gametxt>' + 
      processedText.slice(newThinkingCloseIndex + '</thinking>'.length);
  }

  // 5. 检测 <gametxt> 标签是否闭合
  const gametxtOpenIndexAgain = processedText.indexOf('<gametxt>');
  const gametxtCloseIndex = processedText.indexOf('</gametxt>');

  if (gametxtOpenIndexAgain !== -1 && gametxtCloseIndex === -1) {
    // 找到下一个 < 标签的位置
    const nextTagIndex = processedText.indexOf('<', gametxtOpenIndexAgain + '<gametxt>'.length);
    if (nextTagIndex !== -1) {
      processedText = 
        processedText.slice(0, nextTagIndex) + 
        '</gametxt>\n' + 
        processedText.slice(nextTagIndex);
    } else {
      // 如果后面没有其他标签，则在末尾闭合
      processedText += '\n</gametxt>';
    }
  }

  return processedText;
}