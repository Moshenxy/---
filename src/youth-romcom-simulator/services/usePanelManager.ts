import { dockManagerService } from './DockManagerService';
import { eventBus } from './EventBus';
import { panelRegistry } from './panelRegistry';

/**
 * Panel Manager Hook v2.0 - 适配 `综漫-春物` 单一世界观
 * @description 简化了面板打开逻辑，移除了多世界相关的检查。
 */
export function usePanelManager() {
  const openPanel = (category: keyof typeof panelRegistry, panel: string, props: Record<string, any> = {}) => {
    const panelInfo = panelRegistry[category]?.[panel];

    if (panelInfo) {
      // 使用 category 和 panel 名来创建唯一的组件名和面板ID
      const panelId = `${category}-${panel}-${props.id || ''}`.toLowerCase();
      const componentName = `${category}-${panel}`.toLowerCase();

      // 注册组件
      dockManagerService.registerComponent(componentName, panelInfo.component);

      // 打开面板
      dockManagerService.openPanel(panelId, panelInfo.title, componentName, props);

      // 发出事件，通知布局服务等其他模块
      eventBus.emit('panelOpened', { category, panel, props, panelId });
    } else {
      console.warn(`[PanelManager] Panel not found for category: ${category}, panel: ${panel}`);
    }
  };

  return { openPanel };
}
