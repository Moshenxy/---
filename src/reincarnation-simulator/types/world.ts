/**
 * @file world.ts
 * @description Defines the TypeScript interfaces for a world's structured data,
 *              as parsed from the lorebook entry, based on the V8.0 "Epoch Centric" world generation rules.
 */

export interface WorldDefinition {
  基础信息: BasicInfo;
  元规则: MetaRules;
  历史纪元: {
    [epochId: string]: Epoch;
  };
}

export interface BasicInfo {
  ID: string;
  名称: string;
  描述: string;
}

export interface MetaRules {
  宇宙蓝图: string;
  物理尺度: string;
  支持纪元穿越: boolean;
  定位?: '主世界' | '当前化身世界' | '无化身世界';
  当前纪元ID?: string;
}

export interface Epoch {
  纪元ID: string;
  纪元名称: string;
  可扮演: boolean;
  纪元概述: string;
  规则: WorldRules;
  状态?: WorldStatus; // Optional as it might not be in the definition
  内容: WorldContent;
  力量体系: PowerSystem;
}

// --- Epoch Sub-Interfaces ---

export interface WorldRules {
  世界能级: number;
  时间流速: string;
  空间稳定性: number;
  生命位格: { 基准值: number; 描述: string };
  核心法则: CoreLaw[];
  权柄: any[]; // Simplified
  演化逻辑: any; // Simplified
}

export interface CoreLaw {
  名称: string;
  描述: string;
  体现: string;
}

export interface WorldStatus {
  当前标签: string[];
}

export interface WorldContent {
  空间实体: SpatialEntity[];
  资源?: Resource[];
  文明: Civilization;
  历史: History;
  秘境: SecretRealm[];
}

export interface PowerSystem {
  体系概述: string;
  成长闭环: string[];
  机制核心: string[];
  专长与流派: Specialization[];
  关键资源依赖: string[];
  属性模板: AttributeTemplate[];
  成长转换规则: AttributeRule[];
  战斗参数计算规则: AttributeRule[];
  属性上限计算规则: AttributeRule[];
  基础潜力计算规则: any;
  境界定义: RealmDefinition[];
}

// --- Shared & Detailed Interfaces ---

export type Unit = 'km' | '里' | '光年' | '天文单位' | 'km²' | '里²' | '光年²' | '天文单位²';
export type Area = [number, Unit];

export interface RelativeCoordinate {
  参考ID: string;
  方位: string;
  距离: [number, Unit];
}

export interface SpatialEntity {
  ID: string;
  名称: string;
  层级类型: string;
  所属: {
    ID: string;
    类型: '空间实体';
  };
  面积?: Area;
  描述: string;
  相对坐标?: RelativeCoordinate;
}

export interface Resource {
  ID: string;
  名称: string;
  所属实体ID: string;
  类型: '矿物' | '草药' | '能量' | '灵魂' | '知识';
  能级: number;
  稀有度: string;
  描述: string;
}

export interface Civilization {
  主流文明形态: string;
  社会结构: string;
  文化内核: Culture;
  艺术与科技风格: string;
  势力: Faction[];
  群体: Group[];
}

export interface Culture {
  核心价值观: string[];
  社会风貌: string;
  禁忌与信仰: string;
}

export interface Faction {
  ID: string;
  名称: string;
  类型: string;
  核心目标: string;
  力量亲和: string[];
}

export interface Group {
  ID: string;
  名称: string;
  所属势力ID: string;
  行为模式: string[];
}

export interface History {
  历史纪元: Era[];
  预言之谜: Prophecy[];
}

export interface Era {
  纪元名称: string;
  起止时间: string;
  简述: string;
  历史遗留问题: string;
  地理影响?: string;
}

export interface Prophecy {
  预言内容: string;
  已解读部分: string;
  未解之谜: string;
}

export interface SecretRealm {
  ID: string;
  名称: string;
  状态: string;
  法则倾向: string[];
  解锁条件: string[];
}

export interface Specialization {
  流派名称: string;
  核心理念: string;
  代表能力: string[];
  机制影响: string[];
}

export interface AttributeTemplate {
  属性: string;
  描述: string;
}

export interface AttributeRule {
  目标属性: string;
  公式: string;
  描述?: string;
  名称?: string;
  源属性?: string;
}

export interface RealmDefinition {
  能级: number;
  名称: string;
  描述: string;
  解锁系统: {
    名称: string;
    关联变量: string;
    描述: string;
  };
  晋升需求: any;
}
