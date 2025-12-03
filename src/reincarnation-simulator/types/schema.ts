import { z } from 'zod';

/**
 * @file 本文件使用 Zod 定义了整个应用的核心数据结构 Schema。
 * 它用于在运行时校验、解析和转换从酒馆后端获取的数据，确保数据安全和格式正确。
 * @version 1.0 - 基于 [InitVar].txt V8.0 和 变量结构设计.yaml v4.x
 */

// --- 基础和共享 Schema ---

const nonEmptyString = z.string().min(1);

const MetaSchema = z.object({
  description: z.string().optional(),
  extensible: z.boolean().optional(),
});

const EffectBonusSchema = z.record(z.string(), z.union([z.coerce.number(), z.string()]));

const EffectsSchema = z.object({
  attributes_bonus: EffectBonusSchema.optional(),
  percentage_bonus: EffectBonusSchema.optional(),
});

const TimeDurationSchema = z.object({
  年: z.coerce.number().prefault(0),
  月: z.coerce.number().prefault(0),
  日: z.coerce.number().prefault(0),
  时: z.coerce.number().prefault(0),
  分: z.coerce.number().prefault(0),
});

const DatabaseItemSchema = z.object({
  名称: nonEmptyString,
  类型: nonEmptyString,
  能级: z.coerce.number().prefault(0),
  描述: z.string(),
  子类型: z.string().optional(),
  持续时间: TimeDurationSchema.optional(),
  effects: EffectsSchema.optional(),
  纪元倾向: z.array(z.string()).optional(),
  所属世界ID: z.string().optional(),
});

const ActiveSkillSchema = z.object({
  ID: nonEmptyString,
  名称: nonEmptyString,
  描述: z.string(),
  关联技艺: z.string(),
  类型: z.string(),
  基础效果: z.string(),
  效果等级公式: z.string(),
});

const ArtisanSkillSchema = z.object({
  ID: nonEmptyString,
  名称: nonEmptyString,
  描述: z.string(),
  关联潜力: z.string(),
  等级上限: z.coerce.number().prefault(0),
  效果描述: z.string().optional(),
  效果等级公式: z.string().optional(),
  等级体系: z
    .object({ $meta: MetaSchema.optional() })
    .catchall(
      z.object({
        等级: z.coerce.number().prefault(0),
        称号: z.string(),
        升级所需经验: z.coerce.number().prefault(0),
      }),
    )
    .prefault({}),
});

const RelationLayerSchema = z.object({
  认知层: z
    .object({
      可靠度: z.coerce.number().prefault(0),
      能力评价: z.coerce.number().prefault(0),
      威胁度: z.coerce.number().prefault(0),
    })
    .prefault({ 可靠度: 0, 能力评价: 0, 威胁度: 0 }),
  情感层: z
    .object({
      亲近感: z.coerce.number().prefault(0),
      仰慕度: z.coerce.number().prefault(0),
    })
    .prefault({ 亲近感: 0, 仰慕度: 0 }),
  利益层: z
    .object({
      资源价值: z.coerce.number().prefault(0),
      合作潜力: z.coerce.number().prefault(0),
      利益冲突: z.coerce.number().prefault(0),
    })
    .prefault({ 资源价值: 0, 合作潜力: 0, 利益冲突: 0 }),
  社会层: z
    .object({
      名义关系: z
        .record(z.string(), z.object({ 关系: z.string(), 描述: z.string().optional() }))
        .optional()
        .prefault({}),
      阶级差异: z.coerce.number().prefault(0),
      阵营立场: z.string().prefault('中立'),
    })
    .prefault({ 名义关系: {}, 阶级差异: 0, 阵营立场: '中立' }),
  印象标签: z
    .object({
      认知标签: z.string().prefault(''),
      情感标签: z.string().prefault(''),
      利益标签: z.string().prefault(''),
      社会标签: z.string().prefault(''),
      综合标签: z.string().prefault(''),
    })
    .prefault({ 认知标签: '', 情感标签: '', 利益标签: '', 社会标签: '', 综合标签: '' }),
  因果标签: z
    .record(z.string(), z.object({ 标签: z.string(), 来源: z.string() }))
    .optional()
    .prefault({}),
});

const GoalSchema = z.object({
  名称: z.string(),
  动机: z.string().optional().prefault(''),
  状态: z.string().optional().prefault('进行中'),
});

const CharacterSchema = z
  .object({
    $meta: MetaSchema.optional(),
    真名: z.string().optional(), // Only for player
    姓名: z.string().optional(), // Only for NPCs
    灵魂本源: z.coerce.number().optional(), // Player only
    道心: z.coerce.number().optional(), // Player only
    出生日期: z.object({
      纪元ID: z.string(),
      年: z.coerce.number(),
      月: z.coerce.number(),
      日: z.coerce.number(),
    }),
    身份: z.record(z.string(), z.string()).optional(),
    所属世界: z.string(),
    当前位置: z.string(),
    外观描述: z.string(),
    背景: z.object({
      过去经历: z.record(z.string(), z.object({ 事件: z.string(), 影响: z.string() })).optional(),
      性格特质: z.record(z.string(), z.string()).optional(),
    }),
    心流: z
      .object({
        情绪状态: z.object({
          心绪: z.coerce.number().prefault(0),
          怒意: z.coerce.number().prefault(0),
          胆识: z.coerce.number().prefault(0),
          仪态: z.coerce.number().prefault(0),
        }),
        核心需求: z.string(),
        秘密: z.record(z.string(), z.object({ 内容: z.string(), 揭露条件: z.string() })).optional(),
        短期记忆: z.record(z.string(), z.any()).optional(),
        驱动力: z.object({
          长期目标: z.object({ $meta: MetaSchema.optional() }).catchall(GoalSchema).prefault({}),
          短期目标: z.object({ $meta: MetaSchema.optional() }).catchall(GoalSchema).prefault({}),
          决策倾向: z.object({
            常规: z.string(),
            优势时: z.string(),
            险境时: z.string(),
            面对利益时: z.string(),
          }),
        }),
      })
      .optional(),
    本世宿命: z.object({}).passthrough().optional(),
    技艺: z
      .record(z.string(), z.object({ 等级: z.coerce.number().prefault(0), 经验值: z.coerce.number().prefault(0) }))
      .optional(),
    天赋: z.record(z.string(), z.boolean()).optional(),
    基础潜力: z.object({
      精: z.coerce.number().prefault(0),
      气: z.coerce.number().prefault(0),
      神: z.coerce.number().prefault(0),
      运: z.coerce.number().prefault(0),
    }),
    战斗参数: z.object({
      权能: z.coerce.number().prefault(0),
      根基: z.coerce.number().prefault(0),
      机变: z.coerce.number().prefault(0),
      破法: z.coerce.number().prefault(0),
      御法: z.coerce.number().prefault(0),
    }),
    当前状态: z
      .record(z.string(), z.any())
      .and(z.object({ $meta: MetaSchema.optional() }))
      .prefault({ $meta: {} }), // Allow flexible status objects
    背包: z
      .record(z.string(), z.coerce.number())
      .and(z.object({ $meta: MetaSchema.optional() }))
      .prefault({ $meta: {} }),
    已解锁烙印: z.object({ $meta: MetaSchema.optional() }).catchall(z.boolean()).prefault({}),
    已装备烙印: z.array(z.string().nullable()).optional(),
    世界专属属性: z.object({ $meta: MetaSchema.optional() }).catchall(z.any()).prefault({}),
  })
  .passthrough();

const WorldEpochSchema = z.object({
  纪元名称: z.string(),
  可扮演: z.boolean(),
  纪元概述: z.string(),
  当前时间: z
    .union([
      TimeDurationSchema.extend({ 纪元名称: z.string().prefault(''), 纪元顺序: z.coerce.number().prefault(1) }),
      z.string(),
    ])
    .transform(val => {
      if (typeof val === 'string') {
        // 如果是字符串，提供一个默认的TimeDuration对象结构
        return { 纪元名称: '', 纪元顺序: 1, 年: 0, 月: 0, 日: 0, 时: 0, 分: 0 };
      }
      return val;
    }),
  规则: z
    .object({
      世界能级: z.coerce.number().prefault(0),
      时间流速: z
        .union([z.string(), z.coerce.number()])
        .transform(val => {
          if (typeof val === 'number') {
            return val;
          }
          if (typeof val === 'string') {
            const num = parseInt(val, 10);
            return isNaN(num) ? 1 : num;
          }
          return 1;
        })
        .pipe(z.coerce.number())
        .prefault(1),
      空间稳定性: z.coerce.number(),
      生命位格: z
        .union([z.object({ 基准值: z.coerce.number(), 描述: z.string() }), z.coerce.number()])
        .transform(val => {
          if (typeof val === 'number') {
            return { 基准值: val, 描述: '' };
          }
          return val;
        }),
      核心法则: z
        .object({ $meta: MetaSchema.optional() })
        .catchall(z.object({ 名称: z.string(), 描述: z.string(), 体现: z.string() }))
        .prefault({}),
      权柄: z
        .object({ $meta: MetaSchema.optional() })
        .catchall(
          z.object({
            名称: z.string(),
            类型: z.string(),
            描述: z.string(),
            显化能级: z.object({ 当前能级: z.coerce.number(), 能级上限: z.coerce.number(), 影响: z.string() }),
          }),
        )
        .prefault({}),
    })
    .passthrough(),
  世界大事: z.object({ $meta: MetaSchema.optional() }).catchall(z.any()).prefault({}),
  力量体系: z.object({}).passthrough(), // Keeping it flexible for now
});

const WorldSchema = z.object({
  $meta: MetaSchema.optional(),
  元规则: z.object({
    宇宙蓝图: z.string(),
    物理尺度: z.string(),
    支持纪元穿越: z.boolean(),
    定位: z.string().optional(),
    当前纪元ID: z.string(),
  }),
  历史纪元: z.object({ $meta: MetaSchema.optional() }).catchall(WorldEpochSchema).prefault({}),
});

export const WorldStateSchema = z
  .object({
    $meta: MetaSchema.optional(),
    数据库: z
      .object({
        $meta: MetaSchema.optional(),
        消耗品: z.record(z.string(), DatabaseItemSchema).optional(),
        奇物: z.record(z.string(), DatabaseItemSchema).optional(),
        材料: z.record(z.string(), DatabaseItemSchema).optional(),
        羁绊: z.record(z.string(), DatabaseItemSchema).optional(),
        烙印: z.record(z.string(), DatabaseItemSchema).optional(),
        天赋: z.record(z.string(), DatabaseItemSchema).optional(),
        回响: z.record(z.string(), DatabaseItemSchema).optional(),
        技艺: z.record(z.string(), ArtisanSkillSchema).optional(),
        技能: z.record(z.string(), ActiveSkillSchema).optional(),
      })
      .passthrough()
      .prefault({}),
    因果之网: z
      .object({ $meta: MetaSchema.optional() })
      .catchall(z.record(z.string().describe('客体ID'), RelationLayerSchema))
      .prefault({}),
    往世道标: z
      .object({ $meta: MetaSchema.optional() })
      .catchall(z.record(z.string().describe('纪元ID'), z.object({}).passthrough()))
      .prefault({}),
    角色: z.object({ $meta: MetaSchema.optional() }).catchall(CharacterSchema).prefault({}),
    世界: z.object({ $meta: MetaSchema.optional() }).catchall(WorldSchema).prefault({}),
    模拟器: z.object({
      准备: z.object({
        状态: z.string(),
        冷却时间: z.string(),
        已选世界ID: z.string().nullable(),
        已选化身模板: z.string().nullable(),
      }),
      模拟: z.object({
        进行中: z.boolean(),
        当前化身ID: z.string().nullable(),
        干预记录: z.object({ $meta: MetaSchema.optional() }).catchall(z.any()).prefault({}),
      }),
      结算: z.object({
        待处理: z.boolean(),
        本世小结: z.object({ 最高成就: z.string(), 关键记忆: z.array(z.any()) }),
        宿命抉择: z
          .object({ $meta: MetaSchema.optional() })
          .catchall(
            z.object({
              选项类型: z.string(),
              描述: z.string(),
              消耗: z.coerce.number(),
              数据: z.object({ ID: z.string(), 名称: z.string() }),
              目标路径: z.string(),
            }),
          )
          .prefault({}),
      }),
    }),
  })
  .passthrough()
  .describe('完整的世界状态');

// 在 TavernHelper 环境中, 推荐使用以下方式注册 Schema
// import { registerMvuSchema } from '@SillyTavern/TavernHelper';
// $(() => {
//   if (window.registerMvuSchema) {
//     window.registerMvuSchema(WorldStateSchema);
//     console.log('Tavern Helper MVU Schema registered successfully.');
//   } else {
//     console.error('registerMvuSchema function not found. Schema registration failed.');
//   }
// });
