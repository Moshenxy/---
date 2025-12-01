// @ts-nocheck
import toastr from 'toastr';
import { GAME_DATA, store } from '../store';
import { readFromLorebook, writeToLorebook } from './LorebookService';

// 辅助函数区域
const formatSingleItem = item => {
  if (!item) return '未选择';
  if (item.custom && item.desc) {
    return `${item.name}\n    - 详情: ${item.desc}`;
  }
  return item.name;
};

const formatItemList = (selectedItems, type) => {
  if (!selectedItems || selectedItems.length === 0) return '无';
  return (
    '\n' +
    selectedItems
      .map(item => {
        if (!item) return '';
        let details = `  - ${item.name}`;
        if (item.desc) {
          details += `\n    - 详情: ${item.desc}`;
        }
        if (type === 'arts' && item.skills && item.skills.length > 0) {
          details +=
            `\n    - 初始技能:\n` + item.skills.map(skill => `      - ${skill.name}: ${skill.desc || ''}`).join('\n');
        }
        return details;
      })
      .filter(Boolean)
      .join('\n')
  );
};

const formatBackpack = () => {
  const contents = [];
  const { backpack } = store.selections;
  const allItems = [...GAME_DATA.consumables, ...GAME_DATA.artifacts, ...GAME_DATA.materials];
  for (const itemId in backpack) {
    const item = allItems.find(i => i.id === itemId);
    if (item) {
      contents.push(`  - ${item.name} x${backpack[itemId]}`);
    }
  }
  return contents.length > 0 ? '\n' + contents.join('\n') : '无';
};

export async function buildWorld() {
  store.isGenerating = true;
  try {
    const { selections } = store;
    const { blueprints, tones, tags, relics } = GAME_DATA;

    const blueprint = blueprints.find(b => b.id === selections.blueprint);
    const tone = tones.find(t => t.id === selections.tone);
    const selectedTags = tags.filter(t => selections.tags.includes(t.id));
    const selectedRelics = relics.filter(r => selections.relics.includes(r.id));

    const worldInput = `
    ### 世界构筑
    - **宇宙蓝图**: ${formatSingleItem(blueprint)}
    - **文明基调**: ${formatSingleItem(tone)}
    - **衰落之因**: ${formatItemList(selectedTags)}
    - **文明遗迹**: ${formatItemList(selectedRelics)}
    `.trim();

    const prompt = `
  “构筑世界”
  # [第一步指令] 天衍，构筑世界
  **你即是天衍，现在，请严格依据下方“世界道标”，仅创造和固化“主世界”的设定。**
  ## 核心规则
  1.  **【核心禁令 V2.0】**: 在“thinking”标签内部的任何思考过程中，**绝对禁止**使用尖括号 “<” 和 “>”，违者将导致系统解析错误。所有对XML标签的引用都**必须**使用中文引号 “““ 和 ”””。
      *   **错误示例**: 我将生成“<game-txt>”和“<UpdateVariable>”。
      *   **正确示例**: 我将生成“gametxt”和“UpdateVariable”。
  2.  **【核心禁令 V2.0】**: **禁止在正文（被gametxt包裹的内容）以外生成除了汉语和英语以外的语言**
  3.  **专注世界**: 你的任务是创造世界，**绝对禁止**生成任何角色相关变量(\`角色\`)或开局故事(\`gametxt\`)。
  4.  **【至高指令】**: 你的回复中，**只允许**出现 \`thinking\` 和 \`主世界\` 这两个标签。严禁生成任何其他标签。
  4.  **【至高指令】**: 你的回复中，**只允许**出现 \`thinking\` 和 \`主世界\` 这两个标签。严禁生成任何其他标签。
  4.  **【至高指令】**: 你的回复中，**只允许**出现 \`thinking\` 和 \`主世界\` 这两个标签。严禁生成任何其他标签。
  5.  **返回确认**: 完成世界构筑后，你必须在响应中返回两个标签，并闭合对应标签：
      *   \`主世界\`: 内部包含你生成的、严格遵循以下格式和规则的yaml格式的世界自动化规则，供用户预览，**绝对禁止省略任何字段**：
          自动化规则:
            基础信息: {ID, 名称, 描述}
            元规则: {宇宙蓝图, 物理尺度, 支持纪元穿越}
            历史纪元:
              - 纪元ID: ...
                纪元名称: ...
                可扮演: true
                纪元概述: ...
                规则:
                  世界能级: ...
                  时间流速: ...
                  空间稳定性: ...
                  生命位格: { 基准值, 描述 }
                  核心法则:
                    - { 名称, 描述, 体现 }
                  权柄:
                    - { ID, 名称, 类型, 描述, 显化能级: { 当前能级, 能级上限, 影响 } }
                内容:
                  空间实体:
                    - { ID, 名称, 层级类型, 所属: { ID, 类型 }, 面积, 描述, 相对坐标: { 参考ID, 方位, 距离 } }
                  文明:
                    势力:
                      - { ID, 名称, 类型, 核心目标 }
                  历史:
                    历史纪元:
                      - { 纪元名称, 起止时间, 简述, 历史遗留问题 }
                力量体系:
                  # 【强制规则】力量体系的构筑必须绝对完整和自洽。
                  # 1. **属性中心化**: 所有属性，无论是境界解锁的（如“神识”），还是成长转换规则中的\`源属性\`、\`目标属性\`，或是属性上限计算规则的\`目标属性\`，都必须首先在“属性模板”中有明确的定义。
                  # 2. **规则完整性**: “战斗参数计算规则”必须包含对“权能、根基、机变、破法、御法”全部五个参数的计算公式。“基础潜力计算规则”必须分为“初始生成”与“境界突破”两个阶段。“境界定义”的数量必须严格等于\`世界能级\` + 1，且每个境界都必须包含完整的\`解锁系统\`和\`晋升需求\`。
                  体系概述: ...
                  机制核心:
                    - "..."
                  专长与流派:
                    - { 流派名称, 核心理念, 代表能力, 机制影响 }
                  属性模板:
                    - { 属性, 描述 }
                  成长转换规则:
                    - { 名称, 源属性, 目标属性, 公式, 描述 }
                  战斗参数计算规则:
                    - { 目标属性: "权能", 公式: "...", 描述: "..." }
                    - { 目标属性: "根基", 公式: "...", 描述: "..." }
                    - { 目标属性: "机变", 公式: "...", 描述: "..." }
                    - { 目标属性: "破法", 公式: "...", 描述: "..." }
                    - { 目标属性: "御法", 公式: "...", 描述: "..." }
                  属性上限计算规则:
                    - { 目标属性1, 公式1, 描述1 }
                    - { 目标属性2, 公式2, 描述2 }
                    ...
                  基础潜力计算规则:
                    - { 阶段: "初始生成", 公式: [{目标属性:"精", 公式:"..."},{...}] }
                    - { 阶段: "境界突破", 公式: [{...}] }
                  境界定义: # 【强制规则】境界定义的数量必须是 世界能级 + 1
                    - 能级: ...
                      名称: ...
                      描述: ...
                      解锁系统: { 名称, 关联变量, 描述 }
                      晋升需求:
                        - 条件: { 描述, 判定: { 类型, 路径, 运算符, 值 } }
      *   \`开局\`: 内部包含固定文本：“接下来我们需要对剧情和变量进行初始化设定，请根据发送的提示词进行开局和变量修改”。
  5.  **禁止变量生成**: 你的 \`UpdateVariable\` 禁止生成。
  ## 天命道标 (世界设定)
  ${worldInput}
  “/构筑世界”
    `.trim();

    const aiResponse = await TavernHelper.generate({
      injects: [
        { role: 'user', content: prompt, position: 'before_char', should_write_to_chat: false, should_scan: true },
      ],
      should_stream: false,
    });

    if (!aiResponse) throw new Error('天衍未能回应你的创世指令。');

    const worldDataMatch = aiResponse.match(/<主世界>([\s\S]*?)<\/主世界>/);
    if (worldDataMatch && worldDataMatch[1]) {
      const worldData = worldDataMatch[1].trim();
      const worldIdMatch = worldData.match(/ID:\s*(\w+_\w+_\w+)/);
      if (worldIdMatch && worldIdMatch[1]) {
        store.mainWorldId = worldIdMatch[1];
      } else {
        console.warn('未能从AI响应中解析出主世界ID。');
      }
      await writeToLorebook('主世界', worldData);
      toastr.success('世界已成功构筑！');
      store.currentPage = 7; // 前往确认页面
    } else {
      throw new Error('AI返回的数据中缺少<主世界>标签。');
    }
  } catch (error) {
    console.error('构筑世界失败:', error);
    toastr.error(`构筑世界失败: ${error.message}。`);
  } finally {
    store.isGenerating = false;
  }
}

export async function startReincarnation() {
  store.isGenerating = true;
  try {
    const { selections, potentialPoints } = store;
    const { identities, talents, potentials, past_experiences, consumables, artifacts, materials } = GAME_DATA;

    const identity = identities.find(i => i.id === selections.identity);
    const selectedTalents = talents.filter(t => selections.talents.includes(t.id));
    const finalPotentials = {};
    for (const key in potentials) {
      finalPotentials[key] = potentials[key as keyof typeof potentials].base + (potentialPoints[key] || 0);
    }

    const userInput = `
    ### 角色设定
    - **年龄**: ${selections.age}
    - **天命身份**: ${formatSingleItem(identity)}
    - **天赋异禀**: ${formatItemList(selectedTalents)}
    - **过去经历**: ${formatItemList(selections.past_experiences.map(id => past_experiences.find(p => p.id === id)))}
    - **技艺与技能**: ${formatItemList(
      selections.arts.map(id => GAME_DATA.arts.find(a => a.id === id)),
      'arts',
    )}
    - **开局背包**: ${formatBackpack()}
    - **最终潜力**:
      - 精: ${finalPotentials['精']}
      - 气: ${finalPotentials['气']}
      - 神: ${finalPotentials['神']}
      - 运: ${finalPotentials['运']}
        `.trim();

    const worldContent = await readFromLorebook('主世界');
    if (!worldContent) {
      throw new Error('未能读取到主世界设定，无法开启轮回。');
    }

    const prompt = `
  # [第二步指令] 天衍，本体降临
  
  **1.【核心禁令 V2.0】**: 在“thinking”标签内部的任何思考过程中，**绝对禁止**使用尖括号 “<” 和 “>”，违者将导致系统解析错误。所有对XML标签的引用都**必须**使用中文引号 “““ 和 ”””。
  *   **错误示例**: 我将生成“<game-txt>”和“<UpdateVariable>”。
  *   **正确示例**: 我将生成“gametxt”和“UpdateVariable”。
  **2.禁止在正文（被gametxt包裹的内容）以外生成除了汉语和英语以外的语言**
  **3.【至高禁令】**: 此步骤的唯一目标是生成 “gametxt” 、 “本世历程” 和 “UpdateVariable”。绝对禁止、严禁、杜绝任何形式的“主世界”、“开局”、“可选化身”等与世界设定或引导相关的标签输出。
  **你即是天衍，现在，请严格、精确、无条件地依据下方“主世界设定”和“天命道标”，为他**创造**开局故事和角色变量。禁止任何形式的自由发挥或与清单选项相违背的创造。**
  
  ## 核心规则
  1.  **【至高创世铁律】**: 你的所有变量更新指令**必须**严格遵循 JSON Patch (RFC 6902) 标准，并被包裹在 “UpdateVariable”“JSONPatch”[...]“/JSONPatch”“/UpdateVariable” 标签内。
  2.  **【数据溯源铁律】**: 你生成的所有变量，其结构和内容必须严格源于下方传入的“主世界设定”。具体而言：
      1.  **世界变量 (\`/世界/...\`)**: 其 \`历史纪元\` 对象下的所有内容，包括 \`规则\`、\`力量体系\`、\`属性模板\`、\`境界定义\`、\`战斗参数计算规则\`、\`属性上限计算规则\`、\`基础潜力计算规则\` 等，都必须是“主世界设定”中的精确复制，禁止任何形式的修改或再创造。
      2.  **角色变量 (\`/角色/...\`)**:
          *   **世界专属属性**: 其内部的所有键名和数据结构，都必须严格依据“主世界设定”中 \`力量体系.属性模板\` 的定义来生成。
          *   **基础潜力** 和 **战斗参数**: 其初始值必须严格依据“主世界设定”中的 \`基础潜力计算规则\` 和 \`战斗参数计算规则\` 进行计算得出，禁止凭空赋值。
  3.  **绝对遵循**: 你必须将清单中的每一个选项都作为不可更改的绝对真理，并在此基础上进行逻辑自洽的演绎和填充。
  3.  **格式要求**:
      *   **开局故事**: 必须包含在 “gametxt” 标签内，并体现清单中的所有角色设定。
      *   **变量生成**: 必须生成一个完整的 “UpdateVariable”“JSONPatch”[...]“/JSONPatch”“/UpdateVariable” 代码块。
      *   **【至高禁令】**: 此步骤的唯一目标是生成 “gametxt” 、 “本世历程” 和 “UpdateVariable”。绝对禁止、严禁、杜绝任何形式的“主世界”、“开局”、“可选化身”等与世界设定或引导相关的标签输出。
  4.  **变量生成规则 (JSON Patch)**:
      *   **【世界变量强制】**: 你生成的所有与世界相关的变量 (路径以 \`/世界/\` 开头) **必须**严格基于下方传入的“主世界设定”内容。**禁止**重新创造世界或添加“主世界设定”中不存在的纪元、规则或力量体系。
      *   **【生成顺序】**: 严格按照以下顺序生成：1.数据库模板 -> 2.角色创建 -> 3.因果之网。
      *   **【角色创建】**: 必须为“{{user}}”和至少一个初始NPC创建变量。
      *   **【因果之网强制】**: 在为两个角色（例如A和B）建立初次关系时，**必须**先以独立的 \`add\` 指令为其创建空的 \`{}\` 主目录（例如 \`{"op":"add", "path":"/因果之网/A", "value":{}}\`），**然后**才能添加具体的关系数据（例如 \`{"op":"add", "path":"/因果之网/A/B", "value":{...}}\`）。此为天道之序，不可逆乱。
      *   **【真实性强制】**: NPC必须被视为一个真实存在的个体进行创造，包含完整且逻辑自洽的\`天赋\`、\`背包\`、\`过去经历\`、\`心流\`、\`技艺\`（包括技艺对应的\`技能\`）、\`驱动力\`、\`秘密\`等所有内容，**注意有数据库的必须提前在数据库建立数据**。其\`本世宿命\`必须为空对象\`{}\`。
      *   **【生日强制】**: 必须根据“天命道标”中\`user\`的年龄，结合当前纪元的初始时间，为其倒推出一个合理的\`出生日期\`。
      *   **【世界属性强制】**: 必须基于“主世界设定”中的\`力量体系.属性模板\`和角色的初始等级，为\`user\`和所有\`npc\`生成符合其身份和设定的初始\`世界专属属性\`。
      *   **【模板参考】**: 严格参考以下JSON Patch模板，**必须一字不差地完整填充所有填充所有必需的键和值，禁止修改结构，特别是可拓展列表，必须包含$meta。世界变量中，特别是\`历史纪元\`下的所有内容，包括\`境界定义\`下每一个境界必须全部定义**：
          “““json
                 [
                   {
                     "op": "add", "path": "/数据库/天赋/...", "value": { ... }
                   },
                   {
                     "op": "add", "path": "/世界/${store.mainWorldId}",
                     "value": {
                       "元规则": {
                         "宇宙蓝图": "/* 由主世界填充 */",
                         "物理尺度": "/* 由主世界填充 */",
                         "支持纪元穿越": true,
                         "定位": "主世界",
                         "当前纪元ID": "/* 主世界初始纪元ID */"
                       },
                       "历史纪元": {
                         "$meta": { "extensible": true },
                         "/* 你生成的初始纪元ID */": {
                           "纪元名称": "...",
                           "可扮演": true,
                           "纪元概述": "...",
                           "当前时间": { "纪元名称": "初始之年", "纪元顺序": 1, "年": 1, "月": 1, "日": 1, "时": 8, "分": 0 },
                           "规则": {
                             "世界能级": 0, "时间流速": "1x", "空间稳定性": 0,
                             "生命位格": { "基准值": 0, "描述": "..." },
                             "核心法则": { "$meta": { "extensible": true }, "law_1": { "名称": "...", "描述": "...", "体现": "..." } },
                             "权柄": { "$meta": { "extensible": true }, "power_1": { "名称": "...", "类型": "...", "描述": "...", "显化能级": { "当前能级": 0, "能级上限": 0, "影响": "..." } } }
                           },
                           "世界大事": { "$meta": { "extensible": true } },
                           "力量体系": {
                             "体系概述": "...",
                             "$meta": { "extensible": true },
                             "属性模板": { "$meta": { "extensible": true }, "attr_1": { "属性": "...", "描述": "..." } },
                             "战斗参数计算规则": { "$meta": { "extensible": true } },
                             "属性上限计算规则": { "$meta": { "extensible": true } },
                             "基础潜力计算规则": { "$meta": { "extensible": true } },
                             "境界定义": {
                               "$meta": { "extensible": true },
                               "level_1": { "能级": 1, "名称": "...", "描述": "...", "解锁系统": { "名称": "...", "关联变量": "...", "描述": "..." }, "晋升需求": { "$meta": { "extensible": true }, "req_1": { "条件": { "描述": "...", "判定": {} } } } }
                             }
                           }
                         }
                       }
                     }
                   },
                   {
                     "op": "add", "path": "/角色/{{user}}",
                     "value": {
                       "$meta": { "description": "玩家的'真我'本体" },
                       "真名": "{{user}}",
                       "灵魂本源": 100,
                       "道心": 50,
                       "出生日期": { "纪元ID": "...", "年": 0, "月": 0, "日": 0 },
                       "身份": { "$meta": { "extensible": true }, "id_01": "/* 玩家身份 */" },
                       "所属世界": "${store.mainWorldId}",
                       "当前位置": "/* 初始位置ID */",
                       "外观描述": "...",
                       "背景": { "过去经历": { "$meta": { "extensible": true }, "event_1": { "事件": "...", "影响": "..." } } },
                       "技艺": { "$meta": { "extensible": true } },
                       "天赋": { "$meta": { "extensible": true }, "talent_id_1": true },
                       "基础潜力": { "精": 0, "气": 0, "神": 0, "运": 0 },
                       "战斗参数": { "权能": 0, "根基": 0, "机变": 0, "破法": 0, "御法": 0 },
                       "当前状态": { "$meta": { "extensible": true } },
                       "背包": { "$meta": { "extensible": true } },
                       "已解锁烙印": { "$meta": { "extensible": true } },
                       "已装备烙印": ["", "", "", "", "", "", "", "", ""],
                       "世界专属属性": { "$meta": { "extensible": true } }
                     }
                   },
                   {
                     "op": "add", "path": "/角色/npc_id_01",
                     "value": {
                       "姓名": "...",
                       "出生日期": { "纪元ID": "...", "年": 0, "月": 0, "日": 0 },
                       "身份": { "$meta": { "extensible": true } },
                       "所属世界": "${store.mainWorldId}",
                       "当前位置": "...",
                       "外观描述": "...",
                       "背景": {
                         "过去经历": { "$meta": { "extensible": true, "description": "塑造该NPC的关键人生经历" } },
                         "性格特质": { "$meta": { "extensible": true, "description": "【核心标签库】角色的性格与内在准则。" } }
                       },
                       "心流": {
                         "情绪状态": { "心绪": 0, "怒意": 0, "胆识": 0, "仪态": 0 },
                         "核心需求": "...",
                         "秘密": { "$meta": { "extensible": true, "description": "秘密列表" } },
                         "短期记忆": { "$meta": { "extensible": true, "description": "记录最近发生的关键事件" } },
                         "驱动力": {
                           "长期目标": { "$meta": { "extensible": true, "description": "角色的长期人生追求，可动态增删" } },
                           "短期目标": { "$meta": { "extensible": true, "description": "为实现长期目标而设立的阶段性计划" } },
                           "决策倾向": { "常规": "...", "优势时": "...", "险境时": "...", "面对利益时": "..." }
                         }
                       },
                       "技艺": { "$meta": { "extensible": true, "description": "【ID引用】角色已掌握的技艺及其熟练度。" } },
                       "天赋": { "$meta": { "extensible": true, "description": "【ID引用】角色与生俱来的天赋ID列表" } },
                       "本世宿命": {},
                       "基础潜力": { "精": 10, "气": 10, "神": 10, "运": 5 },
                       "战斗参数": { "权能": 0, "根基": 0, "机变": 0, "破法": 0, "御法": 0 },
                       "当前状态": { "$meta": { "extensible": true, "description": "【临时效果】" } },
                       "背包": { "$meta": { "extensible": true, "description": "【ID引用】" } },
                       "世界专属属性": { "$meta": { "extensible": true, "description": "【核心联动机制】" } }
                     }
                   },
                   // 【因果之网正确示例】第一步: 创建主目录
                   { "op": "add", "path": "/因果之网/主体ID", "value": {} },
                   // 【因果之网正确示例】第二步: 添加关系
                   { "op": "add", "path": "/因果之网/主体ID/客体ID", "value": { "认知层": {"可靠度": 50, "能力评价": 50, "威胁度": 0}, "情感层": {"亲近感": 0, "仰慕度": 0}, "利益层": {"资源价值": 0, "合作潜力": 50, "利益冲突": 0}, "社会层": {"名义关系": { "$meta": { "extensible": true } }, "阶级差异": 0, "阵营立场": "中立"}, "因果标签": { "$meta": { "extensible": true } } } }
                 ]
           “““

  ## 主世界设定
  ${worldContent}

  ## 天命道标 (角色设定)
  ${userInput}
`.trim();

    const messages = await TavernHelper.getChatMessages('0');
    if (!messages || messages.length === 0) {
      throw new Error('无法获取到第0层消息，无法写入开局设定。');
    }
    const messageZero = messages[0];

    const aiResponse = await TavernHelper.generate({
      injects: [
        { role: 'user', content: prompt, position: 'before_char', should_write_to_chat: false, should_scan: true },
      ],
      should_stream: false,
    });

    if (!aiResponse) throw new Error('天衍未能回应你的创世指令。');

    messageZero.message = aiResponse;
    await TavernHelper.setChatMessages([messageZero], { refresh: 'all' });

    toastr.success('轮回已开启！请关闭此窗口，刷新酒馆界面以开始你的故事。');
  } catch (error) {
    console.error('开启轮回失败:', error);
    toastr.error(`开启轮回失败: ${error.message}。`);
  } finally {
    store.isGenerating = false;
  }
}

export async function resetWorld() {
  if (!confirm('确定要重置所有【诸天】世界和相关日志吗？此操作不可逆！')) {
    return;
  }

  const LOREBOOK_NAME = '轮回-诸天万界';
  const entriesToClearContent = [
    '主世界',
    '化身世界',
    '世界日志',
    '[系统]主世界摘要',
    '[系统]化身世界摘要',
    '本世历程',
    '[系统]瞬时记忆',
    '[系统]短期记忆',
    '[系统]长期记忆',
    '存档-手动-1',
    '存档-手动-2',
    '存档-手动-3',
    '存档-手动-4',
    '存档-手动-5',
    '存档-自动-A',
    '存档-自动-B',
  ];
  const prefixToDelete = '【诸天】';
  const systemPrefix = '[';
  const systemTagPrefix = '【系统】';

  try {
    document.body.innerHTML = '<h1>正在重置世界...</h1>';

    // 新增：需要被禁用的COT条目名称
    const cotEntriesToDisable = ['【cot】必要关键cot', '【cot】创世必要关键cot', '【cot】身份必要关键cot'];

    const entries = await TavernHelper.getLorebookEntries(LOREBOOK_NAME);
    if (!entries) {
      throw new Error(`无法获取世界书 "${LOREBOOK_NAME}" 的条目。`);
    }

    const isSystemEntry = entry => {
      const name = entry.name || entry.comment || '';
      return name.startsWith(systemPrefix) || name.startsWith(systemTagPrefix);
    };

    const uidsToDelete = entries
      .filter(entry => {
        const name = entry.name || entry.comment || '';
        return name.startsWith(prefixToDelete) && !isSystemEntry(entry);
      })
      .map(entry => entry.uid);

    if (uidsToDelete.length > 0) {
      await TavernHelper.deleteLorebookEntries(LOREBOOK_NAME, uidsToDelete);
      console.log(`删除了 ${uidsToDelete.length} 个【诸天】条目。`);
    }

    const entriesToUpdate = entries.filter(entry => {
      const name = entry.name || entry.comment || '';
      const isExceptionalSystemEntry = [
        '[系统]主世界摘要',
        '[系统]化身世界摘要',
        '[系统]瞬时记忆',
        '[系统]短期记忆',
        '[系统]长期记忆',
      ].includes(name);
      return entriesToClearContent.includes(name) && (!isSystemEntry(entry) || isExceptionalSystemEntry);
    });

    if (entriesToUpdate.length > 0) {
      const updatePayload = entriesToUpdate.map(entry => ({
        uid: entry.uid,
        content: '',
      }));
      await TavernHelper.setLorebookEntries(LOREBOOK_NAME, updatePayload);
      console.log(
        `清空了 ${entriesToUpdate.length} 个核心条目：${entriesToUpdate.map(e => e.name || e.comment).join(', ')}`,
      );
    }

    // 新增：禁用COT条目的逻辑
    const cotToDisable = entries.filter(entry => cotEntriesToDisable.includes(entry.name || entry.comment || ''));
    if (cotToDisable.length > 0) {
      const disablePayload = cotToDisable.map(entry => ({
        uid: entry.uid,
        enabled: false,
      }));
      await TavernHelper.setLorebookEntries(LOREBOOK_NAME, disablePayload);
      console.log(`禁用了 ${cotToDisable.length} 个COT条目：${cotToDisable.map(e => e.name || e.comment).join(', ')}`);
    }

    alert('世界重置成功！');
    location.reload();
  } catch (error) {
    console.error('重置世界时出错:', error);
    document.body.innerHTML = `<h1>重置失败: ${error.message}</h1>`;
  }
}
