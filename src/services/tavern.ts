// 确保全局API在编译时可用
declare const TavernHelper: any;
declare const eventEmit: any;
declare const getChatMessages: (id: string) => Promise<any[]>;
declare const getCurrentMessageId: () => string;

class TavernService {
  /**
   * 从Tavern后端获取最新的消息和状态数据
   */
  async fetchTavernData() {
    console.debug('Fetching data from Tavern...');
    const messages = await getChatMessages(getCurrentMessageId());
    console.debug('Messages received:', messages);
    return messages;
  }

  /**
   * 调用AI生成回复
   * @param prompt - 发送给AI的完整提示
   * @param variables - （可选）一个用于临时覆盖本次调用上下文变量的对象
   */
  async generateAiResponse(prompt: string): Promise<string> {
    const generateConfig: any = {
      injects: [{ role: 'user', content: prompt, position: 'in_chat', should_scan: true }],
      should_stream: false,
    };

    const aiResponse = await TavernHelper.generate(generateConfig);
    if (typeof aiResponse !== 'string') {
      throw new Error('AI未能返回有效文本。');
    }
    return aiResponse;
  }

  /**
   * 调用MVU脚本更新变量
   * @param script - 要执行的MVU脚本
   * @param oldVariables - 更新前的变量状态
   */
  async invokeMvuScript(script: string, oldVariables: any): Promise<any> {
    const inputData: any = { old_variables: oldVariables };

    await eventEmit('mag_invoke_mvu', script, inputData);
    return inputData.new_variables;
  }
}

export const tavernService = new TavernService();
