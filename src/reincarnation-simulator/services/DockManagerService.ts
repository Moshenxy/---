import { GoldenLayout, LayoutConfig } from 'golden-layout';
import { Component, defineComponent, h, render } from 'vue';

class DockManagerService {
  private goldenLayout: GoldenLayout | null = null;
  private hostElement: HTMLElement | null = null;
  private componentMap: Map<string, Component> = new Map();
  public onAction: ((action: string) => void) | null = null;
  private readonly LAYOUT_STORAGE_KEY = 'reincarnation-simulator-golden-layout-config-v2';

  initialize(hostElement: HTMLElement) {
    if (this.goldenLayout || !hostElement) return;

    this.hostElement = hostElement;
    this.goldenLayout = new GoldenLayout(this.hostElement);

    this.goldenLayout.on('stateChanged', () => {
      if (this.goldenLayout) {
        const config = this.goldenLayout.saveLayout();
        localStorage.setItem(this.LAYOUT_STORAGE_KEY, JSON.stringify(config));
      }
    });

    window.addEventListener('resize', () => this.updateLayout());

    // Periodically save the layout
    setInterval(() => {
      if (this.goldenLayout) {
        const config = this.goldenLayout.saveLayout();
        localStorage.setItem(this.LAYOUT_STORAGE_KEY, JSON.stringify(config));
      }
    }, 2000);
  }

  loadSavedLayout() {
    if (!this.goldenLayout) return;

    const savedLayout = localStorage.getItem(this.LAYOUT_STORAGE_KEY);
    if (savedLayout) {
      try {
        const config = JSON.parse(savedLayout);
        if (config && typeof config === 'object' && ('root' in config || 'content' in config)) {
          this.goldenLayout.loadLayout(config);
        } else {
          throw new Error('Invalid layout format');
        }
      } catch (e) {
        console.error('Failed to load or validate saved layout, falling back to default:', e);
        localStorage.removeItem(this.LAYOUT_STORAGE_KEY);
        try {
          this.goldenLayout.loadLayout(this.getDefaultLayout());
        } catch (e2) {
          console.error('Failed to load default layout:', e2);
        }
      }
    } else {
      this.goldenLayout.loadLayout(this.getDefaultLayout());
    }
  }

  registerComponent(componentName: string, component: Component) {
    if (this.componentMap.has(componentName)) {
      return;
    }
    this.componentMap.set(componentName, component);

    this.goldenLayout?.registerComponent(componentName, (container, componentState) => {
      const vueComponent = defineComponent({
        setup: () => () => h(component, (componentState as any)?.props || {}),
      });
      const vnode = h(vueComponent);
      render(vnode, container.getElement() as HTMLElement);
      // Directly set the title from the component state
      if ((componentState as any)?.title) {
        container.setTitle((componentState as any).title);
      }
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

    this.goldenLayout.addComponent(componentName, { title, props }, panelId);

    // Manually save layout after adding a component
    if (this.goldenLayout) {
      const config = this.goldenLayout.saveLayout();
      localStorage.setItem(this.LAYOUT_STORAGE_KEY, JSON.stringify(config));
    }
  }

  updateLayout() {
    if (this.goldenLayout && this.hostElement) {
      this.goldenLayout.updateSize(this.hostElement.clientWidth, this.hostElement.clientHeight);
    }
  }

  closeAllPanels() {
    if (!this.goldenLayout?.rootItem) return;
    this.goldenLayout.rootItem.contentItems.forEach((item: any) => item.remove());
  }

  destroy() {
    if (this.goldenLayout) {
      this.goldenLayout.destroy();
      this.goldenLayout = null;
    }
    this.componentMap.clear();
    window.removeEventListener('resize', () => {});
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
}

export const dockManagerService = new DockManagerService();
