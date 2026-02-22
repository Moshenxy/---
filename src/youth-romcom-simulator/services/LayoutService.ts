import { eventBus } from './EventBus';

const NORMAL_LAYOUT_KEY = 'youth-romcom-simulator-layout-state-v1-normal';
const FULLSCREEN_LAYOUT_KEY = 'youth-romcom-simulator-layout-state-v1-fullscreen';

export interface PanelState {
  world: string;
  panel: string;
  props?: Record<string, any>;
  panelId: string;
}

class LayoutService {
  private activePanels: Map<string, PanelState> = new Map();
  private fullscreenPanels: Map<string, PanelState> = new Map();
  private isFullscreen = false;

  constructor() {
    this.loadAllLayouts();
    eventBus.on('panelOpened', (state: PanelState) => this.addPanel(state));
    eventBus.on('panelClosed', (panelId: string) => this.removePanel(panelId));
    eventBus.on('fullscreenChanged', (isFullscreen: boolean) => this.handleFullscreenChange(isFullscreen));
  }

  private loadAllLayouts() {
    try {
      const normalState = localStorage.getItem(NORMAL_LAYOUT_KEY);
      if (normalState) this.activePanels = new Map(JSON.parse(normalState));

      const fullscreenState = localStorage.getItem(FULLSCREEN_LAYOUT_KEY);
      if (fullscreenState) this.fullscreenPanels = new Map(JSON.parse(fullscreenState));
    } catch (e) {
      console.error('Failed to load layout states:', e);
    }
  }

  private saveLayoutState() {
    if (this.isFullscreen) {
      localStorage.setItem(FULLSCREEN_LAYOUT_KEY, JSON.stringify(Array.from(this.fullscreenPanels.entries())));
    } else {
      localStorage.setItem(NORMAL_LAYOUT_KEY, JSON.stringify(Array.from(this.activePanels.entries())));
    }
  }

  public addPanel(state: PanelState) {
    const currentMap = this.isFullscreen ? this.fullscreenPanels : this.activePanels;
    if (!currentMap.has(state.panelId)) {
      currentMap.set(state.panelId, state);
      this.saveLayoutState();
    }
  }

  public removePanel(panelId: string) {
    const currentMap = this.isFullscreen ? this.fullscreenPanels : this.activePanels;
    if (currentMap.has(panelId)) {
      currentMap.delete(panelId);
      this.saveLayoutState();
    }
  }

  private handleFullscreenChange(isFullscreen: boolean) {
    this.isFullscreen = isFullscreen;
    this.restoreLayout();
  }

  public restoreLayout() {
    const panelsToRestore = this.isFullscreen ? this.fullscreenPanels : this.activePanels;
    console.log(`[LayoutService] Broadcasting restore ${this.isFullscreen ? 'fullscreen' : 'normal'} layout event...`);
    eventBus.emit('restoreLayout', Array.from(panelsToRestore.values()));
  }

  public setCurrentFullscreenState(isFullscreen: boolean) {
    this.isFullscreen = isFullscreen;
  }
}

export const layoutService = new LayoutService();
