/**
 * @file 日记应用相关服务
 * @description 负责处理日记内容的获取、AI总结生成、数据持久化等业务逻辑
 */

import * as toastr from 'toastr';

class DiaryService {
  private static instance: DiaryService;

  private constructor() {
    // 私有构造函数，确保单例
  }

  public static getInstance(): DiaryService {
    if (!DiaryService.instance) {
      DiaryService.instance = new DiaryService();
    }
    return DiaryService.instance;
  }

  public async generateSummary(entries: any[], type: 'small' | 'large'): Promise<string> {
    if (!entries || entries.length === 0) {
      return '没有可供总结的日记内容。';
    }

    const rawContent = entries.map(e => e.raw).join('\n');
    const prompt = this.buildSummaryPrompt(rawContent, type);

    try {
      const aiResponse = await TavernHelper.generate({
        injects: [
          {
            role: 'user',
            content: prompt,
            position: 'none',
            depth: 0,
          },
        ],
        should_stream: false,
      });
      // 简单提取，后续可以做得更精细
      return aiResponse.match(/<总结>([\s\S]*?)<\/总结>/)?.[1].trim() || aiResponse;
    } catch (error) {
      console.error(`生成${type === 'small' ? '小' : '大'}总结失败:`, error);
      return `AI无法生成总结，请稍后再试。`;
    }
  }

  private buildSummaryPrompt(content: string, type: 'small' | 'large'): string {
    if (type === 'small') {
      return `
        # 任务：生成小总结
        请根据以下日记内容，提取近期发生的 **关键事件**、**新认识的重要人物**、以及主角 **情绪的重大转折点**。
        要求语言精炼，概括性强，字数控制在200字以内。
        请将总结内容包裹在 <总结> 标签内。

        ## 日记原文:
        ${content}
      `;
    } else {
      return `
        # 任务：生成大总结
        请通读以下全部日记内容，梳理出这段时期内 **最主要的故事线**、**核心人物关系的变化**（例如从陌生到熟悉，从朋友到恋人等）、以及主角的 **个人成长与核心困境**。
        要求有宏观视角，能抓住主要矛盾和发展脉络，字数在400字左右。
        请将总结内容包裹在 <总结> 标签内。

        ## 日记原文:
        ${content}
      `;
    }
  }

  public async updateLogFromSummary(
    originalEntries: any[],
    updatedSummary: string,
    type: 'small' | 'large',
  ): Promise<void> {
    const prompt = this.buildUpdatePrompt(originalEntries, updatedSummary, type);

    try {
      const aiResponse = await TavernHelper.generate({
        injects: [
          {
            role: 'user',
            content: prompt,
            position: 'none',
            depth: 0,
          },
        ],
        should_stream: false,
      });

      const mvuScript = aiResponse.match(/<UpdateVariable>([\s\S]*?)<\/UpdateVariable>/)?.[1].trim();
      if (mvuScript) {
        // In a real scenario, we would execute this script.
        // For now, we'll just log it.
        console.log('[DiaryService] Generated MVU script for update:', mvuScript);
        // await invokeMvuScript(mvuScript, store.worldState);
        toastr.success('原始日记已根据您的总结智能更新！');
      } else {
        toastr.warning('AI未能生成更新指令。');
      }
    } catch (error) {
      console.error(`从${type}总结更新日志失败:`, error);
      toastr.error('从总结更新日志失败。');
    }
  }

  private buildUpdatePrompt(originalEntries: any[], updatedSummary: string, type: 'small' | 'large'): string {
    const originalContent = originalEntries.map(e => e.raw).join('\n');

    return `
      # 任务：智能更新原始日志
      你是一个强大的文本分析与重构AI。用户的总结是对原始日志的修正和提炼。
      请仔细比对“修改后的总结”与“原始日志”，找出其中的 **事实性差异**。
      然后，生成一个 \`<UpdateVariable>\` 代码块，用 \`_.set\` 指令来修改原始的 \`校园日志-主\` 世界书条目，使其内容与修改后的总结保持一致。

      ## 规则:
      - 只针对事实性内容的修改生成指令（例如，人物、地点、事件结果的变更）。
      - 忽略纯粹的措辞、风格或顺序上的调整。
      - 你的目标是更新 \`校园日志-主\` 的内容，所以 \`_.set\` 的路径应该是 \`世界状态.['校园日志-主'].content\`。
      - 你需要提供完整的、更新后的所有日志内容。

      ## 修改后的${type === 'small' ? '小' : '大'}总结:
      ${updatedSummary}

      ## 原始日志内容:
      ${originalContent}
    `;
  }
}

export const diaryService = DiaryService.getInstance();
