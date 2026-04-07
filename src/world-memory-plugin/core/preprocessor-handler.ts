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
      
      if (!pinia) throw new Error('Pinia store not initialized.');
      const settingsStore = useSettingsStore(pinia);
      const contextLines = settingsStore.advancedSettings.contextChatLines || 5;
      const recentMemoriesCount = settingsStore.advancedSettings.recentMemoriesCount || 10;

      // 获取最近的 N 条消息作为上下文，以便分析AI能理解语境
      const recentChatMessages = getChatMessages(`-${contextLines}-{{lastMessageId}}`);
      if (!recentChatMessages || recentChatMessages.length === 0) {
        this.isBusy = false;
        return;
      }

      // 找到最后一条用户消息作为 originalUserInput
      // 即使最后一条消息是 assistant (例如在重新生成时)，我们也需要找到触发这次生成的最后一条用户消息
      const lastUserMessage = recentChatMessages.slice().reverse().find(m => m.role === 'user');
      if (!lastUserMessage || typeof lastUserMessage.message !== 'string') {
        this.isBusy = false;
        return;
      }
      const originalUserInput = lastUserMessage.message;

      // 构建对话上下文
      const chatContext = recentChatMessages.map(msg => ({
        role: msg.role,
        name: msg.name,
        content: msg.message
      }));
      
      const userPromptToModify = generate_data.prompt.slice().reverse().find(p => p.role === 'user');
      if (!userPromptToModify || typeof userPromptToModify.content !== 'string') {
        this.isBusy = false;
        return;
      }

      const recentMemories = await TavernService.getRecentMemories(recentMemoriesCount);
      const currentCognitions = await TavernService.getAllCognitions();
      const currentNature = await TavernService.getNature() || [];
      const systemCots = `
# 认知隔离协议
${cognitiveIsolationCot}

# 动态表达协议
${dynamicExpressionCot}
`;

      const analystResponse = await AiService.callAnalystSage(
        settingsStore.apiSettings,
        originalUserInput,
        { recent_chat_history: chatContext },
        recentMemories,
        systemCots,
        currentCognitions,
        currentNature
      );

      if (analystResponse.reflection_output) {
        const { new_cognitions, cognitive_shifts, nature_shifts, nature_update_suggestion, promotion_candidates } = analystResponse.reflection_output;
        
        // 1. 保存新认知
        if (new_cognitions?.length) {
          for (const cognition of new_cognitions) {
            await TavernService.saveMemory({ type: 'cognition', ...cognition });
          }
        }

        // 1.5 处理认知演化
        if (cognitive_shifts?.length) {
          const worldbookName = await TavernService.getTargetWorldbookName();
          for (const shift of cognitive_shifts) {
            await TavernService.applyCognitiveShift(worldbookName, shift);
          }
        }

        // 1.7 处理本性蜕变
        if (nature_shifts?.length) {
          const worldbookName = await TavernService.getTargetWorldbookName();
          for (const shift of nature_shifts) {
            await TavernService.applyNatureShift(worldbookName, shift);
          }
        }
        
        // 2. 处理旧版兼容的本性更新建议
        if (nature_update_suggestion) {
          const charName = getCharData('current')?.name;
          if (charName) {
            await TavernService.saveMemory({ type: 'nature', subject: charName, content: nature_update_suggestion });
          }
        }

        // 3. 处理晋升候选
        if (promotion_candidates?.length) {
          const charName = getCharData('current')?.name || 'default';
          for (const candidate of promotion_candidates) {
            if (candidate.type === 'memory_to_cognition') {
              await TavernService.promoteMemoryToCognition(
                candidate.source_memory_ids,
                candidate.target_cognition_content,
                candidate.subject,
                candidate.keywords
              );
            } else if (candidate.type === 'cognition_to_nature') {
              await TavernService.promoteCognitionToNature(
                charName,
                candidate.source_cognition_content,
                candidate.target_nature_content,
                candidate.trait_name,
                candidate.elaboration || '',
                candidate.behavioral_impact || '',
                candidate.supporting_memories
              );
            }
          }
        }

        log('后台反思与晋升结果已处理。');
      }

      userPromptToModify.content = `"${originalUserInput}"
以上为用户输入的对话与行动。

下述为相关记忆与分析：
${JSON.stringify(analystResponse, null, 2)}`;
      log('已成功向用户输入注入分析上下文。');

      // 将 CoT 作为独立的 system 消息注入到最末尾 (深度 0)，以获得最高指令权重
      generate_data.prompt.push({
        role: 'system',
        content: `${systemCots}\n\n${narratorCot}`
      });
      log('已成功将基础COT和叙事COT作为独立系统提示词注入到末尾(深度0)。');
      
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
