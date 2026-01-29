/**
 * @file 本文件定义了所有与物品、装备、道具相关的类型接口。
 */

/**
 * 物品效果的通用接口
 */
export interface Effects {
  attributes_bonus?: { [key: string]: number };
  percentage_bonus?: { [key: string]: string };
}

/**
 * 基础物品接口
 */
export interface BaseItem {
  ID?: string;
  名称: string;
  类型: '消耗品' | '奇物' | '材料' | '羁绊' | '天赋' | '装备';
  能级: number;
  描述: string;
  effects?: Effects;
 数量?: number;
}

/**
 * 消耗品
 */
export interface Consumable extends BaseItem {
  类型: '消耗品';
  数量?: number;
}

/**
 * 奇物 (可跨世界使用的特殊物品)
 */
export interface Relic extends BaseItem {
  类型: '奇物';
}

/**
 * 材料
 */
export interface Material extends BaseItem {
  类型: '材料';
  数量?: number;
}

/**
 * 羁绊 (角色卡)
 */
export interface Bond extends BaseItem {
  类型: '羁绊';
  召唤消耗: number;
  伪装消耗: number;
  角色快照: {
    姓名: string;
    核心特质: string[];
  };
}

/**
 * 轮回烙印 (继承的天赋或装备)
 */
export interface Imprint extends BaseItem {
  类型: '天赋' | '装备';
}

// 联合类型，方便在函数中使用
export type Item = Consumable | Relic | Material | Bond | Imprint;