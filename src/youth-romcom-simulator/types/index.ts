import { z } from 'zod';

/**
 * @file 核心类型定义 - 综漫-春物篇 v1.0
 * @description 本文件基于 `变量结构.txt` 中的 Zod Schema 生成，是前端所有类型的唯一真实来源。
 */

// --- 辅助类型和常量 ---

const 关系阶段定义 = {
  亲密度: [
    { name: '陌路', threshold: -Infinity },
    { name: '嫌恶', threshold: -80 },
    { name: '警惕', threshold: -40 },
    { name: '生疏', threshold: -10 },
    { name: '熟人', threshold: 10 },
    { name: '友人', threshold: 40 },
    { name: '挚友', threshold: 80 },
    { name: '恋人', threshold: 100 },
    { name: '共生', threshold: 120 },
    { name: '依存', threshold: 150 },
    { name: '呪缚', threshold: 180 },
    { name: '融合', threshold: 200 },
  ],
  支配度: [
    { name: '反抗', threshold: -100 },
    { name: '不屑', threshold: -60 },
    { name: '无视', threshold: -30 },
    { name: '平等', threshold: 0 },
    { name: '顺从', threshold: 30 },
    { name: '信赖', threshold: 60 },
    { name: '崇拜', threshold: 80 },
    { name: '盲从', threshold: 100 },
    { name: '支配', threshold: 120 },
    { name: '奴役', threshold: 150 },
    { name: '刻印', threshold: 180 },
    { name: '傀儡', threshold: 200 },
  ],
  信赖度: [
    { name: '背叛', threshold: -100 },
    { name: '欺骗', threshold: -70 },
    { name: '猜忌', threshold: -40 },
    { name: '怀疑', threshold: -10 },
    { name: '中立', threshold: 10 },
    { name: '认可', threshold: 40 },
    { name: '信赖', threshold: 70 },
    { name: '托付', threshold: 90 },
    { name: '共犯', threshold: 110 },
    { name: '默契', threshold: 140 },
    { name: '心领神会', threshold: 170 },
    { name: '灵魂同步', threshold: 200 },
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

type 属性等级 = (typeof 属性等级定义)[number]['等级'];
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
        亲密度: z.string().default('陌路'),
        支配度: z.string().default('平等'),
        信赖度: z.string().default('怀疑'),
      })
      .default({ 亲密度: '陌路', 支配度: '平等', 信赖度: '怀疑' }),
    最近互动: z.string().default('无'),
  })
  .default({
    数值: { 亲密度: 0, 支配度: 0, 信赖度: 0 },
    阶段: { 亲密度: '陌路', 支配度: '平等', 信赖度: '怀疑' },
    最近互动: '无',
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

export const 角色Schema = z.object({
  名称: z.string().default('无名氏'),
  身份: z.array(z.object({ 组织: z.string(), 职位: z.string() })).default([]),
  个人信息: z
    .object({
      出生日期: z.coerce.date().default(() => new Date('1996-01-01')),
      年龄: z.coerce.number().default(17),
      容貌: z.string().default('未描述'),
      身材: z.string().default('未描述'),
      衣着: z.string().default('未描述'),
    })
    .default({
      出生日期: new Date('1996-01-01'),
      年龄: 17,
      容貌: '未描述',
      身材: '未描述',
      衣着: '未描述',
    }),
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
    })
    .default({
      心理健康: 80,
      心理状态: '稳定',
      核心动机: { 关系: 50, 意义: 30, 生存: 10, 享乐: 10, 权力: 10 },
      恐惧创伤: [],
    })
    .transform((val: any) => {
      if (val.心理健康) val.心理状态 = findStage(val.心理健康, 心理状态定义);
      return val;
    }),
  核心特质: z.array(z.object({ 名称: z.string(), 介绍: z.string() })).default([]),
  属性: z.record(z.enum(['沟通', '观察', '行动力', '精神力', '知识', '魅力']), 属性Schema).optional(),
  技能: z.record(z.string(), 技能Schema).optional(),
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
  物品栏: z.record(z.string(), z.object({ 数量: z.coerce.number().default(1) })).optional(),
  当前状态: z.array(z.string()).default([]),
  位置: z.string().default('未知'),
});

export const RootSchema = z.object({
  世界状态: z
    .object({
      时间: z.coerce.date().default(() => new Date('2013-04-12T15:30:00')),
      状态: z.string().default('日常的世界'),
      天气: z.enum(['晴天', '多云', '阴天', '小雨', '大雨', '雷阵雨', '雪', '大风', '雾']).default('晴天'),
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
      时间: new Date('2013-04-12T15:30:00'),
      状态: '日常的世界',
      天气: '晴天',
      章节: {
        所属作品: '我的青春恋爱物语果然有问题',
        册: 1,
        章: 1,
        标题: '侍奉部的诞生',
      },
    }),
  角色列表: z.record(z.string(), 角色Schema.or(z.literal('待初始化'))).default({
    Yukinoshita_Yukino: '待初始化',
    Hikigaya_Hachiman: '待初始化',
    Yuigahama_Yui: '待初始化',
  }),
  关系: z.record(z.string(), 关系Schema.or(z.literal('待初始化'))).default({}),
  命运卡牌系统: z
    .object({
      下次抽卡时间: z.coerce.date().default(() => new Date('2013-04-13T00:00:00')),
      卡池: z.record(卡牌Schema.shape.类型, z.array(z.string())).default({
        任务卡: [],
        角色卡: [],
        物品卡: [],
        事件卡: [],
        命运卡: [],
        属性卡: [],
        技能卡: [],
        灾难卡: [],
        纪念卡: [],
      }),
      卡牌仓库: z.record(z.string(), 卡牌Schema).default({}),
      纪念卡合成: z.record(z.string(), z.array(z.string())).default({}),
    })
    .default({
      下次抽卡时间: new Date('2013-04-13T00:00:00'),
      卡池: {
        任务卡: [],
        角色卡: [],
        物品卡: [],
        事件卡: [],
        命运卡: [],
        属性卡: [],
        技能卡: [],
        灾难卡: [],
        纪念卡: [],
      },
      卡牌仓库: {},
      纪念卡合成: {},
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
      当前激活卡牌: z.array(z.string()).default([]),
    })
    .default({
      委托系统: {},
      历史事件: [],
      当前激活卡牌: [],
    }),
});

// --- TypeScript 类型推断 ---

export type 关系 = z.infer<typeof 关系Schema>;
export type 卡牌 = z.infer<typeof 卡牌Schema>;
export type 技能 = z.infer<typeof 技能Schema>;
export type 属性 = z.infer<typeof 属性Schema>;
export type 角色 = z.infer<typeof 角色Schema>;
export type 游戏世界状态 = z.infer<typeof RootSchema>;

export interface AppState {
  isReady: boolean;
  worldState: 游戏世界状态 | null;
  narrative: string;
  mainWorldNarrative: string;
  avatarWorldNarrative: string;
  activeView: 'mainWorld' | 'avatarWorld' | null;
  isGenerating: boolean;
  generationError: string | null;
  lastSubmittedAction: string | null;
  worldLog: any[];
}

export interface WorldLogEntry {
  序号: number;
  日期: string;
  标题: string;
  地点: string;
  人物: string;
  描述: string;
  人物关系?: string;
  重要信息?: string;
  暗线与伏笔?: string;
  自动化系统?: string;
}
