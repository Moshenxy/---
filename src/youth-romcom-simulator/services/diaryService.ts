import { lorebookService } from './LorebookService';
import type { DiaryEntry } from '../types';

class DiaryService {
  private parseSingleDiaryEntry(block: string): DiaryEntry | null {
    try {
      const lines = block
        .trim()
        .split('\n')
        .map(l => l.trim());
      if (lines.length < 2) return null;

      const entry: DiaryEntry = {
        日期: '',
        标题: '',
        天气: '',
        心情随笔: '',
        本日事件簿: [],
        关系温度计: [],
        明日备忘: [],
      };

      let bodyStartIndex = 0;

      // Flexible Header Parsing
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('日期|')) entry.日期 = line.split('|')[1]?.trim() || '';
        if (line.includes('标题|')) entry.标题 = line.split('|')[1]?.trim() || '';
        if (line.includes('天气|')) entry.天气 = line.split('|')[1]?.trim() || '';

        if (line === '---') {
          bodyStartIndex = i + 1;
          break;
        }
      }

      if (!entry.日期) {
        // Fallback if format is slightly different
        const dateMatch = block.match(/日期\|(.+)/);
        if (dateMatch) entry.日期 = dateMatch[1].trim();
      }
      if (!entry.标题) {
        const titleMatch = block.match(/标题\|(.+)/);
        if (titleMatch) entry.标题 = titleMatch[1].trim();
      }
      if (!entry.天气) {
        const weatherMatch = block.match(/天气\|(.+)/);
        if (weatherMatch) entry.天气 = weatherMatch[1].trim();
      }

      if (!entry.日期 || !entry.标题) return null;

      let currentSection: '随笔' | '事件' | '关系' | '备忘' | null = null;

      for (let i = bodyStartIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('【')) {
          if (line.includes('心情随笔')) currentSection = '随笔';
          else if (line.includes('本日事件簿')) currentSection = '事件';
          else if (line.includes('关系温度计')) currentSection = '关系';
          else if (line.includes('明日备忘')) currentSection = '备忘';
          else currentSection = null;
          continue;
        }

        switch (currentSection) {
          case '随笔':
            entry.心情随笔 += (entry.心情随笔 ? '\n' : '') + line;
            break;
          case '事件': {
            if (line.startsWith('- 时刻:')) {
              entry.本日事件簿.push({ 时刻: line.replace('- 时刻:', '').trim(), 地点: '', 事件: '', 我的吐槽: '' });
            } else if (entry.本日事件簿.length > 0) {
              const lastEvent = entry.本日事件簿[entry.本日事件簿.length - 1];
              if (line.startsWith('地点:')) lastEvent.地点 = line.replace('地点:', '').trim();
              else if (line.startsWith('事件:')) lastEvent.事件 = line.replace('事件:', '').trim();
              else if (line.startsWith('我的吐槽:')) lastEvent.我的吐槽 = line.replace('我的吐槽:', '').trim();
            }
            break;
          }
          case '关系': {
            if (line.startsWith('- 对象:')) {
              entry.关系温度计.push({ 对象: line.replace('- 对象:', '').trim(), 事件: '', 我的看法: '' });
            } else if (entry.关系温度计.length > 0) {
              const lastRelation = entry.关系温度计[entry.关系温度计.length - 1];
              if (line.startsWith('事件:')) lastRelation.事件 = line.replace('事件:', '').trim();
              else if (line.startsWith('我的看法:')) lastRelation.我的看法 = line.replace('我的看法:', '').trim();
            }
            break;
          }
          case '备忘':
            if (line.startsWith('- ')) {
              entry.明日备忘.push(line.replace('- ', '').trim());
            }
            break;
        }
      }
      return entry;
    } catch (e) {
      console.error('Error parsing single diary entry:', e, block);
      return null;
    }
  }

  private parseDiaryText(text: string): DiaryEntry[] {
    const entries: DiaryEntry[] = [];
    // A more robust way to split entries. Find '---' then check if the next non-empty line starts with '日期|'
    const potentialBlocks = text.split('---');
    let currentBlock = '';

    for (const block of potentialBlocks) {
      if (block.trim().startsWith('日期|')) {
        if (currentBlock) {
          const entry = this.parseSingleDiaryEntry(currentBlock);
          if (entry) entries.push(entry);
        }
        currentBlock = block;
      } else {
        currentBlock += '---' + block;
      }
    }
    // last block
    if (currentBlock) {
      const entry = this.parseSingleDiaryEntry(currentBlock);
      if (entry) entries.push(entry);
    }

    return entries;
  }

  async getDiaryEntries(): Promise<DiaryEntry[]> {
    const diaryContent = await lorebookService.readFromLorebook('日记', true);
    if (!diaryContent) {
      console.warn("Lorebook entry '日记' is empty or not found.");
      return [];
    }
    return this.parseDiaryText(diaryContent);
  }
}

export const diaryService = new DiaryService();
