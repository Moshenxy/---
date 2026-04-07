import analystCot from '../templates/analyst.txt?raw';
import synthesisCot from '../templates/synthesis.txt?raw';
import {
  AnalystResponseSchema,
  SynthesisResponseSchema,
  type AnalystResponse,
  type ApiSettings,
  type EpisodicMemoryUnit,
  type SynthesisResponse,
} from '../types';
import { log } from '../utils/logger';

/**
 * @file ai.service.ts
 * @description 封装对第三方 AI (分析AI) 的调用。
 * 使用酒馆内置的 `generateRaw` 函数作为代理，以解决CORS问题。
 */
export class AiService {
  /**
   * 调用分析AI来获取检索计划。
   * @param apiSettings - 用户的API配置。
   * @param userInput - 用户的当前输入。
   * @param context - 附加的上下文信息。
   * @returns 返回一个包含检索计划的 Promise。
   */
  public static async callAnalystSage(
    apiSettings: ApiSettings,
    userInput: string,
    context: any,
    recentMemories: EpisodicMemoryUnit[],
    systemCots: string = '',
    currentCognitions: any[] = [],
    currentNature: any[] = [],
  ): Promise<AnalystResponse> {
    const { apiUrl, apiKey, model } = apiSettings;

    if (!apiUrl || !apiKey || !model) {
      const errorMessage = 'API URL, API Key, 或模型名称未设置。请在设置中配置。';
      toastr.error(errorMessage);
      throw new Error(errorMessage);
    }

    const systemPrompt = `${systemCots}\n\n${analystCot}`;

    // 为了节省token，只传递记忆的ID和摘要
    const memorySummaries = recentMemories.map(mem => ({
      id: mem.id,
      summary: mem.summary,
    }));

    const userMessage = `
[现有本性]
${JSON.stringify(currentNature, null, 2)}

[现有认知]
${JSON.stringify(currentCognitions, null, 2)}

[最近的记忆]
${JSON.stringify(memorySummaries, null, 2)}

[当前情境]
${JSON.stringify(context, null, 2)}

[<user>输入]
${userInput}
`;

    log('正在通过 generateRaw() 函数调用分析/反思AI...', { model });

    try {
      if (typeof generateRaw !== 'function') {
        throw new Error('`generateRaw` function is not available.');
      }

      const ordered_prompts: RolePrompt[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ];

      // 使用 generateRaw 函数作为代理来发送请求
      const aiResponse = await generateRaw({
        ordered_prompts,
        custom_api: {
          apiurl: apiUrl,
          key: apiKey,
          model: model,
        },
      });

      if (!aiResponse) {
        throw new Error('分析AI返回了空内容。');
      }

      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
      if (!jsonMatch || (!jsonMatch[1] && !jsonMatch[2])) {
        throw new Error(`无法从AI回复中提取JSON: ${aiResponse}`);
      }
      const jsonString = jsonMatch[1] || jsonMatch[2];

      const responseJson = JSON.parse(jsonString);
      const validationResult = AnalystResponseSchema.safeParse(responseJson);

      if (!validationResult.success) {
        console.error('[AiService] 分析/反思AI返回的JSON格式无效:', validationResult.error.flatten());
        throw new Error('分析/反思AI返回了无效的JSON格式。');
      }

      log('成功获取并验证了分析/反思结果:', validationResult.data);
      return validationResult.data;
    } catch (error) {
      console.error('[AiService] 调用分析AI时出错:', error);
      toastr.error('调用分析AI失败。');
      throw error;
    }
  }
  /**
   * 从指定的API端点获取可用的模型列表。
   * @param apiSettings - 用户的API配置。
   * @returns 返回一个包含模型名称的字符串数组。
   */
  public static async fetchAvailableModels(apiSettings: ApiSettings): Promise<string[]> {
    const { apiUrl, apiKey } = apiSettings;

    if (!apiUrl || !apiKey) {
      toastr.error('API URL 或 API Key 未设置。');
      return [];
    }

    // 规范化URL，确保它指向 /models 端点
    let modelsUrl = apiUrl.trim();
    if (modelsUrl.endsWith('/')) {
      modelsUrl = modelsUrl.slice(0, -1);
    }
    if (modelsUrl.endsWith('/v1')) {
      modelsUrl += '/models';
    } else if (!modelsUrl.endsWith('/models')) {
      // 这是一个最佳猜测，适用于大多数兼容OpenAI的API
      modelsUrl += '/v1/models';
    }

    log(`正在从 ${modelsUrl} 获取模型列表...`);

    try {
      const response = await fetch(modelsUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`网络请求失败，状态码: ${response.status}`);
      }

      const json = await response.json();

      // 兼容标准的OpenAI API响应格式
      if (Array.isArray(json.data)) {
        const modelIds = json.data.map((model: any) => model.id).filter(Boolean);
        log(`成功获取到 ${modelIds.length} 个模型。`);
        return modelIds;
      }

      throw new Error('API响应格式不兼容，无法找到模型数据。');
    } catch (error) {
      let errorMessage = '获取模型列表时发生未知错误。';
      if (error instanceof Error) {
        errorMessage = `获取模型列表失败: ${error.message}`;
      }
      console.error('[AiService] 获取模型列表时出错:', error);
      toastr.error(errorMessage);
      return [];
    }
  }

  /**
   * 调用创生AI来生成初始人格。
   * @param apiSettings - 用户的API配置。
   * @param characterContext - 角色的核心设定。
   * @returns 返回一个包含待创建条目的数组。
   */
  public static async callSynthesisAI(
    apiSettings: ApiSettings,
    characterContext: any,
    systemCots: string = '',
  ): Promise<SynthesisResponse> {
    const { apiUrl, apiKey, model } = apiSettings;

    if (!apiUrl || !apiKey || !model) {
      throw new Error('API URL, API Key, 或模型名称未设置。');
    }

    const systemPrompt = `${systemCots}\n\n${synthesisCot}`;
    const userMessage = `
[角色核心设定]
${JSON.stringify(characterContext, null, 2)}
`;
    log('正在调用创生AI...', { model });

    try {
      const aiResponse = await generateRaw({
        ordered_prompts: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        custom_api: {
          apiurl: apiUrl,
          key: apiKey,
          model: model,
          // 为创生过程使用更高的温度以增加创造力
          temperature: 0.8,
        },
      });

      if (!aiResponse) throw new Error('创生AI返回了空内容。');

      log('【创生AI原始返回】:', aiResponse);
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```|(\[[\s\S]*\])/);
      if (!jsonMatch || (!jsonMatch[1] && !jsonMatch[2])) {
        throw new Error(`无法从AI回复中提取JSON数组: ${aiResponse}`);
      }
      let jsonString = jsonMatch[1] || jsonMatch[2];

      // Sanitize the JSON string to remove trailing commas which are invalid in strict JSON
      jsonString = jsonString.replace(/,\s*(}|])/g, '$1');

      const responseJson = JSON.parse(jsonString);
      const validationResult = SynthesisResponseSchema.safeParse(responseJson);

      if (!validationResult.success) {
        console.error('[AiService] 创生AI返回的JSON格式无效:', validationResult.error.flatten());
        throw new Error('创生AI返回了无效的JSON格式。');
      }

      log('成功获取并验证了人格创生数据。');
      return validationResult.data;
    } catch (error) {
      console.error('[AiService] 调用创生AI时出错:', error);
      toastr.error(`人格创生失败: ${error instanceof Error ? error.message : '未知错误'}`);
      throw error;
    }
  }
}
