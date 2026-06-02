import { useSettingsStore } from '../store/settingsStore';
import { debugService } from './DebugService';

/**
 * @class StateUpdateService
 * @description 负责在主AI生成叙事后，调用“分析AI”来解析叙事并生成MVU字符串，
 * 然后将该字符串追加到主AI消息后，并触发MVU解析以更新状态。
 */
class StateUpdateService {
  private isUpdating = false; // 防重入锁

  public init() {
    console.log('[StateUpdateService] Initializing...');
    eventOn(tavern_events.GENERATION_ENDED, async (messageId: number) => {
      if (this.isUpdating) {
        console.log('[StateUpdateService] Update already in progress. Skipping recursive event.');
        return;
      }
      await this.handleNewMessage(messageId);
    });
    console.log('[StateUpdateService] Initialized and listening for new messages.');
  }

  private async handleNewMessage(messageId: number) {
    // 添加一个短暂的延迟，以确保在读取消息和上下文之前，Tavern 的所有内部状态都已同步完成。
    // 这是一个解决异步时序问题的常用方法。
    await new Promise(resolve => setTimeout(resolve, 100));

    this.isUpdating = true;
    try {
      console.log(`[StateUpdateService] handleNewMessage for messageId: ${messageId}`);
      const messages = await getChatMessages(messageId);
      if (!messages || messages.length === 0) {
        console.warn(`[StateUpdateService] No message found for messageId: ${messageId}`);
        return;
      }
      const message = messages[0];

      if (message.role !== 'assistant' || !message.message) {
        console.log('[StateUpdateService] Message is not from assistant or is empty. Aborting.');
        return;
      }

      // 仅处理不包含MVU指令的消息，避免循环
      if (message.message.includes('<[')) {
        console.log('[StateUpdateService] Message already contains MVU commands. Skipping.');
        return;
      }

      const rulesText = await this.getUpdateRules();
      if (!rulesText) {
        console.error('[StateUpdateService] Update rules are empty. Aborting state update.');
        return;
      }

      const storyText = message.message;
      const mainAiContext = debugService.getLastContext();
      const mvuString = await this.callAnalysisApi(storyText, rulesText, mainAiContext);

      if (mvuString) {
        await this.applyMvuUpdate(mvuString, message);
        toastr.success('[状态更新完成]');
      } else {
        console.warn('[StateUpdateService] Analysis API returned no MVU string. Nothing to apply.');
      }
    } catch (error) {
      console.error('[StateUpdateService] An error occurred during the state update process:', error);
      toastr.error('[状态更新失败]');
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * @description 获取用于指导“分析AI”的变量更新规则。
   * 它会动态地从世界书中查找所有相关的规则条目并拼接它们。
   * @returns {Promise<string>} 变量更新规则的文本内容。
   */
  private async getUpdateRules(): Promise<string> {
    try {
      const charWorldbooks = getCharWorldbookNames('current');
      const worldbookNames = [charWorldbooks.primary, ...charWorldbooks.additional].filter(Boolean) as string[];
      console.log('[StateUpdateService] Found worldbooks:', worldbookNames);

      if (worldbookNames.length === 0) {
        console.warn('[StateUpdateService] No worldbooks are bound to the current character.');
        return '';
      }

      const allEntriesPromises = worldbookNames.map(name => getWorldbook(name));
      const allEntriesArrays = await Promise.all(allEntriesPromises);
      const allEntries = allEntriesArrays.flat();

      const ruleKeywords = ['[cot]数据精算室', '[mvu_update]'];
      const filteredEntries = allEntries.filter((entry: WorldbookEntry) => {
        const hasKeyword = ruleKeywords.some(keyword => entry.name.includes(keyword));
        return hasKeyword;
      });

      console.log('[StateUpdateService] Filtered rule entries:', filteredEntries);

      const rulesContent = filteredEntries
        .sort((a: WorldbookEntry, b: WorldbookEntry) => (b.position.order ?? 0) - (a.position.order ?? 0))
        .map((entry: WorldbookEntry) => entry.content)
        .join('\n\n---\n\n');

      console.log('[StateUpdateService] Final rules content:', rulesContent);
      return rulesContent;
    } catch (error) {
      console.error('[StateUpdateService] An error occurred while getting update rules:', error);
      return '';
    }
  }

  /**
   * @description 构建提示词并调用外部的“分析AI” API。
   * @param {string} storyText - 主AI生成的叙事文本。
   * @param {string} rulesText - 变量更新规则文本。
   * @param {object | null} mainAiContext - 主AI使用的上下文。
   * @returns {Promise<string | null>} - 返回MVU字符串，如果失败则返回null。
   */
  private async callAnalysisApi(
    storyText: string,
    rulesText: string,
    mainAiContext: object | null,
  ): Promise<string | null> {
    const settingsStore = useSettingsStore();
    const { url, apiKey, model } = settingsStore.settings;

    if (!apiKey) {
      console.warn('[StateUpdateService] Analysis API key is not set. Skipping state update.');
      return null;
    }

    const prompt = `
# Role: World State Analyst
You are a precise data analysis engine. Your sole task is to read the provided story text and, according to the strict update rules, generate an MVU (Malleable Variable Unit) string to reflect the changes in the world state.

## Main AI Context
This is the full context provided to the main AI for generating the story text. Use it to understand the situation better.
\`\`\`json
${JSON.stringify(mainAiContext, null, 2)}
\`\`\`

## Update Rules
\`\`\`
${rulesText}
\`\`\`

## Story Text
This is the response from the main AI.
\`\`\`
${storyText}
\`\`\`

    `;

    try {
      console.log('[StateUpdateService] Sending prompt to analysis API via generateRaw():', prompt);

      const aiResponse = await generateRaw({
        ordered_prompts: [{ role: 'user', content: prompt }],
        custom_api: {
          apiurl: url,
          key: apiKey,
          model: model,
        },
      });

      if (!aiResponse || typeof aiResponse !== 'string') {
        throw new Error(`[StateUpdateService] Analysis API returned empty or invalid content. Received: ${aiResponse}`);
      }

      console.log('[StateUpdateService] Received raw response from analysis API:', aiResponse);
      return aiResponse.trim();
    } catch (error) {
      console.error('[StateUpdateService] Failed to call analysis API or parse response:', error);
      return null;
    }
  }

  /**
   * @description 将MVU字符串应用到消息楼层并触发解析。
   * @param {string} mvuString - 从分析AI获取的MVU字符串。
   * @param {ChatMessage} originalMessage - 原始消息对象。
   */
  private async applyMvuUpdate(mvuString: string, originalMessage: ChatMessage) {
    try {
      const messageId = originalMessage.message_id;
      console.log(`[StateUpdateService] Applying MVU update for messageId: ${messageId}`, mvuString);

      // 1. 将MVU字符串追加到原始消息后面
      const newContent = originalMessage.message + mvuString;

      // 2. 更新酒馆中的消息内容
      await setChatMessages([{ message_id: messageId, message: newContent }]);
      console.log(`[StateUpdateService] Message ${messageId} content updated.`);

      // 3. 手动触发MVU解析
      await waitGlobalInitialized('Mvu');
      const oldData = Mvu.getMvuData({ type: 'message', message_id: messageId });
      const newData = await Mvu.parseMessage(newContent, oldData);
      await Mvu.replaceMvuData(newData, { type: 'message', message_id: messageId });

      console.log(`[StateUpdateService] MVU update applied and parsed successfully for message: ${messageId}`);
    } catch (error) {
      console.error('[StateUpdateService] Failed to apply MVU update:', error);
    }
  }
}

// 实例化并导出，确保全局单例
export const stateUpdateService = new StateUpdateService();
