import { ref } from 'vue';
import { lorebookService } from './LorebookService';

export interface BbsPost {
  id: string;
  title: string;
  author: string;
  content: string;
}

export interface WeeklyReview {
    刊号: string;
    发行日期: string;
    本周头条: string;
    一周热点追击: string;
}

class ForumService {
  public posts = ref<BbsPost[]>([]);
  public reviews = ref<WeeklyReview[]>([]);

  private lastBbsLogContent = '';
  private lastReviewLogContent = '';
  private pollingInterval: any = null;

  constructor() {
    this.startPolling();
  }

  public startPolling(interval = 5000) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    this.pollingInterval = setInterval(() => {
        this.fetchBbsPostsFromLorebook();
        this.fetchWeeklyReviewsFromLorebook();
    }, interval);
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
      if (currentLogContent && currentLogContent !== this.lastBbsLogContent) {
        this.lastBbsLogContent = currentLogContent;
        this.parseDirectorLogForBbs(currentLogContent);
      }
    } catch (error) {
      // console.error('[Forum Service] Error fetching BBS logs:', error);
    }
  }

  private async fetchWeeklyReviewsFromLorebook() {
    try {
      const currentLogContent = await lorebookService.readFromLorebook('周刊', true);
      if (currentLogContent && currentLogContent !== this.lastReviewLogContent) {
        this.lastReviewLogContent = currentLogContent;
        this.parseWeeklyReviews(currentLogContent);
      }
    } catch (error) {
      // console.error('[Forum Service] Error fetching Weekly Reviews:', error);
    }
  }

  private parseDirectorLogForBbs(logContent: string) {
    const allPosts: BbsPost[] = [];
    const logs = logContent.split('---'); // Split by the main separator
    logs.forEach((log, index) => {
        const scriptIdMatch = log.match(/剧本ID\|(\S+)/);
        const scriptId = scriptIdMatch ? scriptIdMatch[1] : `log-${index}`;
        
        if(log.includes('【校园BBS】')) {
            const bbsSection = log.split('【校园BBS】')[1];
            const postMatches = bbsSection.match(/- 帖子标题: "(.*?)"\s*发帖人: (.*?)\s*内容: "(.*?)"/g);
            if(postMatches){
                 postMatches.forEach(match => {
                    const postMatch = /- 帖子标题: "(.*?)"\s*发帖人: (.*?)\s*内容: "(.*?)"/.exec(match);
                    if (postMatch) {
                        allPosts.push({
                            id: `${scriptId}-${postMatch[1]}`,
                            title: postMatch[1],
                            author: postMatch[2],
                            content: postMatch[3]
                        });
                    }
                });
            }
        }
    });
    this.posts.value = allPosts.reverse();
  }

  private parseWeeklyReviews(logContent: string) {
    const allReviews: WeeklyReview[] = [];
    const reviewsText = logContent.split('<周刊>').slice(1);
    reviewsText.forEach(reviewText => {
        const kHMatch = reviewText.match(/刊号\|(.*?)\n/);
        const fXrqMatch = reviewText.match(/发行日期\|(.*?)\n/);
        const bZttMatch = reviewText.match(/本周头条\|(.*?)\n/);
        const yZRdZjMatch = reviewText.match(/【一周热点追击】\n([\s\S]*?)\n---/);

        if(kHMatch && fXrqMatch && bZttMatch && yZRdZjMatch) {
            allReviews.push({
                刊号: kHMatch[1],
                发行日期: fXrqMatch[1],
                本周头条: bZttMatch[1],
                一周热点追击: yZRdZjMatch[1].trim(),
            });
        }
    });
    this.reviews.value = allReviews.reverse();
  }
}

export const forumService = new ForumService();