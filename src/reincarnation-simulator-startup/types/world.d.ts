export interface WorldDefinition {
  基础信息: {
    ID: string;
    名称: string;
    描述: string;
  };
  元规则: {
    宇宙蓝图: string;
    物理尺度: string;
    支持纪元穿越: boolean;
    当前纪元ID?: string;
  };
  历史纪元: {
    [key: string]: Epoch;
  };
}

export interface Epoch {
  纪元ID: string;
  纪元名称: string;
  可扮演: boolean;
  纪元概述: string;
  规则: any;
  内容: any;
  力量体系: any;
}

export interface Selections {
  blueprint: string;
  tone: string;
  tags: string[];
  relics: string[];
  identity: string;
  gender: string;
  age: number;
  talents: string[];
  past_experiences: string[];
  character_traits: string[];
  core_need: string;
  arts: string[];
  backpack: { [key: string]: number };
}

export interface PotentialPoints {
  [key: string]: number;
  精: number;
  气: number;
  神: number;
  运: number;
}
