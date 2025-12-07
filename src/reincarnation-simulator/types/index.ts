import type { Consumable, Relic, Material, Bond, Imprint } from './items';
import type { Epoch, MetaRules } from './world';

export type { Epoch };

/**
 * @file 本文件是项目的核心类型定义中心，所有全局共享的类型和接口都在此定义。
 * @version 8.0 - 全面适配最新的 "纪元中心化" 数据结构
 */

export type ExtensibleObject<T> = {
  [key: string]: T | any;
  $meta?: { extensible: true; description?: string };
};


// --- 核心数据实体接口 ---

export interface RelationshipVector {
  认知层: { 可靠度: number; 能力评价: number; 威胁度: number; };
  情感层: { 亲近感: number; 仰慕度: number; };
  利益层: { 资源价值: number; 合作潜力: number; 利益冲突: number; };
  社会层: {
    名义关系: ExtensibleObject<string>;
    阶级差异: number;
    阵营立场: '盟友' | '中立' | '敌对';
  };
  印象标签: {
    认知标签: string;
    情感标签: string;
    利益标签: string;
    社会标签: string;
    综合标签: string;
  };
}

export interface Character {
  真名?: string;
  灵魂本源?: number;
  道心?: number;
  已解锁烙印?: { [imprintId: string]: true };
  已装备烙印?: (string | null)[];

  姓名: string;
  出生日期: {
    纪元ID: string;
    年: number;
    月: number;
    日: number;
  };
  身份: ExtensibleObject<string>;
  所属世界: string;
  当前位置: string;
  性别?: string;
  相貌?: string;
  着装?: string;
  外观描述?: string;

  背景: {
    过去经历: ExtensibleObject<{ 事件: string; 描述?: string; 影响?: string }>;
    性格特质: ExtensibleObject<string>;
  };

  心流: {
    情绪状态: { 喜悦: number; 悲伤: number; 愤怒: number; 恐惧: number; };
    核心需求: string;
    秘密: ExtensibleObject<{ 内容: string; 揭露条件: string }>;
    短期记忆: ExtensibleObject<any>;
    驱动力: {
      长期目标: ExtensibleObject<{ 名称: string; 动机: string; 状态: string }>;
      短期目标: ExtensibleObject<{ 名称: string; 动机: string; 状态: string }>;
      决策倾向: { 常规: string; 优势时: string; 险境时: string; 面对利益时: string; };
    };
    生活模式: {
      核心活动: ExtensibleObject<{ 基础意愿: number }>;
      活动区域: ExtensibleObject<string>;
      社交倾向: string;
    };
  };

  本世宿命?: any;

  技艺?: { [skillId: string]: { 等级: number; 经验值: number } };

  基础潜力: { 精: number; 气: number; 神: number; 运: number; };
  战斗参数: { 权能: number; 根基: number; 机变: number; 破法: number; 御法: number; };

  当前状态: ExtensibleObject<any>;
  背包: { [itemId: string]: number };
  世界专属属性: { [key: string]: any };
  [key: string]: any;
}

/**
 * 世界的核心数据结构 (对应 stat_data 中的世界变量)
 * 严格参照 [InitVar].txt 的结构
 */
export interface World {
  元规则: MetaRules;
  历史纪元: {
    // 这里 Epoch 使用 any 是因为变量文件中的 Epoch 结构与世界书解析出的 Epoch 结构不同（缺少`内容`字段）
    // 为了避免循环依赖和过度复杂的类型体操，此处做简化处理。
    [epochId: string]: any; 
  };
}


// --- 状态管理相关接口 ---

/**
 * 完整的世界状态，对应于从酒馆后端获取的整个 stat_data 对象。
 */
export interface WorldState {
  数据库: {
    消耗品: { [id: string]: Consumable };
    奇物: { [id: string]: Relic };
    材料: { [id: string]: Material };
    羁绊: { [id: string]: Bond };
    烙印: { [id: string]: Imprint };
    技艺?: { [id: string]: any };
    技能?: { [id: string]: any };
    活动模板?: { [worldId: string]: { [activityId: string]: any } };
  };
  因果之网: {
    [subjectId: string]: {
      [objectId: string]: RelationshipVector;
    };
  };
  角色: {
    [id: string]: Character;
  };
  世界: {
    [id: string]: World;
  };
  模拟器?: any;
  [key: string]: any;
}

/**
 * Vue Store 的状态接口
 */
export interface AppState {
  isReady: boolean;
  character: Character | null;
  worldState: WorldState | null;
  userId: string;
  mainWorldNarrative: string;
  avatarWorldNarrative: string;
  activeView: 'mainWorld' | 'avatarWorld' | null;
  selectedWorldForReincarnation: WorldbookEntry | null;
  reincarnationWorldOptions: WorldbookEntry[];
  reincarnationAvatarOptions: any[];
  worldLog: WorldLogEntry[];
  settlementData: WorldSettlement | null;
  newWorldsAvailable: boolean;
  isGenerating: boolean;
  generationError: string | null;
}

// --- 其他辅助接口 ---

/**
 * 世界书条目接口
 */
export interface WorldbookEntry {
  uid: number;
  name: string;
  content: string;
  enabled: boolean;
  keys: string[];
  comment?: string;
  [key: string]: any;
}

/**
 * 结构化世界日志条目
 */
export interface WorldLogEntry {
  序号: number;
  日期: string;
  标题: string;
  地点: string;
  人物: string;
  描述: string;
  人物关系: string;
  标签: string[];
  重要信息: string;
  暗线与伏笔: string;
  自动化系统: string;
}

/**
 * 轮回结算数据
 */
export interface WorldSettlement {
  第x世: number;
  事件脉络: string;
  本世概述: string;
  本世成就: string;
  本世获得物品: string;
  本世人物关系网: string;
  死亡原因: string;
  本世总结: string;
  本世评价: string;
}

/**
 * 任务接口 (包括衍生任务和命运节点)
 */
export interface Task {
  ID: string;
  名称: string;
  类型: '命运节点' | '衍生任务' | '终极任务';
  状态: '未开始' | '进行中' | '完成';
  描述: string;
  目标: string;
  前置任务ID?: string | null;
  可选后续任务ID?: string[];
  奖励?: any;
  完成条件?: string[];
}

/**
 * 命运节点接口 - 现在它只是 Task 的一个别名，因为结构已经统一
 */
export type DestinyNode = Task;

export interface ArtisanSkill {
  ID: string;
  名称: string;
  描述: string;
  关联潜力: string;
  等级上限: number;
  效果描述: string;
  效果等级公式?: string;
  等级体系: {
    等级: number;
    称号: string;
    升级所需经验: number;
  }[];
}

export interface ActiveSkill {
  ID: string;
  名称: string;
  描述: string;
  关联技艺: string;
  类型: string;
  基础效果: string;
  效果等级公式: string;
}
