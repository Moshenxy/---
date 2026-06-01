import { serviceLocator } from './service-locator';

const DAILY_SYNTHESIS_THRESHOLD = 1; // 至少有1条片段就合成日记
const WEEKLY_SYNTHESIS_THRESHOLD = 7; // 7篇日记合成一篇周刊

class DiarySynthesisService {
  private processedDatesForDiary = new Set<string>();
  private lastWeeklyReviewCount = 0;

  /**
   * 检查是否需要触发日记或周刊的合成。
   * @returns 返回合成指令，否则返回空字符串。
   */
  public getSynthesisRequest(): string {
    const store = serviceLocator.get('store');
    if (!store.diaryFragments || store.diaryFragments.length === 0) {
      return '';
    }

    const uniqueDates = [...new Set(store.diaryFragments.map(f => f.日期))].sort();

    if (uniqueDates.length > 1) {
      // 存在多个日期的片段，说明新的一天开始了
      const dateToProcess = uniqueDates[0]; // 获取最早的、需要处理的日期

      // 确保这个日期没有被处理过
      if (!this.processedDatesForDiary.has(dateToProcess)) {
        const fragmentsToSynthesize = store.diaryFragments.filter(f => f.日期 === dateToProcess);

        if (fragmentsToSynthesize.length > 0) {
          console.log(
            `[DiarySynthesisService] New day detected. Triggering synthesis for previous day: ${dateToProcess}`,
          );
          // 立即标记为已处理，防止重复触发
          this.processedDatesForDiary.add(dateToProcess);
          const payload = JSON.stringify(fragmentsToSynthesize);
          return `<请求合成日记>${payload}</请求合成日记>`;
        } else {
          // 如果该日期没有片段（理论上不应发生），也标记为已处理
          this.processedDatesForDiary.add(dateToProcess);
        }
      }
    }

    // --- 周刊合成逻辑 (保持不变) ---
    // 只有在没有日记合成任务时才检查周刊
    const diariesToReview = store.diary.slice(this.lastWeeklyReviewCount);
    if (diariesToReview.length >= WEEKLY_SYNTHESIS_THRESHOLD) {
      console.log(
        `[DiarySynthesisService] Diary count (${store.diary.length}) reached threshold. Triggering Weekly Review Synthesis.`,
      );
      const payload = JSON.stringify(diariesToReview);
      this.lastWeeklyReviewCount += WEEKLY_SYNTHESIS_THRESHOLD;
      return `<请求合成周刊>${payload}</请求合成周刊>`;
    }

    return '';
  }

  /**
   * 初始化服务，可以用来设置初始状态。
   */
  public initialize() {
    const store = serviceLocator.get('store');
    this.processedDatesForDiary.clear();
    // 从已有的日记中恢复已处理的日期状态
    store.diary.forEach(d => this.processedDatesForDiary.add(d.日期));
    this.lastWeeklyReviewCount = store.weeklyReviews.length * WEEKLY_SYNTHESIS_THRESHOLD;
    console.log('[DiarySynthesisService] Initialized. Processed dates restored:', this.processedDatesForDiary);
  }
}

export const diarySynthesisService = new DiarySynthesisService();
