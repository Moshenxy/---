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
    console.log('Fetching data from Tavern...');
    const messages = await getChatMessages(getCurrentMessageId());
    console.log('Messages received:', messages);
    return messages;
  }

  /**
   * 调用AI生成回复
   * @param prompt - 发送给AI的完整提示
   */
  async generateAiResponse(prompt: string): Promise<string> {
    const generateConfig = {
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

    // --- Start of AI Script Fix ---
    let processedScript = script.replace(/「|」/g, "'"); // Fix invalid quotes

    const creationLine = /_.assign\('角色', '(.+?)', {}\);/g;
    const match = creationLine.exec(processedScript);

    if (match) {
      const charName = match[1];
      const setLines = new RegExp(`_.set\\('角色\\\\.${charName}\\\\.([^']*)', (.*?)\\);`, 'g');

      let userObjectString = `let user = {};\n`;
      let lineMatch;
      while ((lineMatch = setLines.exec(processedScript)) !== null) {
        const prop = lineMatch[1];
        const value = lineMatch[2];
        userObjectString += `user['${prop}'] = ${value};\n`;
      }
      userObjectString += `_.assign('角色', '${charName}', user);`;

      processedScript = processedScript.replace(creationLine, '');
      processedScript = processedScript.replace(setLines, '');
      processedScript += `\n${userObjectString}`;
    }
    // --- End of AI Script Fix ---

    await eventEmit('mag_invoke_mvu', processedScript, inputData);
    return inputData.new_variables;
  }
}

export const tavernService = new TavernService();
