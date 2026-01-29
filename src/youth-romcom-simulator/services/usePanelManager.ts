import { dockManagerService } from './DockManagerService';
import { eventBus } from './EventBus';
import { panelRegistry } from './panelRegistry';

export function usePanelManager() {
  const openPanel = (world: keyof typeof panelRegistry, panel: string, props: Record<string, any> = {}) => {
    const panelInfo = panelRegistry[world]?.[panel];
    if (panelInfo) {
      const panelId = `${world}-${panel}-${props.rippleId || ''}`.toLowerCase();
      const componentName = `${world}-${panel}`.toLowerCase();

      // Ensure the component is registered before trying to open it
      dockManagerService.registerComponent(componentName, panelInfo.component);

      const finalProps = { worldType: world, ...props };
      dockManagerService.openPanel(panelId, panelInfo.title, componentName, finalProps);
      
      eventBus.emit('panelOpened', { world, panel, props, panelId });
    }
  };

  return { openPanel };
}
