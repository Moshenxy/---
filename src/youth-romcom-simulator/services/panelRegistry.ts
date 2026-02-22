import { defineAsyncComponent, type Component } from 'vue';

export interface PanelInfo {
  component: Component;
  title: string;
}

// 定义一个更扁平化的面板注册表类型
type PanelRegistry = Record<string, Record<string, PanelInfo>>;

/**
 * Panel Registry v2.0 - 适配 `综漫-春物` 单一世界观
 * @description 移除了 `mainWorld`, `avatarWorld`, `reincarnation` 等多世界概念，
 *              聚焦于当前世界的核心功能面板。
 */
export const panelRegistry: PanelRegistry = {
  // 代表当前世界的核心面板
  world: {
    inventory: {
      component: defineAsyncComponent(() => import('../components/panels/InventoryPanel.vue')),
      title: '背包',
    },
    skills: {
      component: defineAsyncComponent(() => import('../components/panels/SkillsPanel.vue')),
      title: '技能',
    },
    worldDetails: {
      component: defineAsyncComponent(() => import('../components/panels/WorldDetailsPanel.vue')),
      title: '世界设定',
    },
    destiny: {
      component: defineAsyncComponent(() => import('../components/panels/DestinyCardPanel.vue')),
      title: '命运卡牌',
    },
  },
  // 代表全局通用的系统级面板
  system: {
    npcDirectory: {
      component: defineAsyncComponent(() => import('../components/panels/NpcDirectoryPanel.vue')),
      title: '众生名录',
    },
    saveLoad: {
      component: defineAsyncComponent(() => import('../components/panels/SystemPanel.vue')),
      title: '系统',
    },
    debug: {
      component: defineAsyncComponent(() => import('../components/panels/DebugPanel.vue')),
      title: '调试面板',
    },
    review: {
      component: defineAsyncComponent(() => import('../components/panels/ReincarnationPanel.vue')),
      title: '回顾',
    },
  },
};
