import { ref } from 'vue';
import { lorebookService } from './LorebookService';

export interface BbsPost {
  id: string;
  title: string;
  author: string;
  content: string;
}

class BbsService {
  public posts = ref<BbsPost[]>([]);
  private lastLogContent = '';
  private pollingInterval: any = null;

  constructor() {
    this.startPolling();
  }

  public startPolling(interval = 5000) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    this.pollingInterval = setInterval(() => this.fetchBbsPostsFromLorebook(), interval);
  }

  public stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async fetchBbsPostsFromLorebook() {
    try {
      const currentLogContent = await lorebookService.readFromLorebook('导演场记', true);
      // Since it's appended, we process the whole content every time to be safe.
      // The duplication is handled by the parsing logic.
      if (currentLogContent) {
         if (currentLogContent !== this.lastLogContent) {
            console.log('[BBS Service] Detected change in "导演场记" lorebook entry. Re-parsing all posts...');
            this.lastLogContent = currentLogContent;
            this.parseDirectorLogForBbs(currentLogContent);
         }
      }
    } catch (error) {
      console.error('[BBS Service] Error fetching "导演场记" from lorebook:', error);
    }
  }

  private parseDirectorLogForBbs(logContent: string) {
    const allPosts: BbsPost[] = [];
    const lines = logContent.split('\n');
    let inBbsSection = false;
    let currentScriptId = 'unknown';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Find the most recent script ID before a BBS section
      if (line.startsWith('剧本ID|')) {
        currentScriptId = line.replace('剧本ID|', '').trim();
      }

      if (line.includes('【校园BBS】')) {
        inBbsSection = true;
        continue;
      }

      if (line.startsWith('---') && inBbsSection) {
        inBbsSection = false;
        continue;
      }

      if (inBbsSection && line.startsWith('- 帖子标题:')) {
        const title = line.replace(/- 帖子标题:\s*/, '').replace(/"/g, '');
        let author = '匿名';
        let content = '';

        if (lines[i + 1] && lines[i + 1].trim().startsWith('发帖人:')) {
          author = lines[i + 1].trim().replace(/发帖人:\s*/, '');
          i++;
        }
        if (lines[i + 2] && lines[i + 2].trim().startsWith('内容:')) {
          content = lines[i + 2]
            .trim()
            .replace(/内容:\s*/, '')
            .replace(/"/g, '');
          i++;
        } else if (lines[i + 1] && lines[i + 1].trim().startsWith('内容:')) {
          content = lines[i + 1]
            .trim()
            .replace(/内容:\s*/, '')
            .replace(/"/g, '');
          i++;
        }

        allPosts.push({ id: `${currentScriptId}-${title}`, title, author, content });
      }
    }

    console.log(`[BBS Service] Parsed ${allPosts.length} new posts.`);

    const existingPostIds = new Set(this.posts.value.map(p => p.id));
    const newPosts = allPosts.filter(p => !existingPostIds.has(p.id));

    if (newPosts.length > 0) {
      this.posts.value.unshift(...newPosts);
    }

    if (this.posts.value.length > 50) {
      this.posts.value = this.posts.value.slice(0, 50);
    }
  }
}

export const bbsService = new BbsService();
