/**
 * @file SocialDataParser
 * @description Provides utility functions to parse and format text-based social data from lorebooks.
 * This is based on the logic from the legacy `social.ts`.
 */

/**
 * Parses a block of text from a lorebook entry into an array of structured objects.
 * Each entry is separated by one or more blank lines.
 * Each line within an entry is a key-value pair separated by a pipe '|'.
 * @param text The raw text content from the lorebook.
 * @returns An array of parsed objects.
 */
export function parseSocialData(text: string | null): any[] {
  if (!text || !text.trim()) return [];
  const entries = text.trim().split(/\n\s*\n+/);
  return entries.map(entryText => {
    const obj: { [key: string]: any } = {};
    const lines = entryText
      .trim()
      .split('\n')
      .filter(l => !l.startsWith('//') && l.trim());
    for (const line of lines) {
      const separatorIndex = line.indexOf('|');
      if (separatorIndex === -1) continue;

      const key = line.substring(0, separatorIndex).trim();
      const value = line.substring(separatorIndex + 1).trim();
      if (obj[key]) {
        if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
        if (value) obj[key].push(value);
      } else {
        const alwaysArrayKeys = ['参与者', '成员', '历史', '点赞者', '评论'];
        obj[key] = alwaysArrayKeys.includes(key) ? (value ? [value] : []) : value;
      }
    }
    return obj;
  });
}

/**
 * Formats an array of structured objects back into a text string for lorebook storage.
 * @param data The array of objects to format.
 * @returns A string representation of the data.
 */
export function formatSocialData(data: any[]): string {
  if (!Array.isArray(data)) return '';
  return data
    .map(item => {
      const lines: string[] = [];
      const orderedKeys = [
        'ID',
        '群名称',
        '作者',
        '内容',
        '时间戳',
        '最后消息',
        '最后时间',
        '参与者',
        '成员',
        '点赞者',
        '评论',
        '历史',
      ].filter(k => k in item);
      const remainingKeys = Object.keys(item).filter(k => !orderedKeys.includes(k));
      [...orderedKeys, ...remainingKeys].forEach(key => {
        const value = item[key];
        if (Array.isArray(value)) {
          if (value.length === 0) lines.push(`${key}|`);
          else value.forEach(v => lines.push(`${key}|${v}`));
        } else if (value !== null && value !== undefined) {
          lines.push(`${key}|${value}`);
        }
      });
      return lines.join('\n');
    })
    .join('\n\n');
}
