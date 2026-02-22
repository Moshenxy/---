import { z } from 'zod';

/**
 * @file 核心类型定义 - 综漫-春物篇 v2.2 (主角/NPC分离, 关系V3, 类型修复)
 * @description 本文件基于 `变量结构.txt` 中的 Zod Schema 生成，是前端所有类型的唯一真实来源。
 */

// --- 辅助类型和常量 ---

const 关系阶段定义 = {
  亲密度: [
    { name: '宿敌', threshold: -Infinity },
    { name: '敌视', threshold: -500 },
    { name: '嫌恶', threshold: -250 },
    { name: '警惕', threshold: -100 },
    { name: '生疏', threshold: -20 },
    { name: '熟人', threshold: 20 },
    { name: '友人', threshold: 150 },
    { name: '挚友', threshold: 400 },
    { name: '恋人', threshold: 700 },
    { name: '挚爱', threshold: 850 },
    { name: '融合', threshold: 1000 },
  ],
  支配度: [
    { name: '反抗', threshold: -Infinity },
    { name: '不屑', threshold: -100 },
    { name: '无视', threshold: -60 },
    { name: '平等', threshold: -30 },
    { name: '顺从', threshold: 40 },
    { name: '信赖', threshold: 150 },
    { name: '崇拜', threshold: 200 },
    { name: '盲从', threshold: 300 },
    { name: '支配', threshold: 400 },
    { name: '奴役', threshold: 500 },
    { name: '刻印', threshold: 700 },
    { name: '傀儡', threshold: 800 },
  ],
  信赖度: [
    { name: '背叛者', threshold: -Infinity },
    { name: '不信', threshold: -500 },
    { name: '猜忌', threshold: -250 },
    { name: '怀疑', threshold: -100 },
    { name: '中立', threshold: -20 },
    { name: '认可', threshold: 140 },
    { name: '可靠', threshold: 400 },
    { name: '共犯', threshold: 550 },
    { name: '托付后背', threshold: 700 },
    { name: '绝对信赖', threshold: 900 },
    { name: '灵魂同步', threshold: 1000 },
  ],
};

const 心理状态定义 = [
  { name: '崩溃', threshold: 0, 描述: '精神完全崩溃，行为极端且不可预测，所有检定有极高的失败率或出现意外的反效果。' },
  { name: '紊乱', threshold: 25, 描述: '精神高度不稳定，难以集中，时常做出非理性判断，所有检定受到显著的负面影响。' },
  {
    name: '承压',
    threshold: 50,
    描述: '感到疲惫和压力，专注力下降，部分检定（尤其是社交和精神类）会受到轻微的负面影响。',
  },
  { name: '稳定', threshold: 75, 描述: '精神状态良好，能够理性思考和行动。' },
  { name: '高昂', threshold: 90, 描述: '精神振奋，充满自信，部分检定（尤其是行动力和魅力类）可能获得轻微的正面加成。' },
] as const;

export const 属性等级定义 = [
  { 等级: 'F', 修正值: -5, 升级经验: 100 },
  { 等级: 'E', 修正值: -3, 升级经验: 200 },
  { 等级: 'D', 修正值: -1, 升级经验: 300 },
  { 等级: 'C', 修正值: 0, 升级经验: 400 },
  { 等级: 'B', 修正值: 2, 升级经验: 500 },
  { 等级: 'A', 修正值: 5, 升级经验: 600 },
  { 等级: 'S', 修正值: 10, 升级经验: 800 },
  { 等级: 'SS', 修正值: 15, 升级经验: 1000 },
  { 等级: 'SSS', 修正值: 20, 升级经验: Infinity },
] as const;

export type 属性等级 = (typeof 属性等级定义)[number]['等级'];
const 属性等级枚举 = z.enum(['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS']);

const findStage = (value: number, stages: readonly { name: string; threshold: number }[]) => {
  let currentStage = stages[0];
  for (const stage of stages) {
    if (value >= stage.threshold) {
      currentStage = stage;
    } else {
      break;
    }
  }
  return currentStage.name;
};

// --- Zod Schema 定义 ---

export const 关系Schema = z
  .object({
    数值: z
      .object({
        亲密度: z.coerce.number().default(0),
        支配度: z.coerce.number().default(0),
        信赖度: z.coerce.number().default(0),
      })
      .default({ 亲密度: 0, 支配度: 0, 信赖度: 0 }),
    阶段: z
      .object({
        亲密度: z.string().default('生疏'),
        支配度: z.string().default('平等'),
        信赖度: z.string().default('中立'),
      })
      .default({ 亲密度: '生疏', 支配度: '平等', 信赖度: '中立' }),
    最近互动: z.string().default('无'),
    动作冷却池: z
      .record(
        z.string().describe('动作ID'),
        z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe('YYYY-MM-DD 格式的日期'),
      )
      .optional()
      .default({}),
  })
  .default({
    数值: { 亲密度: 0, 支配度: 0, 信赖度: 0 },
    阶段: { 亲密度: '生疏', 支配度: '平等', 信赖度: '中立' },
    最近互动: '无',
    动作冷却池: {},
  })
  .transform(val => {
    val.阶段.亲密度 = findStage(val.数值.亲密度, 关系阶段定义.亲密度);
    val.阶段.支配度 = findStage(val.数值.支配度, 关系阶段定义.支配度);
    val.阶段.信赖度 = findStage(val.数值.信赖度, 关系阶段定义.信赖度);
    return val;
  });

export const 卡牌Schema = z.object({
  ID: z.string().default(() => `card_${new Date().getTime()}`),
  类型: z.enum(['任务卡', '角色卡', '物品卡', '事件卡', '命运卡', '属性卡', '技能卡', '灾难卡', '纪念卡']),
  等级: 属性等级枚举.default('F'),
  名称: z.string().default('未命名卡牌'),
  介绍: z.string().default(''),
  卡面: z.string().url().or(z.literal('')).default(''),
  效果: z.string().default('无'),
});

export const 技能Schema = z.object({
  类型: z.enum(['被动技能', '主动技能']),
  等级: 属性等级枚举.default('F'),
  介绍: z.string().default(''),
  经验值: z.coerce.number().default(0),
  修正值: z.coerce.number().default(0),
  效果: z.discriminatedUnion('类型', [
    z.object({
      类型: z.literal('数值'),
      目标属性: z.string(),
      计算方式: z.enum(['加', '减', '乘', '除']),
      值: z.coerce.number(),
      概率: z.coerce
        .number()
        .transform(v => Math.max(0, Math.min(v, 100)))
        .default(100),
    }),
    z.object({
      类型: z.literal('文本'),
      描述: z.string(),
    }),
  ]),
});

export const 属性Schema = z
  .object({
    等级: 属性等级枚举.default('C'),
    经验值: z.coerce.number().default(0),
    修正值: z.coerce.number().default(0),
  })
  .transform(val => {
    const currentLevelInfo = 属性等级定义.find(l => l.等级 === val.等级);
    if (currentLevelInfo) {
      val.修正值 = currentLevelInfo.修正值;
      if (val.经验值 >= currentLevelInfo.升级经验 && currentLevelInfo.升级经验 !== Infinity) {
        const nextLevelIndex = 属性等级定义.findIndex(l => l.等级 === val.等级) + 1;
        if (nextLevelIndex < 属性等级定义.length) {
          const nextLevelInfo = 属性等级定义[nextLevelIndex];
          val.等级 = nextLevelInfo.等级;
          val.经验值 -= currentLevelInfo.升级经验;
          val.修正值 = nextLevelInfo.修正值;
        }
      }
    }
    return val;
  });

export const 人格内核Schema = z.object({
  标识符: z.string().describe('一句话概括角色的核心人格'),
  行为逻辑: z.object({
    公开模式: z.string().describe('在通常社交场合下的行为总纲'),
    私密模式: z
      .array(
        z.object({
          对象: z.string().describe('特定角色ID或‘玩家’'),
          模式描述: z.string().describe('面对该特定对象时的特殊行为模式'),
        }),
      )
      .optional(),
  }),
  行为剖面: z.array(
    z.object({
      情境: z.string().describe('触发该行为模式的具体情境'),
      行为模式: z.string().describe('在该情境下会展现出的具体行为'),
      动机解释: z.string().describe('该行为背后的深层心理动机'),
    }),
  ),
  对话风格: z.object({
    常用语: z.array(z.string()),
    口头禅: z.string().optional(),
    禁忌词: z.array(z.string()).optional(),
  }),
});

export const 关系动态Schema = z.object({
  对特定角色的初始立场: z
    .record(z.string().describe('角色ID'), z.string().describe('对该角色的初始看法和态度'))
    .optional(),
  对玩家的行为倾向: z
    .array(
      z.object({
        触发条件: z.string().describe('描述触发新行为模式的条件'),
        新行为模式: z.string().describe('解锁的新行为模式名称'),
        动机解释: z.string().describe('该转变背后的动机'),
      }),
    )
    .optional(),
});

const 角色基础Schema = z.object({
  名称: z.string().default('无名氏'),
  身份: z.array(z.object({ 组织: z.string(), 职位: z.string() })).default([]),
  个人信息: z
    .object({
      出生日期: z.coerce.date().optional(),
      年龄: z.coerce.number().default(17),
      容貌: z.string().default('未描述'),
      身材: z.string().default('未描述'),
      衣着: z.string().default('未描述'),
      性别: z.enum(['男', '女', '其他']).default('男'),
    })
    .default({
      年龄: 17,
      容貌: '未描述',
      身材: '未描述',
      衣着: '未描述',
      性别: '男',
    }),
  属性: z.record(z.enum(['沟通', '观察', '行动力', '精神力', '知识', '魅力']), 属性Schema).optional(),
  技能: z.record(z.string(), 技能Schema).optional(),
  物品栏: z.record(z.string(), z.object({ 数量: z.coerce.number().default(1) })).optional(),
  当前状态: z
    .array(
      z.object({
        名称: z.string(),
        效果: z.string(),
        持续到: z
          .object({
            日期: z.string(),
            片段: z.string(),
          })
          .nullable(),
        来源: z.string(),
      }),
    )
    .default([]),
  位置: z.string().default('未知'),
  卡牌背包: z.array(卡牌Schema).optional(),
});

export const 主角Schema = 角色基础Schema.extend({});

export const NpcSchema = 角色基础Schema.extend({
  内在世界: z
    .object({
      心理健康: z.coerce
        .number()
        .transform(v => Math.max(0, Math.min(v, 100)))
        .default(80),
      心理状态: z.string().default('稳定'),
      核心动机: z
        .record(z.enum(['生存', '享乐', '权力', '关系', '意义']), z.coerce.number())
        .default({ 关系: 50, 意义: 30, 生存: 10, 享乐: 10, 权力: 10 }),
      恐惧创伤: z.array(z.object({ 触发源: z.string(), 应激反应: z.string() })).default([]),
      NSFW: z
        .object({
          phys: z.coerce.number().min(0).max(6).default(0).describe('身体演化等级'),
          mind: z.coerce.number().min(0).max(5).default(0).describe('精神演化等级'),
        })
        .default({ phys: 0, mind: 0 }),
    })
    .default({
      心理健康: 80,
      心理状态: '稳定',
      核心动机: { 关系: 50, 意义: 30, 生存: 10, 享乐: 10, 权力: 10 },
      恐惧创伤: [],
      NSFW: { phys: 0, mind: 0 },
    })
    .transform((val: any) => {
      if (val.心理健康) val.心理状态 = findStage(val.心理健康, 心理状态定义);
      return val;
    }),
  人格内核: 人格内核Schema,
  关系动态: 关系动态Schema,
  记忆: z
    .array(
      z.object({
        时间: z.coerce.date(),
        事件摘要: z.string(),
        情感标签: z.enum(['喜悦', '悲伤', '愤怒', '恐惧', '屈辱', '满足']),
        影响: z.string(),
      }),
    )
    .default([]),
});

export const 场景特质Schema = z.object({
  特质名称: z.string(),
  描述: z.string(),
  效果: z.string(),
  触发条件: z
    .object({
      时间片段: z.array(z.string()).optional(),
      天气: z.array(z.string()).optional(),
      角色在场: z.array(z.string()).optional(),
      委托状态: z.enum(['有', '无']).optional(),
    })
    .optional(),
});

export const 地点Schema = z.object({
  名称: z.string(),
  层级类型: z.enum(['城市', '区域', '建筑群', '建筑', '房间', '地标']),
  所属: z.object({ ID: z.string() }).nullable(),
  描述: z.string(),
  场景特质: z.array(场景特质Schema).optional(),
  包含物品: z.array(z.string()).optional(),
});

export const RootSchema = z.object({
  世界状态: z
    .object({
      时间: z
        .object({
          日期: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .default('2012-04-08'),
          当前片段: z.enum(['早晨', '上学路', '午前', '午休', '午后', '放学后', '傍晚', '夜']).default('早晨'),
          星期: z.enum(['日', '一', '二', '三', '四', '五', '六']).default('日'),
        })
        .default({ 日期: '2012-04-08', 当前片段: '早晨', 星期: '日' }),
      行动点: z
        .object({
          当前: z.coerce.number().default(2),
          上限: z.coerce.number().default(2),
        })
        .default({ 当前: 2, 上限: 2 }),
      状态: z.string().default('日常的世界'),
      天气: z.enum(['晴天', '多云', '阴天', '小雨', '大雨', '雷阵雨', '雪', '大风', '雾']).default('晴天'),
      未来天气: z.enum(['晴天', '多云', '阴天', '小雨', '大雨', '雷阵雨', '雪', '大风', '雾']).default('晴天'),
      章节: z
        .object({
          所属作品: z.string().default('我的青春恋爱物语果然有问题'),
          册: z.coerce.number().default(1),
          章: z.coerce.number().default(1),
          标题: z.string().default('侍奉部的诞生'),
        })
        .default({
          所属作品: '我的青春恋爱物语果然有问题',
          册: 1,
          章: 1,
          标题: '侍奉部的诞生',
        }),
    })
    .default({
      时间: { 日期: '2012-04-08', 当前片段: '早晨', 星期: '日' },
      行动点: { 当前: 2, 上限: 2 },
      状态: '日常的世界',
      天气: '晴天',
      未来天气: '晴天',
      章节: { 所属作品: '我的青春恋爱物语果然有问题', 册: 1, 章: 1, 标题: '侍奉部的诞生' },
    }),
  主角: 主角Schema.or(z.literal('待初始化')).default('待初始化'),
  地点: z.record(z.string(), 地点Schema).optional(),
  角色列表: z.record(z.string(), NpcSchema.or(z.literal('待初始化'))).default({}),
  关系: z.record(z.string(), z.record(z.string(), 关系Schema)).default({}),
  命运卡牌系统: z
    .object({
      下次抽卡时间: z
        .object({
          日期: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .default('2013-04-08'),
          片段: z.enum(['早晨', '上学路', '午前', '午休', '午后', '放学后', '傍晚', '夜']).default('上学路'),
        })
        .default({ 日期: '2013-04-08', 片段: '上学路' }),
    })
    .default({
      下次抽卡时间: { 日期: '2013-04-08', 片段: '上学路' },
    }),
  叙事记录: z
    .object({
      委托系统: z
        .record(
          z.string(),
          z.object({
            委托人: z.string(),
            内容: z.string(),
            状态: z.enum(['待处理', '处理中', '已解决', '已失败']),
            所属作品: z.string(),
          }),
        )
        .default({}),
      历史事件: z.array(z.string()).default([]),
      当前激活卡牌: z.string().nullable().default(null),
    })
    .default({
      委托系统: {},
      历史事件: [],
      当前激活卡牌: null,
    }),
});

// --- TypeScript 类型推断 ---

export type 关系 = z.infer<typeof 关系Schema>;
export type 卡牌 = z.infer<typeof 卡牌Schema>;
export type 技能 = z.infer<typeof 技能Schema>;
export type 属性 = z.infer<typeof 属性Schema>;
export type 角色基础 = z.infer<typeof 角色基础Schema>;
export type 主角 = z.infer<typeof 主角Schema>;
export type Npc = z.infer<typeof NpcSchema>;
export type 角色 = 主角 | Npc;
export type 游戏世界状态 = z.infer<typeof RootSchema>;

// V4 日志系统类型定义
export interface DiaryEntry {
  日期: string;
  标题: string;
  天气: string;
  心情随笔: string;
  本日事件簿: {
    时刻: string;
    地点: string;
    事件: string;
    我的吐槽: string;
  }[];
  关系温度计: {
    对象: string;
    事件: string;
    我的看法: string;
  }[];
  明日备忘: string[];
}

export interface WeeklyReview {
  刊号: number;
  发行日期: string;
  本周头条: string;
  一周热点追击: string;
  本周人物风云榜: {
    本周MVP: string;
    高光时刻: string;
    本周话题人物: string;
    上榜理由: string;
    角色: string;
    变化轨迹: string;
    关键事件: string;
  };
  恋爱占卜专栏: {
    本周桃花最旺: string;
    占卜师点评: string;
    本周运势最低: string;
  };
  下期预告: {
    已完成主线: string;
    当前主线: string;
    新增谜团: string[];
  };
}

export interface DisplayStoryStage {
  id: string;
  title: string;
  summary: string;
  arcId: string;
  arcTitle: string;
  status: 'completed' | 'current' | 'future';
  trigger_time: { date: string; segment: string };
  阶段背景?: string[];
  关键情节?: any[];
  key_characters?: string[];
  key_locations?: string[];
  key_items?: string[];
}

export interface DiaryFragment {
  序号: number;
  日期: string;
  时间片段: string;
  标题: string;
  事件概要: string;
  我的抉择: string;
  关系变动: string;
  属性成长: string;
}

export interface DirectorLog {
  剧本ID: string;
  导演意图: string;
  核心镜头: string;
  镜头意图: string;
  NPC表演分析: any[];
  叙事节奏掌控: string;
  节奏说明: string;
  世界线变动记录: any;
  校园BBS: any;
  下回合锚点预告: any;
}

export interface AppState {
  isReady: boolean;
  worldState: 游戏世界状态 | null;
  userId: string;
  narrative: string;
  mainWorldNarrative: string;
  avatarWorldNarrative: string;
  activeView: 'mainWorld' | 'avatarWorld' | null;
  isGenerating: boolean;
  generationError: string | null;
  lastSubmittedAction: string | null;
  lastGeneratedPatch: string | null;
  diary: DiaryEntry[];
  diaryFragments: DiaryFragment[];
  directorLogs: DirectorLog[];
  weeklyReviews: WeeklyReview[];
  futureStorylines: DisplayStoryStage[];
}
