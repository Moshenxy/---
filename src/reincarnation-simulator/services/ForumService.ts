import { ref } from 'vue';

// 定义帖子和回复的数据结构
export interface PostReply {
  author: string;
  content: string;
}

export interface ForumPost {
  id: string;
  board: string;
  title: string;
  author: string;
  isPinned: boolean;
  content: string;
  replies: PostReply[];
}

class ForumService {
  public posts = ref<ForumPost[]>([]);

  constructor() {
    this.loadPosts();
  }

  private async loadPosts() {
    try {
      const entries = await TavernHelper.getLorebookEntries('天华校园');
      if (!entries) {
        console.warn('[ForumService] Could not fetch entries for "天华校园".');
        return;
      }
      const forumEntry = entries.find((e: any) => e.comment === '[世界观]论坛帖子');
      if (forumEntry && forumEntry.content) {
        this.posts.value = this.parseRawPosts(forumEntry.content);
      } else {
        console.warn('[ForumService] Forum post entry not found in lorebook.');
      }
    } catch (error) {
      console.error('Failed to load forum posts from lorebook:', error);
    }
  }

  private parseRawPosts(rawText: string): ForumPost[] {
    const posts: ForumPost[] = [];
    const postBlocks = rawText.trim().split(/\n\n(?=ID\|)/);

    for (const block of postBlocks) {
      const lines = block.trim().split('\n');
      const post: Partial<ForumPost> = {};
      let content = '';
      let isContent = false;

      for (const line of lines) {
        if (isContent) {
          if (line.startsWith('回复|')) {
            isContent = false;
          } else {
            content += line + '\n';
            continue;
          }
        }

        const [key, ...valueParts] = line.split('|');
        const value = valueParts.join('|');

        switch (key) {
          case 'ID':
            post.id = value;
            break;
          case '版块':
            post.board = value;
            break;
          case '标题':
            post.title = value;
            break;
          case '作者':
            post.author = value;
            break;
          case '置顶':
            post.isPinned = value === 'true';
            break;
          case '内容':
            isContent = true;
            content = value + '\n';
            break;
          case '回复':
            try {
              post.replies = JSON.parse(value);
            } catch (e) {
              post.replies = [];
            }
            break;
        }
      }
      post.content = content.trim();
      if (post.id) {
        posts.push(post as ForumPost);
      }
    }
    return posts;
  }
}

export const forumService = new ForumService();