/**
 * @file 本文件定义了“演化压力”与“叙事引力”模型的核心数据结构。
 * @version 1.0.0
 * @author Roo
 */

/**
 * 描述驱动世界演化的宏观“压力源”。
 */
export interface EvolutionaryPressure {
  /** 压力类型 */
  type: 'survival' | 'authority' | 'desire' | 'custom';
  /** 压力的来源 */
  source: {
    type: 'faction' | 'npc' | 'global' | 'region';
    id: string;
  };
  /** 压力强度 (0-100) */
  intensity: number;
  /** 对压力的简短描述 */
  description: string;
  /** 压力最终将导致的目标或意图 */
  intent: string;
}

/**
 * 描述在压力下发生的、具体的“远方事件”。
 */
export interface StressReactionEvent {
  /** 事件唯一ID */
  id: string;
  /** 事件发生的精确游戏内时间戳 */
  timestamp: number;
  /** 事件发生的地点ID */
  locationId: string;
  /** 事件类型 */
  type: 'military' | 'political' | 'economic' | 'supernatural' | 'personal';
  /** 对事件的简短、客观的描述 */
  description: string;
  /** 参与此事件的核心NPC或势力ID */
  participants: string[];
  /** 此事件的直接源头压力 */
  sourcePressure: EvolutionaryPressure;
}

/**
 * 描述事件传播的“涟漪”，这是最终能被玩家感知的“信息”。
 */
export interface InformationRipple {
  /** 涟漪的唯一ID */
  id: string;
  /** 源头事件ID */
  sourceEventId: string;
  /** 信息的传播媒介与类型 */
  type: 'rumor' | 'official_report' | 'economic_change' | 'physical_phenomenon' | 'quest_lead';
  /** 信息的核心内容 */
  content: string;
  /** 预计到达玩家感知范围的时间戳 */
  arrivalTimestamp: number;
  /** 此信息主要影响的地理区域或势力范围 */
  sphereOfInfluence: {
    locationIds: string[];
    factionIds: string[];
  };
  /** 信息随时间或距离衰减、失真的速率 (0-1) */
  decayRate: number;
  /** 信息当前的失真程度 (0-1) */
  distortion: number;
}

/**
 * 定义世界内的信息传播法则。
 */
export interface InformationPropagationRule {
  /** 媒介类型 */
  medium: 'rumor' | 'official_courier' | 'magical_transmission' | 'trade_caravan';
  /** 基础传播速度 (公里/天) */
  baseSpeed: number;
  /** 影响速度的修正因素 */
  modifiers: {
    /** 空间稳定性对速度的影响系数 */
    spatialStabilityFactor: number;
    /** 世界能级对速度的影响系数（如灵网） */
    energyLevelFactor: number;
  };
}