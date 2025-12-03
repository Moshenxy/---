<template>
  <div ref="dockHost" class="dock-manager-host"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { dockManagerService } from '../services/DockManagerService';
import { panelRegistry } from '../services/usePanelManager';
import MainView from '../MainView.vue';

const dockHost = ref<HTMLDivElement | null>(null);

onMounted(() => {
  if (dockHost.value) {
    dockManagerService.initialize(dockHost.value);

    // Register all components from the panel registry
    for (const world in panelRegistry) {
      for (const panel in panelRegistry[world]) {
        const panelInfo = panelRegistry[world][panel];
        const componentName = `${world}-${panel}`;
        dockManagerService.registerComponent(componentName, panelInfo.component);
      }
    }

    // Register the main view separately
    dockManagerService.registerComponent('main-view', MainView);
    
    // Load layout (now that all components are registered)
    dockManagerService.loadSavedLayout();
  }
});

onBeforeUnmount(() => {
  dockManagerService.destroy();
});
</script>

<style lang="scss">
.dock-manager-host {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;

  .lm_goldenlayout {
    background: transparent;
  }
  
  .lm_root {
    position: absolute !important;
  }

  .lm_header {
    background-color: rgba(25, 30, 45, 0.8);
    .lm_tab {
      background-color: transparent;
      color: #ccc;
      border-right: 1px solid #111;

      &.lm_active {
        background-color: rgba(45, 55, 80, 0.8);
        color: #fff;
      }
    }
  }

  .lm_content {
    background: rgba(15, 20, 35, 0.85);
    border: 1px solid rgba(180, 160, 120, 0.2);
  }

  .lm_close_tab {
    font-size: 1.2rem;
    font-weight: bold;
    color: #ff6b6b;
    &:hover {
        background: #ff6b6b;
        color: #111;
    }
  }
}
</style>
