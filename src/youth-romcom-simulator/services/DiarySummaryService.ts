import { watch } from 'vue';
import { store } from '../store';
import { lorebookService } from './LorebookService';

class DiarySummaryService {
  private static instance: DiarySummaryService;
  private lastCheckedDate: string | null = null;
  private lastCheckedMonth: number | null = null;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): DiarySummaryService {
    if (!DiarySummaryService.instance) {
      DiarySummaryService.instance = new DiarySummaryService();
    }
    return DiarySummaryService.instance;
  }

  private initialize() {
    console.log('[DiarySummaryService] Initializing...');
    this.watchTimeChanges();
  }

  private watchTimeChanges() {
    watch(() => store.worldState?.当前时间, (newTime, oldTime) => {
      if (!newTime || !store.worldState) return;

      const currentDate = `${newTime.年}-${newTime.月}-${newTime.日}`;
      const currentMonth = newTime.月;

      if (this.lastCheckedDate === null) {
        this.lastCheckedDate = currentDate;
        this.lastCheckedMonth = currentMonth;
        return;
      }

      if (currentDate !== this.lastCheckedDate) {
        console.log(`[DiarySummaryService] Date changed from ${this.lastCheckedDate} to ${currentDate}. Triggering daily summary.`);
        this.triggerDailySummary(oldTime);
        this.lastCheckedDate = currentDate;
      }
      
      if (currentMonth !== this.lastCheckedMonth) {
        console.log(`[DiarySummaryService] Month changed from ${this.lastCheckedMonth} to ${currentMonth}. Triggering monthly summary.`);
        this.triggerMonthlySummary(oldTime);
        this.lastCheckedMonth = currentMonth;
      }

    }, { deep: true });
  }

  private async triggerDailySummary(dateToSummarize: any) {
    const logContent = await lorebookService.readFromLorebook('校园日志-主');
    if (!logContent || logContent.trim() === '') {
      console.log('[DiarySummaryService] No daily logs to summarize.');
      return;
    }

    const summary = await this.generateSummary(logContent, 'small', dateToSummarize);
    if (summary) {
      await lorebookService.appendToEntry('日记总结-小-主', summary);
      await lorebookService.writeToLorebook('校园日志-主', ''); // 清空
      console.log('[DiarySummaryService] Daily summary generated and logs cleared.');
    }
  }

  private async triggerMonthlySummary(dateToSummarize: any) {
    const smallSummaries = await lorebookService.readFromLorebook('日记总结-小-主');
    if (!smallSummaries || smallSummaries.trim() === '') {
      console.log('[DiarySummaryService] No small summaries to summarize for the month.');
      return;
    }

    const summary = await this.generateSummary(smallSummaries, 'large', dateToSummarize);
    if (summary) {
      await lorebookService.appendToEntry('日记总结-大-主', summary);
      await lorebookService.writeToLorebook('日记总结-小-主', ''); // 清空
      console.log('[DiarySummaryService] Monthly summary generated and small summaries cleared.');
    }
  }

  private async generateSummary(content: string, type: 'small' | 'large', date: any): Promise<string | null> {
    const dateString = type === 'small'
      ? `${date.年}年${date.月}月${date.日}日`
      : `${date.年}年${date.月}月`;

    const prompt = `
      # 任务：生成日记${type === 'small' ? '小' : '大'}总结
      请根据我提供的格式，为以下内容生成一份总结。
      
      ## 格式要求
      ${type === 'small'
        ? `<日记总结-小>
日期|${dateString}
标题|${'${对当天所有事件的高度概括，10个字以内}'}
概述|${'${对当天所有事件的概括性描述，100-150字}'}
关键事件|
- ${'${事件1简述}'}
关键人物|${'${当天与主角互动最频繁或最重要的1-3名NPC}'}
</日记总结-小>`
        : `<日记总结-大>
日期|${dateString}
标题|${'${对当月所有事件的高度概括，15个字以内}'}
概述|${'${对当月整体情况的总结，200-300字}'}
核心脉络|${'${事件1} -> ${事件2} -> ...'}
主要成就与突破|
- ${'${学业/技能上的主要进步}'}
- ${'${人际关系上的重大突破或变化}'}
遗留问题与伏笔|
- ${'${本月未能解决的问题}'}
</日记总结-大>`
      }

      ## 原始材料
      ${content}
    `;

    try {
      const aiResponse = await TavernHelper.generate({
        injects: [{ role: 'user', content: prompt, position: 'none', depth: 0 }],
        should_stream: false,
      });
      // 直接返回AI生成的完整内容，让其严格遵循格式
      return aiResponse;
    } catch (error) {
      console.error(`[DiarySummaryService] Error generating ${type} summary:`, error);
      return null;
    }
  }
}

export const diarySummaryService = DiarySummaryService.getInstance();