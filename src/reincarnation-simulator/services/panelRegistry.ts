import type { Component } from 'vue';
import AvatarCharacterPanel from '../components/panels/avatar/AvatarCharacterPanel.vue';
import AvatarInventoryPanel from '../components/panels/avatar/AvatarInventoryPanel.vue';
import AvatarTasksPanel from '../components/panels/avatar/AvatarTasksPanel.vue';
import CharacterPanel from '../components/panels/CharacterPanel.vue';
import ImprintsPanel from '../components/panels/ImprintsPanel.vue';
import InventoryPanel from '../components/panels/InventoryPanel.vue';
import NpcDirectoryPanel from '../components/panels/NpcDirectoryPanel.vue';
import ReincarnationPanel from '../components/panels/ReincarnationPanel.vue';
import RippleDetailPanel from '../components/panels/RippleDetailPanel.vue';
import SkillsPanel from '../components/panels/SkillsPanel.vue';
import SystemPanel from '../components/panels/SystemPanel.vue';
import WorldDetailsPanel from '../components/panels/WorldDetailsPanel.vue';
import AvatarWorldMapView from '../modules/world-map/components/AvatarWorldMapView.vue';
import WorldMapView from '../modules/world-map/components/WorldMapView.vue';

export interface PanelInfo {
  component: Component;
  title: string;
}

type PanelRegistry = Record<string, Record<string, PanelInfo>>;

export const panelRegistry: PanelRegistry = {
  mainWorld: {
    character: { component: CharacterPanel, title: '角色本体' },
    inventory: { component: InventoryPanel, title: '本体背包' },
    skills: { component: SkillsPanel, title: '本体技艺' },
    imprints: { component: ImprintsPanel, title: '轮回烙印' },
    worldDetails: { component: WorldDetailsPanel, title: '主世界详情' },
    sandbox: { component: WorldMapView, title: '世界沙盘' },
  },
  avatarWorld: {
    character: { component: AvatarCharacterPanel, title: '化身详情' },
    inventory: { component: AvatarInventoryPanel, title: '化身背包' },
    tasks: { component: AvatarTasksPanel, title: '本世任务' },
    worldDetails: { component: WorldDetailsPanel, title: '化身世界详情' },
    sandbox: { component: AvatarWorldMapView, title: '化身世界沙盘' },
  },
  reincarnation: {
    main: { component: ReincarnationPanel, title: '轮回' },
  },
  allWorlds: {
    npcDirectory: { component: NpcDirectoryPanel, title: '众生名录' },
  },
  ripples: {
    detail: { component: RippleDetailPanel, title: '往世涟漪详情' },
  },
  system: {
    saveLoad: { component: SystemPanel, title: '系统' },
  },
};
