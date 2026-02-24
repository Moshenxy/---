declare module 'golden-layout' {
  export class GoldenLayout {
    constructor(hostElement: HTMLElement);
    registerComponent(componentName: string, component: any): void;
    loadLayout(config: LayoutConfig): void;
    saveLayout(): LayoutConfig;
    destroy(): void;
    updateSize(width: number, height: number): void;
    on(eventName: string, callback: (...args: any[]) => void): void;
    rootItem: any;
    addComponent(componentType: string, props: any, title: string): void;
  }

  export interface LayoutConfig {
    [key: string]: any;
  }

  export interface ComponentContainer {
    getElement(): HTMLElement;
    setTitle(title: string): void;
  }
}
