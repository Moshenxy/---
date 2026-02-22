import type { SimulationNodeDatum } from 'd3';

// ######### 基于 [系统]世界生成及演化规则.txt 的 YAML 结构定义 #########

export type Unit = 'km' | '光年' | 'AU' | string;

export interface RelativeCoordinate {
  参考ID: string;
  方位: string; // "['北', 15]"
  距离: [number, Unit];
}

export interface SpatialEntity {
  ID: string;
  名称: string;
  层级类型: string;
  所属: { ID: string; 类型: '空间实体' };
  面积?: [number, Unit];
  描述: string;
  相对坐标?: RelativeCoordinate;
}

export interface Resource {
    ID: string;
    名称: string;
    所属实体ID: string;
    类型: '矿物' | '草药' | '能量' | '灵魂' | '知识' | string;
    能级: number;
    稀有度: '常见' | '稀有' | '传说' | '史诗' | '神话' | string;
    描述: string;
}

export interface Faction {
    ID: string;
    名称: string;
    类型: string;
    核心目标: string;
    力量亲和: readonly string[];
}

export interface Civilization {
    主流文明形态: string;
    社会结构: string;
    文化内核: {
        核心价值观: readonly string[];
        社会风貌: string;
        禁忌与信仰: string;
    };
    艺术与科技风格: string;
    势力: readonly Faction[];
    群体?: any[]; // 暂不详细定义
}


export interface Content {
  空间实体: readonly SpatialEntity[];
  资源: readonly Resource[] | undefined; // 资源可以不存在，但如果存在，它是一个只读数组
  文明: Civilization;
  历史: any; // 暂不详细定义
  秘境?: any; // 暂不详细定义
}

export interface WorldDefinition {
  基础信息: {
    ID: string;
    名称: string;
    描述: string;
  };
  规则: any; // 暂不详细定义
  状态: any; // 暂不详细定义
  内容: Content;
  力量体系: any; // 暂不详细定义
}


// ######### 用于地图可视化的前端节点定义 #########


/**
 * 代表一个经过处理、用于前端可视化的空间实体节点。
 * 这是力导向图的基本数据单元。
 */
export interface MapNode extends SimulationNodeDatum {
  // 核心标识
  id: string;
  name: string;

  /**
   * 节点的层级类型，直接来自世界书中的 `层级类型`。
   * 例如: "大陆", "国家", "城市"。
   */
  type: string;

  // 层级关系
  parentId: string | null;
  children: MapNode[];
  /**
   * 该节点的子节点数量，用于计算其视觉大小。
   */
  childCount: number;

  // 视觉属性 (由布局服务计算)
  /**
   * 节点的视觉半径。
   */
  radius: number;
  /**
   * 节点在画布上的x坐标。
   */
  x?: number;
  /**
   * 节点在画布上的y坐标。
   */
  y?: number;

  // 原始数据
  /**
   * 来自世界书的未经处理的原始实体数据。
   */
  data: SpatialEntity;
}

/**
 * 代表从根节点开始的完整层级树。
 */
export type MapHierarchy = MapNode;
