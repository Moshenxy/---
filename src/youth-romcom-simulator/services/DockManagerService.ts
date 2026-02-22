import { ComponentContainer, GoldenLayout, LayoutConfig } from 'golden-layout';
import { Component, defineComponent, h, render } from 'vue';
import MainView from '../MainView.vue';
import TimelinePanel from '../components/panels/TimelinePanel.vue';
import { panelRegistry } from './panelRegistry';
import { eventBus } from './EventBus';

class DockManagerService {
  private goldenLayout: GoldenLayout | null = null;
  private hostElement: HTMLElement | null = null;
  private componentMap: Map<string, Component> = new Map();
  public onAction: ((action: string) => void) | null = null;
  initialize(hostElement: HTMLElement) {
    if (this.goldenLayout || !hostElement) return;

    this.hostElement = hostElement;
    this.goldenLayout = new GoldenLayout(this.hostElement);

    // Pre-register all possible panel components
    this.registerComponent('main-view', MainView);
    this.registerComponent('timeline-panel', TimelinePanel);
    for (const world in panelRegistry) {
      for (const panel in panelRegistry[world]) {
        const componentName = `${world}-${panel}`.toLowerCase();
        const panelInfo = panelRegistry[world][panel];
        this.registerComponent(componentName, panelInfo.component);
      }
    }


    window.addEventListener('resize', () => this.updateLayout());

    // Layout loading is now handled by LayoutService restoring panels
    // this.loadSavedLayout();
  }

  public loadLayout(config: LayoutConfig) {
    if (!this.goldenLayout) return;
    try {
      this.goldenLayout.loadLayout(config);
    } catch (e) {
      console.error('Failed to load layout:', e);
      // Attempt to load default as a fallback
      try {
        this.goldenLayout.loadLayout(this.getDefaultLayout());
      } catch (e2) {
        console.error('Failed to load default layout on fallback:', e2);
      }
    }
  }

  // This method is no longer needed as LayoutService handles restoration logic.
  // We keep the method stub in case it's called elsewhere, but it does nothing.
  loadSavedLayout() {
    if (!this.goldenLayout) return;
    // Load a minimal default layout, LayoutService will populate it.
    this.goldenLayout.loadLayout(this.getDefaultLayout());
  }

  registerComponent(componentName: string, component: Component) {
    if (this.componentMap.has(componentName)) {
      return;
    }
    this.componentMap.set(componentName, component);

    this.goldenLayout?.registerComponent(componentName, (container: ComponentContainer, componentState: any) => {
      const vueComponent = defineComponent({
        setup: () => () => h(component, componentState?.props || {}),
      });
      const vnode = h(vueComponent);
      render(vnode, container.getElement() as HTMLElement);

      // Directly set the title from the component state
      if ((componentState as any)?.title) {
        container.setTitle((componentState as any).title);
      }
      
      // Add a destroy listener to notify LayoutService
      (container as any).on('destroy', () => {
        const panelId = (componentState as any)?.panelId;
        if (panelId) {
          eventBus.emit('panelClosed', panelId);
        }
      });
    });
  }

  openPanel(panelId: string, title: string, componentName: string, props: Record<string, any> = {}) {
    if (!this.goldenLayout) {
      console.error('Golden Layout not initialized.');
      return;
    }

    const component = this.componentMap.get(componentName);
    if (!component) {
      console.error(`Component "${componentName}" is not registered.`);
      return;
    }

    this.goldenLayout.addComponent(componentName, { title, props, panelId }, panelId);
  }

  updateLayout() {
    if (this.goldenLayout && this.hostElement) {
      this.goldenLayout.updateSize(this.hostElement.clientWidth, this.hostElement.clientHeight);
    }
  }

  closeAllPanels() {
    if (!this.goldenLayout?.rootItem) return;

    // Create a copy of the array to avoid issues while iterating and removing
    const closableItems = this.goldenLayout.rootItem.contentItems.filter((item: any) => item.isClosable);

    closableItems.forEach((item: any) => {
      try {
        item.remove();
      } catch (e) {
        console.error('Failed to remove panel item:', item, e);
      }
    });
  }

  destroy() {
    if (this.goldenLayout) {
      this.goldenLayout.destroy();
      this.goldenLayout = null;
    }
    this.componentMap.clear();
    window.removeEventListener('resize', () => {});
  }

  unpinAllPanels() {
    if (!this.goldenLayout) return;
    // 重置为默认布局可以实现取消所有面板的固定状态
    this.goldenLayout.loadLayout(this.getDefaultLayout());
    // 也可以遍历所有 item 并设置 isPinned = false，但这更复杂
  }

  private getDefaultLayout(): LayoutConfig {
    return {
      root: {
        type: 'row',
        content: [
          {
            type: 'component',
            componentType: 'main-view',
            title: '主视图',
            isClosable: false,
          },
        ],
      },
    };
  }

  public getFullscreenLayout(): LayoutConfig {
    return {
      root: {
        type: 'row',
        content: [
          {
            type: 'component',
            componentType: 'main-view',
            title: '主视图',
            isClosable: false,
            width: 100,
          },
        ],
      },
    };
  }
}

export const dockManagerService = new DockManagerService();
