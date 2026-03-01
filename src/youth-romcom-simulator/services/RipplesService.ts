import { reactive } from 'vue';
import { lorebookService } from './LorebookService';

export interface Ripple {
  id: number;
  title: string;
  rawContent: string;
  [key: string]: any;
}

// 从 actions.ts 迁移过来的辅助函数
function parseBlock(block: string): { [key: string]: string } {
  const data: { [key: string]: string } = {};
  const lines = block.trim().split('\n');
  let currentKey = '';
  for (const line of lines) {
    const separatorIndex = line.indexOf('|');
    if (separatorIndex !== -1) {
      const key = line.substring(0, separatorIndex).trim();
      const value = line.substring(separatorIndex + 1).trim();
      data[key] = value;
      currentKey = key;
    } else if (currentKey && line.trim()) {
      data[currentKey] += '\n' + line;
    }
  }
  for (const key in data) {
    data[key] = data[key].trim();
  }
  return data;
}

class RipplesService {
  public ripples = reactive<Ripple[]>([]);

  async initialize() {
    await this.loadRipples();
  }

  async loadRipples() {
    try {
      const rippleContent = await lorebookService.readFromLorebook('往世涟漪');
      if (!rippleContent || !rippleContent.trim()) {
        this.ripples.splice(0, this.ripples.length); // 清空
        return;
      }

      const rippleBlocks = rippleContent.split('\n\n---\n\n');
      const parsedRipples: Ripple[] = [];

      for (const blockContent of rippleBlocks) {
        if (!blockContent.trim()) continue;
        const blockData = parseBlock(blockContent);
        const rippleId = parseInt(blockData['第x世'], 10);

        if (!isNaN(rippleId)) {
          parsedRipples.push({
            id: rippleId,
            title: `第 ${rippleId} 世`,
            rawContent: blockContent,
            ...blockData,
          });
        }
      }

      // 按世数排序并更新响应式数组
      this.ripples.splice(0, this.ripples.length, ...parsedRipples.sort((a, b) => a.id - b.id));
      console.log(`[RipplesService] Loaded ${this.ripples.length} ripples.`);
    } catch (error) {
      console.error('[RipplesService] Error loading ripples:', error);
      this.ripples.splice(0, this.ripples.length); // 出错时清空
    }
  }

  getRippleById(id: number): Ripple | undefined {
    return this.ripples.find(r => r.id === id);
  }
}

export const ripplesService = new RipplesService();
