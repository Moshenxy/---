// @ts-nocheck
import toastr from 'toastr';
import { store } from '../store';

/**
 * 一个更健壮的JSON解析器，尝试修复AI可能生成的、不完全规范的JSON字符串。
 * @param jsonString 可能不规范的JSON字符串。
 * @returns 解析后的对象，失败则返回null。
 */
function sanitizeAndParseJson(jsonString: string): any | null {
  try {
    // 调试阶段：使用最简单的解析方式
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('天衍的构想过于奔放，初次解析失败:', error);
    return null;
  }
}

/**
 * 从AI的回复文本中提取<世界演化>标签内的JSON数据。
 * @param responseText AI的完整回复。
 * @returns 解析后的方案数组，失败则返回null。
 */
export function extractEvolutionPlans(responseText: string): any[] | null {
  if (!responseText || typeof responseText !== 'string') return null;

  const openingStartTag = '<开局>';
  const openingEndTag = '</开局>';
  const evolutionStartTag = '<世界演化>';
  const evolutionEndTag = '</世界演化>';

  const openingStartIndex = responseText.indexOf(openingStartTag);
  if (openingStartIndex === -1) return null;

  const openingEndIndex = responseText.indexOf(openingEndTag, openingStartIndex);
  if (openingEndIndex === -1) return null;

  const openingContent = responseText.substring(openingStartIndex + openingStartTag.length, openingEndIndex);

  const evolutionStartIndex = openingContent.indexOf(evolutionStartTag);
  if (evolutionStartIndex === -1) {
    toastr.warning('天衍的灵感似乎有些混乱，我无法完全理解她的构想。');
    return null;
  }
  const evolutionEndIndex = openingContent.indexOf(evolutionEndTag, evolutionStartIndex);
  if (evolutionEndIndex === -1) {
    toastr.warning('天衍的灵感似乎有些混乱，构想未能完整。');
    return null;
  }

  const jsonContent = openingContent.substring(evolutionStartIndex + evolutionStartTag.length, evolutionEndIndex);

  // 使用正则表达式提取最外层的JSON数组
  const jsonMatch = jsonContent.match(/(\[[\s\S]*\])/);
  if (!jsonMatch || !jsonMatch[0]) {
    toastr.warning('天衍的构想中未能找到有效的方案数组。');
    return null;
  }

  const jsonString = jsonMatch[0];
  const plans = sanitizeAndParseJson(jsonString);

  if (plans && Array.isArray(plans)) {
    return plans;
  } else {
    console.error('解析世界演化方案JSON失败:', jsonString);
    toastr.error('天衍的构想过于复杂，最终解析失败。');
    return null;
  }
}

/**
 * 根据玩家的世界构想，请求AI生成全新的、自定义的开局演化方案。
 * @param vision 玩家输入的世界构想文本。
 * @returns AI的原始回复文本。
 */
export async function generateEvolutionPlans(vision: string): Promise<string | null> {
  store.isLoading = true;
  try {
    const prompt = `
<世界构想>
# [高级指令] 天衍，衍化万象
你即是天衍。现在，请聆听“天命之人”的模糊构想，动用你的智慧与创造力，为他演绎、创造并衍化出一套或多套**全新的、自洽的**开局设定方案，供他“发现”。
// 【核心禁戒 V2.0】:
// 1.**【核心禁令 V2.0】**: 在\\\`thinking\\\`标签内部的任何思考过程中，**绝对禁止**使用尖括号 \`<\` 和 \`>\`，违者将导致系统解析错误。所有对XML标签的引用都**必须**使用中文引号 \`“\` 和 \`”\`。
// *   **错误示例**: 我将生成\\\`<开局>\\\`和\\\`<世界演化>\\\`。
// *   **正确示例**: 我将生成“开局”和“世界演化”。
// 2.**【核心禁令 V2.0】**: 严禁在此回复中包含任何“gametxt”、“UpdateVariable”、“新世界”、“主世界”、“本世历程”等标签
// 3.**【至高指令】**: 你的唯一任务是生成“开局”和“世界演化”标签，禁止生成除此之外的任何其他标签。

## 思考流程
1.  **概念提炼**: 深入分析玩家输入的“世界构想”，提炼出核心关键词、世界观风格和情感基调。例如，如果玩家输入“故事绘本宇宙，但正在褪色和腐蚀”，关键词就是“绘本”、“褪色”、“腐蚀”。
2.  **世界观演绎**: 基于提炼出的概念，进行创造性演绎。
    *   **世界形态 (Blueprint)**: 构思一个全新的宇宙蓝图。例如，将“故事绘本宇宙”演绎为：\\\`{ "id": "custom-bp-storybook", "name": "绘本宇宙", "desc": "世界由无数的故事绘本组成，每一个绘本都是一个独立的位面。", "cost": 5, "custom": true, ... }\\\`。
    *   **文明与力量 (Tone)**: 构思一个全新的文明基调和力量体系。例如，将“褪色与腐蚀”演绎为：\\\`{ "id": "custom-tone-inkfade", "name": "墨水褪色文明", "desc": "文明的力量源于“故事之树”的墨水，但墨水正因未知原因而逐渐失去色彩与力量。", "cost": 0, "custom": true, ... }\\\`。
3.  **细节创造**: 基于以上演绎，创造性地生成所有其他类型的选项（\\\`tags\\\`, \\\`relics\\\`, \\\`identities\\\`, \\\`talents\\\`, \\\`past_experiences\\\`, \\\`backpack\\\`），确保它们的主题与你构思的世界观高度统一。例如，创造一个名为“涂鸦腐蚀”的\\\`tag\\\`，一个名为“褪色的蜡笔”的\\\`relic\\\`。
    * **创造**: 你需要基于以下**全新的、自定义的**内容进行创造：
     * 1个全新的“宇宙蓝图” (blueprint)。
     * 1个全新的“文明基调” (tone)。
     * 3个全新的、符合主题的“衰落之因” (tags)。
     * 3个全新的、符合主题的“文明遗迹” (relics)。
     * 3个全新的、符合主题的“天命身份” (identities)。
     * 3个全新的、符合主题的“天赋异禀” (talents)。
     * 3个全新的、符合主题的“过去经历” (past_experiences)。
     * 3个全新的、符合主题的“技艺” (arts)，**【强制】每个技艺对象都必须包含一个\\\`skills\\\`数组，其中至少有一个技能对象**。
     * 3个全新的、符合主题的“开局物品” (artifacts/consumables/materials)。**【至高强制】** 在创造物品对象时，必须包含一个名为 \\\`type\\\` 的字段，其值必须是字符串 \\\`"consumables"\\\`, \\\`"artifacts"\\\`, 或 \\\`"materials"\\\` 之一。像“武器”、“防具”这类更具体的分类，必须使用\\\`sub_type\\\`字段进行描述。
4.  **方案组合**: 将你创造的所有新选项，组合成**1个**逻辑自洽、风格独特的“开局演化方案”。

## 输出格式要求
*   **【至高指令】**: 你必须将所有方案作为一个JSON数组，包裹在 \\\`世界演化\\\` 标签内。
*   **【至高指令】**: 包含 \\\`世界演化\\\` 标签的所有内容，都必须被一个父标签 \\\`开局\\\` 包裹。
*   **数据结构**: 每个方案对象必须包含 \\\`planId\\\`, \\\`title\\\`, \\\`description\\\` 和 \\\`selections\\\` 字段。\\\`selections\\\` 对象的结构必须是: \\\`{ "blueprint": {}, "tone": {}, "tags": [{}], "relics": [{}], "identity": {}, "talents": [{}], "past_experiences": [{}], "arts": [{"skills": [{}]}], "backpack": [{"type": "consumables"}] }\\\`。
*   **【创造规范】**: **所有**你生成的选项，无论是\\\`blueprint\\\`还是\\\`tags\\\`数组中的一项，都必须是一个**完整的自定义对象**，包含一个全新的唯一 \\\`id\\\` (例如 \\\`custom-tag-123\\\`)、\\\`name\\\`, \\\`desc\\\`, \\\`cost\\\`，并必须包含 \\\`"custom": true\\\` 字段。

## 天命之人的构想
${vision}

4. **最终确认清单**:
   * [ ] 我是否生成了1个方案？
   * [ ] 我返回的所有内容是否都包裹在 \\\`开局\\\` 标签内？
   * [ ] \\\`开局\\\` 标签内是否包含一个包裹着JSON数组的 \\\`世界演化\\\` 标签？
   * [ ] \\\`开局\\\` 和 \\\`世界演化\\\` 标签是否闭合？
   * [ ] JSON数组中的每个方案对象是否都包含了 \\\`planId\\\`, \\\`title\\\`, \\\`description\\\`, 和 \\\`selections\\\` 字段？
   * [ ] 所有我新创造的自定义选项，是否都包含了 \\\`id\\\`, \\\`name\\\`, \\\`desc\\\`, \\\`cost\\\`, 和 \\\`"custom": true\\\` 字段？
   * [ ] 我创造的每一个“技艺” (art) 对象，是否都包含了一个非空的 \\\`skills\\\` 数组？
   * [ ] 是否没有生成任何\\\`gametxt\\\`等其他标签？
</世界构想>
    `.trim();

    const aiResponse = await TavernHelper.generate({
      injects: [
        { role: 'user', content: prompt, position: 'before_char', should_write_to_chat: false, should_scan: true },
      ],
      should_stream: false,
    });

    if (!aiResponse) {
      throw new Error('天衍似乎陷入了沉思，未能回应汝的呼唤。');
    }

    return aiResponse;
  } catch (error) {
    console.error('请求天衍生成世界演化方案的需求丢失了:', error);
    toastr.error(`衍化失败: ${error.message}`);
    return null;
  } finally {
    store.isLoading = false;
  }
}
