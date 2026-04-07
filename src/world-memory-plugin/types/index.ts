import { z } from 'zod';

// Zod Schema for the RetrievalPlan part of the Analyst's response
const AnalystRetrievalPlanSchema = z.object({
  retrieval_keywords: z.array(z.string()).describe('用于后续世界书检索的核心关键词'),
  stimulus_analysis: z.object({
    actor: z.string().describe('识别出的动作发起者'),
    action: z.string().describe('识别出的核心动作'),
    object: z.string().nullable().describe('识别出的核心物品或null'),
    inferred_intent: z.string().describe('推断出的意图'),
    emotional_tone: z.string().describe('推断出的情感基调'),
  }),
  temporal_context: z.object({
    interaction_time: z.string().describe('交互发生的当前时间'),
    mentioned_time: z.string().nullable().describe('输入中提及的时间或null'),
    analysis: z.string().describe('对时间情境的简短分析'),
  }),
  preliminary_analysis: z.string().describe('一句话的初步内心冲突分析'),
});

// Zod Schema for the optional Reflection part of the Analyst's response
const ReflectionOutputSchema = z.object({
  new_cognitions: z
    .array(
      z.object({
        subject: z.string().describe('新认知的主题'),
        content: z.string().describe('新认知的核心陈述（第一人称）'),
        elaboration: z.string().describe('对该认知的详细阐述或内心独白'),
        behavioral_impact: z.string().describe('该认知对角色行为和决策的具体影响'),
        keywords: z.array(z.string()).describe('与该认知相关的关键词'),
        supporting_memories: z.array(z.string()).describe('支撑该认知的记忆ID列表'),
      }),
    )
    .optional()
    .describe('通过反思形成的新认知列表'),
  cognitive_shifts: z
    .array(
      z.object({
        target_cognition_id: z.string().describe('要修正的现有认知ID'),
        trigger_event: z.string().describe('触发改变的事件或记忆简述'),
        reason_for_change: z.string().describe('思想转变的原因'),
        updated_statement: z.string().describe('修正后的核心陈述'),
        updated_elaboration: z.string().describe('修正后的详细阐述'),
        updated_behavioral_impact: z.string().describe('修正后的行为影响'),
        new_supporting_memories: z.array(z.string()).describe('新增的支撑记忆ID列表'),
      })
    )
    .optional()
    .describe('现有认知的演化与修正'),
  nature_shifts: z
    .array(
      z.object({
        target_nature_id: z.string().describe('要蜕变的现有本性ID'),
        new_trait: z.string().describe('蜕变后的核心陈述'),
        new_elaboration: z.string().describe('蜕变后的详细阐述'),
        new_behavioral_impact: z.string().describe('蜕变后的行为影响'),
        reason: z.string().describe('本性蜕变的原因（结合记忆与认知）'),
        supporting_memory_ids: z.array(z.string()).describe('支撑此次蜕变的近期重大记忆ID列表'),
        supporting_cognition_ids: z.array(z.string()).describe('支撑此次蜕变的现有或新产生的认知ID列表'),
      })
    )
    .optional()
    .describe('核心本性的重大蜕变'),
  promotion_candidates: z
    .array(
      z.discriminatedUnion('type', [
        z.object({
          type: z.literal('memory_to_cognition'),
          source_memory_ids: z.array(z.string()),
          target_cognition_content: z.string(),
          subject: z.string().describe('新认知的主题'),
          keywords: z.array(z.string()).describe('新认知的关键词'),
        }),
        z.object({
          type: z.literal('cognition_to_nature'),
          source_cognition_content: z.string(),
          target_nature_content: z.string(),
          trait_name: z.string().describe('新本性的简短名称'),
          elaboration: z.string().describe('对该本性的详细阐述或内心独白'),
          behavioral_impact: z.string().describe('该本性对角色行为和决策的绝对准则'),
          supporting_memories: z.array(z.string()).describe('继承的支撑记忆ID'),
        }),
      ]),
    )
    .optional()
    .describe('提议晋升的记忆或认知列表'),
  nature_update_suggestion: z.string().optional().describe('对“本性”条目的更新建议（旧版，保留兼容）'),
});

// Zod Schema for the entire Analyst AI response
export const AnalystResponseSchema = z.object({
  reflection_output: ReflectionOutputSchema.optional().describe('可选的反思输出'),
  retrieval_plan: AnalystRetrievalPlanSchema.describe('用于指导叙事AI的检索计划'),
});

// TypeScript type inferred from the Zod schema
export type AnalystResponse = z.infer<typeof AnalystResponseSchema>;
export type RetrievalPlan = z.infer<typeof AnalystRetrievalPlanSchema>; // For convenience

// Zod Schema for the EpisodicMemoryUnit object from narrator.txt
export const EpisodicMemoryUnitSchema = z.object({
  id: z.string().startsWith('mem-', { message: "ID必须以 'mem-' 开头" }).describe('记忆单元的唯一ID'),
  timestamp: z.string({ message: '时间戳必须是有效的日期时间格式 (例如: YYYY-MM-DD HH:MM:SS)' }),
  created_at_message_id: z.number().int().positive().describe('该记忆创建时的聊天消息ID (楼层)'),
  type: z.enum(['episodic', 'semantic']).optional().describe('记忆的类型'),
  summary: z.object({
    text: z.string().describe('对事件的简短总结'),
    keywords: z.array(z.string()).describe('与该记忆相关的关键词'),
  }),
  flashbulb_fragments: z.object({
    visual: z.string().describe('视觉相关的闪光灯记忆碎片'),
    auditory: z.string().describe('听觉相关的闪光灯记忆碎片'),
    somatic: z.string().describe('体感相关的闪光灯记忆碎片'),
  }),
  full_context: z.object({
      description: z.string().optional(),
      stimulus: z.object({
        source: z.string(),
        action: z.string(),
        object: z.string(),
        keywords: z.array(z.string()),
      }).partial().optional(),
      response: z.object({
        action: z.string(),
        dialogue: z.string(),
        keywords: z.array(z.string()),
      }).partial().optional(),
      psyche: z.object({
        emotion_spectrum: z.record(z.string(), z.number()).describe('情绪光谱'),
        cognitive_attribution: z.string().describe('认知归因'),
        self_reflection: z.string().optional().describe('关于该事件的自我反思'),
      }).partial().optional(),
      visual_context_snapshot: z.object({
        my_apparel: z.string(),
        user_apparel: z.string(),
        environment_details: z.string(),
      }).partial().optional(),
    }).partial().optional(),
  links: z.object({
    by_person: z.array(z.string()),
    by_object: z.array(z.string()),
    by_emotion: z.array(z.string()),
    causal_chain: z.string().nullable(),
  }).partial().optional(),
});

// TypeScript type inferred from the Zod schema
export type EpisodicMemoryUnit = z.infer<typeof EpisodicMemoryUnitSchema>;

// A more lenient schema for the synthesis process, where message ID doesn't exist yet.
export const SynthesisEpisodicMemoryUnitSchema = EpisodicMemoryUnitSchema.omit({ created_at_message_id: true });

// Zod Schema for API settings in the UI
export const ApiSettingsSchema = z.object({
  apiUrl: z.string().url().or(z.literal('')).describe('AI服务的URL'),
  apiKey: z.string().describe('API Key'),
  model: z.string().describe('模型名称'),
});

// TypeScript type for API settings
export type ApiSettings = z.infer<typeof ApiSettingsSchema>;

// Zod Schema for the Synthesis AI response
export const SynthesisEntrySchema = z.object({
  type: z.enum(['nature', 'cognition', 'episodic']),
  placeholder_id: z.string().optional(),
  memory_data: SynthesisEpisodicMemoryUnitSchema.optional(),
  content: z.string().optional(),
  elaboration: z.string().optional(),
  behavioral_impact: z.string().optional(),
  subject: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  supporting_memories: z.array(z.string()).optional(),
});

export const SynthesisResponseSchema = z.array(SynthesisEntrySchema);

// TypeScript types
export type SynthesisEntry = z.infer<typeof SynthesisEntrySchema>;
export type SynthesisResponse = z.infer<typeof SynthesisResponseSchema>;

// Zod Schema for a single Nature Trait
export const NatureTraitSchema = z.object({
  id: z.string(),
  trait: z.string(),
  description: z.string().optional(),
  elaboration: z.string().optional().describe('详细阐述/内心独白'),
  behavioral_impact: z.string().optional().describe('行为影响/绝对准则'),
  created_at_message_id: z.number().optional().describe('该本性创建时的聊天消息ID (楼层)'),
  evolution: z.array(z.object({
    timestamp: z.string(),
    reason: z.string(),
    previous_trait: z.string().optional(),
    previous_elaboration: z.string().optional(),
    previous_behavioral_impact: z.string().optional(),
    new_description: z.string().optional(),
  })).optional(),
  supporting_memories: z.array(z.string()),
});

export const NatureSchema = z.array(NatureTraitSchema);

// Zod Schema for a single Cognitive Statement
export const CognitiveStatementSchema = z.object({
  id: z.string().uuid().describe('认知陈述的唯一ID'),
  timestamp: z.string(),
  created_at_message_id: z.number().optional().describe('该认知创建时的聊天消息ID (楼层)'),
  statement: z.string(),
  elaboration: z.string().optional().describe('详细阐述/内心独白'),
  behavioral_impact: z.string().optional().describe('行为影响/表现指南'),
  evolution: z.array(z.object({
    timestamp: z.string(),
    trigger_event: z.string(),
    previous_statement: z.string(),
    reason: z.string(),
  })).optional().describe('认知的演化历史'),
  supporting_memories: z.array(z.string()),
});

export const CognitionSchema = z.array(CognitiveStatementSchema);

// TypeScript types
export type NatureTrait = z.infer<typeof NatureTraitSchema>;
export type Nature = z.infer<typeof NatureSchema>;
export type CognitiveStatement = z.infer<typeof CognitiveStatementSchema>;
export type Cognition = z.infer<typeof CognitionSchema>;
