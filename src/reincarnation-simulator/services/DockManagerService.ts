// @ts-ignore
import { DockManager, PanelContainer } from 'https://esm.sh/dock-spawn-ts';
import { h, render } from 'vue';

/**
 * A service to manage the dock layout and panels.
 * It encapsulates the logic for creating, showing, and managing dockable panels.
 */
class DockManagerService {
  private dockManager: DockManager | null = null;
  private hostElement: HTMLElement | null = null;
  private panelMap: Map<string, any> = new Map(); // Store dialogs to handle floating panels
  private pinnedPanelState: Map<string, { x: number; y: number; width: number; height: number }> = new Map();
  public onAction: ((action: string) => void) | null = null;
  private readonly DOCK_LAYOUT_STORAGE_KEY = 'reincarnation-simulator-dock-layout';
  private readonly PINNED_STATE_STORAGE_KEY = 'reincarnation-simulator-pinned-panels';

  /**
   * Initializes the DockManager with a host element.
   * @param hostElement The HTML element that will contain the dock layout.
   */
  initialize(hostElement: HTMLElement) {
    if (this.dockManager || !hostElement) return;

    this.loadPinnedState(); // Load pinned state first

    this.hostElement = hostElement;
    this.dockManager = new DockManager(this.hostElement);
    this.dockManager.initialize();

    // Load layout from localStorage if it exists
    const savedLayout = localStorage.getItem(this.DOCK_LAYOUT_STORAGE_KEY);
    if (savedLayout) {
      try {
        this.dockManager.loadState(savedLayout);
      } catch (error) {
        console.error('Failed to load saved dock layout:', error);
        localStorage.removeItem(this.DOCK_LAYOUT_STORAGE_KEY);
      }
    }

    // Save layout whenever it changes
    this.dockManager.addLayoutListener('layoutChanged', this.saveLayout.bind(this));

    window.addEventListener('resize', () =>
      this.dockManager?.resize(this.hostElement!.clientWidth, this.hostElement!.clientHeight),
    );

    this.dockManager.resize(this.hostElement.clientWidth, this.hostElement.clientHeight);
  }

  /**
   * Opens or focuses a panel with the given Vue component.
   */
  openPanel(panelId: string, title: string, component: any, props: Record<string, any> = {}) {
    if (!this.dockManager || !this.hostElement) {
      console.error('DockManager not initialized.');
      return;
    }

    if (this.panelMap.has(panelId)) {
      const existingDialog = this.panelMap.get(panelId)!;
      if (document.body.contains(existingDialog.element)) {
        existingDialog.bringToFront();
        return;
      } else {
        this.panelMap.delete(panelId);
      }
    }

    const panelHostDiv = document.createElement('div');
    panelHostDiv.style.width = '100%';
    panelHostDiv.style.height = '100%';
    panelHostDiv.style.overflow = 'auto';

    const vnode = h(component, props);
    render(vnode, panelHostDiv);

    const newPanel = new PanelContainer(panelHostDiv, this.dockManager);
    newPanel.setTitle(title);

    const dragListener = (e: MouseEvent) => {
      if (this.pinnedPanelState.has(panelId)) {
        const target = e.target as HTMLElement;
        if (!target.closest('div[class*="panel-titlebar-button"]')) {
          e.stopPropagation();
        }
      }
    };

    newPanel.onClose = () => {
      this.panelMap.delete(panelId);
      render(null, panelHostDiv);
      if (newPanel.elementTitle) {
        newPanel.elementTitle.removeEventListener('mousedown', dragListener, true);
      }
    };

    const pinnedState = this.pinnedPanelState.get(panelId);
    const dialogWidth = pinnedState ? pinnedState.width : 600;
    const dialogHeight = pinnedState ? pinnedState.height : 500;
    const hostWidth = this.hostElement.clientWidth;
    const hostHeight = this.hostElement.clientHeight;
    const x = pinnedState ? pinnedState.x : Math.max(0, (hostWidth - dialogWidth) / 2);
    const y = pinnedState ? pinnedState.y : Math.max(0, (hostHeight - dialogHeight) / 2);

    const dialog = this.dockManager.floatDialog(newPanel, x, y);
    dialog.resize(dialogWidth, dialogHeight);

    if (pinnedState) {
      newPanel.resize(pinnedState.width, pinnedState.height);
    }

    setTimeout(() => {
      this.addPinButton(panelId, newPanel, dialog, dragListener);
    }, 0);

    this.panelMap.set(panelId, dialog);
  }

  /**
   * Forces the dock manager to recalculate its layout.
   * This is useful when the container size changes without a window resize event.
   */
  updateLayout() {
    if (this.dockManager && this.hostElement) {
      this.dockManager.resize(this.hostElement.clientWidth, this.hostElement.clientHeight);
    }
  }

  /**
   * Adds a pin button to the panel's title bar.
   */
  private addPinButton(panelId: string, panel: PanelContainer, dialog: any, dragListener: (e: MouseEvent) => void) {
    if (!panel.elementTitle || panel.elementTitle.querySelector('.panel-titlebar-button-pin')) {
      return;
    }

    const pinButtonHTML = `<div class="panel-titlebar-button-pin" title="固定/解锁窗口">📌</div>`;
    panel.elementTitle.insertAdjacentHTML('afterbegin', pinButtonHTML);

    const pinButton = panel.elementTitle.querySelector<HTMLElement>('.panel-titlebar-button-pin');
    if (!pinButton) return;

    panel.elementTitle.addEventListener('mousedown', dragListener, true);

    const isLocked = this.pinnedPanelState.has(panelId);
    this.applyPinState(pinButton, dialog, isLocked);

    pinButton.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      const currentlyLocked = this.pinnedPanelState.has(panelId);
      if (currentlyLocked) {
        this.pinnedPanelState.delete(panelId);
      } else if (this.hostElement) {
        const hostRect = this.hostElement.getBoundingClientRect();
        const panelRect = panel.elementPanel.getBoundingClientRect();
        const state = {
          x: panelRect.left - hostRect.left,
          y: panelRect.top - hostRect.top,
          width: panel.width,
          height: panel.height,
        };
        this.pinnedPanelState.set(panelId, state);
      }
      this.savePinnedState(); // Save the state whenever it's changed
      this.applyPinState(pinButton, dialog, !currentlyLocked);
    });
  }

  private applyPinState(pinButton: HTMLElement, dialog: any, isLocked: boolean) {
    pinButton.classList.toggle('locked', isLocked);
    if (dialog) {
      dialog.noDocking = isLocked;
      if (dialog.resizable) {
        dialog.resizable.enabled = !isLocked;
      }
    }
  }

  private saveLayout() {
    if (this.dockManager) {
      const layoutState = this.dockManager.saveState();
      localStorage.setItem(this.DOCK_LAYOUT_STORAGE_KEY, layoutState);
    }
  }

  private savePinnedState() {
    const stateToSave = Array.from(this.pinnedPanelState.entries());
    localStorage.setItem(this.PINNED_STATE_STORAGE_KEY, JSON.stringify(stateToSave));
  }

  private loadPinnedState() {
    const savedState = localStorage.getItem(this.PINNED_STATE_STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        this.pinnedPanelState = new Map(parsedState);
      } catch (error) {
        console.error('Failed to load pinned panel state:', error);
        this.pinnedPanelState = new Map();
      }
    }
  }

  /**
   * Closes all currently open panels.
   */
  closeAllPanels() {
    if (!this.dockManager) return;
    // Create a copy of the keys to avoid issues with modifying the map while iterating
    const panelIds = Array.from(this.panelMap.keys());
    panelIds.forEach(panelId => {
      const dialog = this.panelMap.get(panelId);
      if (dialog && dialog.panel) {
        const panel = dialog.panel as PanelContainer;
        // 1. Unmount the Vue component
        if (panel.elementContent) {
          render(null, panel.elementContent);
        }
        // 2. Close the panel container itself to remove it from the layout
        panel.close();
      }
    });
    // After closing all, clear the map
    this.panelMap.clear();
  }

  /**
   * Unpins all currently pinned panels.
   */
  unpinAllPanels() {
    this.pinnedPanelState.clear();
    this.savePinnedState(); // Clear from localStorage as well

    if (!this.dockManager) return;

    // Iterate over all active panels and visually unlock them
    this.panelMap.forEach((dialog, panelId) => {
      const panel = dialog.panel;
      if (panel && panel.elementTitle) {
        const pinButton = panel.elementTitle.querySelector('.panel-titlebar-button-pin') as HTMLElement;
        if (pinButton) {
          this.applyPinState(pinButton, dialog, false);
        }
      }
    });
  }

  /**
   * Destroys the DockManager instance.
   */
  destroy() {
    if (this.dockManager) {
      this.dockManager.on('layoutChanged', () => {}); // Remove listener
      this.dockManager.dispose();
      this.dockManager = null;
    }
    this.panelMap.clear();
    window.removeEventListener('resize', () => {});
  }
}

export const dockManagerService = new DockManagerService();
