import { reactive, readonly } from 'vue';
import type { WorldDefinition } from '../../../types/world';
import type { MapNode } from '../types';

interface NavigationCrumb {
  id: string;
  name: string;
}

interface MapState {
  currentRootId: string;
  navigationPath: NavigationCrumb[];
  selectedNode: MapNode | null;
  isDetailPanelVisible: boolean;
  worldData: WorldDefinition | null;
  userLocationId: string | null;
  avatarLocationId: string | null;
}

const state = reactive<MapState>({
  currentRootId: 'WORLD_ORIGIN',
  navigationPath: [{ id: 'WORLD_ORIGIN', name: '世界' }],
  selectedNode: null,
  isDetailPanelVisible: false,
  worldData: null,
  userLocationId: null,
  avatarLocationId: null,
});

const actions = {
  /**
   * 导航到一个新的根节点（钻取）。
   * @param node - 要导航到的目标节点。
   */
  navigateToNode(node: MapNode): void {
    state.currentRootId = node.id;
    // 检查是否已在路径中，防止重复添加
    if (!state.navigationPath.find(crumb => crumb.id === node.id)) {
      state.navigationPath.push({ id: node.id, name: node.name });
    }
  },

  /**
   * 根据导航路径返回到指定的层级。
   * @param targetId - 要返回到的目标节点的ID。
   */
  navigateBack(targetId: string): void {
    const targetIndex = state.navigationPath.findIndex(crumb => crumb.id === targetId);
    if (targetIndex > -1) {
      state.currentRootId = targetId;
      state.navigationPath.splice(targetIndex + 1);
    }
  },

  /**
   * 选中一个节点以显示其详细信息。
   * @param node - 被选中的节点。
   */
  selectNode(node: MapNode): void {
    state.selectedNode = node;
    state.isDetailPanelVisible = true;
  },

  /**
   * 隐藏节点详细信息面板。
   */
  hideDetail(): void {
    state.selectedNode = null;
    state.isDetailPanelVisible = false;
  },

  /**
   * 完全替换当前的导航路径。
   * @param path - 新的导航路径数组。
   */
  setNavigationPath(path: NavigationCrumb[]): void {
    state.navigationPath = path;
  },
  
  /**
   * 设置完整的世界数据，供各组件查询。
   * @param data - 从 Lorebook 解析出的世界定义。
   */
  setWorldData(data: WorldDefinition): void {
    state.worldData = data;
  },
  
  /**
   * 设置玩家本体和化身的位置ID。
   * @param locations - 包含 user 和 avatar 位置ID的对象。
   */
  setPlayerLocations(locations: { user: string | null; avatar: string | null }): void {
    state.userLocationId = locations.user;
    state.avatarLocationId = locations.avatar;
  },
};

export const mapState = readonly(state);
export const mapActions = actions;
