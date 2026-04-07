import { TavernService } from '../services/tavern.service';
import { EpisodicMemoryUnitSchema } from '../types';
import { log } from '../utils/logger';

// 用于从消息中提取 <memory_log> 标签内容的正则表达式
const MEMORY_LOG_REGEX = /<memory_log>([\s\S]*?)<\/memory_log>/;

/**
 * @file message-handler.ts
 * @description 监听消息更新，解析其中的记忆日志，并将其存入世界书。
 */
export class MessageHandler {
  private static stopListeningFn: (() => void) | null = null;

  /**
   * 处理新更新的聊天消息。
   * @param messageId - 酒馆助手传递的消息ID。
   */
  private static async handleNewMessage(messageId: number) {
    const messages = getChatMessages(messageId);
    if (!messages || messages.length === 0) return;
    
    const message = messages[0];
    // 我们只关心由AI生成的消息 (assistant role)
    if (message.role !== 'assistant') {
      return;
    }

    log(`[MessageHandler] 正在处理更新后的消息 (ID: ${messageId}):`, message.message);

    const match = message.message.match(MEMORY_LOG_REGEX);
    if (!match || !match[1]) {
      return;
    }

    log('在AI回复中找到 <memory_log> 标签，开始保存记忆...');
    const jsonString = match[1];

    try {
      const memoryJson = JSON.parse(jsonString);
      
      // Inject the message ID before validation
      memoryJson.created_at_message_id = messageId;

      const validationResult = EpisodicMemoryUnitSchema.safeParse(memoryJson);

      if (!validationResult.success) {
        console.error('[MessageHandler] <memory_log> JSON 格式无效:', validationResult.error.flatten());
        toastr.error('记忆日志格式错误，无法保存。');
        return;
      }

      const memoryUnit = validationResult.data;
      if (memoryUnit.type === 'semantic') {
        return;
      }

      await TavernService.saveMemory({
        type: 'episodic',
        content: memoryUnit,
      });
      log('情景记忆已成功存入世界书。');
    } catch (error) {
      console.error('[MessageHandler] 解析 <memory_log> JSON 失败:', error);
      toastr.error('解析记忆日志时出错。');
    }
  }

  /**
   * 开始监听聊天消息。
   */
  public static startListening() {
    this.stopListening();
    if (typeof eventOn !== 'function') {
      console.error('[MessageHandler] eventOn function is not available.');
      return;
    }
    // 监听 GENERATION_ENDED，它在一次完整的生成结束后触发
    this.stopListeningFn = eventOn(tavern_events.GENERATION_ENDED, this.handleNewMessage.bind(this)).stop;
    log('已启动记忆日志监听器 (GENERATION_ENDED)。');
  }

  /**
   * 停止监听聊天消息。
   */
  public static stopListening() {
    if (this.stopListeningFn) {
      this.stopListeningFn();
      this.stopListeningFn = null;
    }
  }
}
