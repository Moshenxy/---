import { useSettingsStore } from '../ui/store';
import { pinia } from '../ui';
import { AiService } from '../services/ai.service';
import { TavernService } from '../services/tavern.service';
import { log } from '../utils/logger';
import narratorCot from '../templates/narrator.txt?raw';
import cognitiveIsolationCot from '../templates/cognitive_isolation.txt?raw';
import dynamicExpressionCot from '../templates/dynamic_expression.txt?raw';

/**
 * @file preprocessor-handler.ts
 * @description 通过“分析-注入”模型，增强酒馆主AI的上下文。
 */
export class PreprocessorHandler {
  private static stopListener: (() => void) | null = null;
  private static isBusy = false;

  /**
   * 在酒馆准备生成最终提示词时触发，用于注入上下文。
   * @param generate_data - 包含提示词各部分内容的可变对象。
   * @param dry_run - 是否为“演习”模式。
   */
  private static async handlePreprocess(generate_data: { prompt: SillyTavern.SendingMessage[] }, dry_run: boolean) {
    if (dry_run || this.isBusy) return;
    this.isBusy = true;

    try {
      log('开始上下文预处理...');
      
      const latestMessage = getChatMessages(-1)?.[0];
      if (!latestMessage || latestMessage.role !== 'user' || typeof latestMessage.message !== 'string') {
        this.isBusy = false;
        return;
      }
      const originalUserInput = latestMessage.message;
      
      const userPromptToModify = generate_data.prompt.slice().reverse().find(p => p.role === 'user');
      if (!userPromptToModify || typeof userPromptToModify.content !== 'string') {
        this.isBusy = false;
        return;
      }

      const recentMemories = await TavernService.getRecentMemories(10);
      
      if (!pinia) throw new Error('Pinia store not initialized.');
      const settingsStore = useSettingsStore(pinia);
      const systemCots = `
# 认知隔离协议
${cognitiveIsolationCot}

# 动态表达协议
${dynamicExpressionCot}
`;

      const analystResponse = await AiService.callAnalystSage(
        settingsStore.apiSettings,
        originalUserInput,
        {},
        recentMemories,
        systemCots,
      );

      if (analystResponse.reflection_output) {
        const { new_cognitions, nature_update_suggestion } = analystResponse.reflection_output;
        if (new_cognitions?.length) {
          for (const cognition of new_cognitions) {
            await TavernService.saveMemory({ type: 'cognition', ...cognition });
          }
        }
        if (nature_update_suggestion) {
          const charName = getCharData('current')?.name;
          if (charName) {
            await TavernService.saveMemory({ type: 'nature', subject: charName, content: nature_update_suggestion });
          }
        }
        log('后台反思结果已保存。');
      }

      userPromptToModify.content = `"${originalUserInput}"
以上为用户输入的对话与行动。

下述为相关记忆与分析：
${JSON.stringify(analystResponse, null, 2)}`;
      log('已成功向用户输入注入分析上下文。');

      const systemPrompt = generate_data.prompt.find(p => p.role === 'system');
      if (systemPrompt && typeof systemPrompt.content === 'string') {
        systemPrompt.content += `\n\n${systemCots}\n\n${narratorCot}`;
        log('已成功向系统提示词注入基础COT和叙事COT。');
      }
      
    } catch (error) {
      console.error('[PreprocessorHandler] 处理注入逻辑时出错:', error);
      toastr.error('记忆插件上下文注入失败。');
    } finally {
      this.isBusy = false;
    }
  }

  public static startListening() {
    this.stopListening();
    if (typeof eventOn !== 'function') return;
    this.stopListener = eventOn('generate_after_data', this.handlePreprocess.bind(this) as (generate_data: { prompt: SillyTavern.SendingMessage[]; }, dry_run: boolean) => void).stop;
    log('已启动“分析-注入”预处理器。');
  }

  public static stopListening() {
    this.stopListener?.();
    this.stopListener = null;
  }
}
