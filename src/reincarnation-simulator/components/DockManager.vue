<template>
  <div ref="dockHost" class="dock-manager-host"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { dockManagerService } from '../services/DockManagerService';

const dockHost = ref<HTMLDivElement | null>(null);

onMounted(() => {
  if (dockHost.value) {
    dockManagerService.initialize(dockHost.value);
  }
});

onBeforeUnmount(() => {
  dockManagerService.destroy();
});
</script>

<style lang="scss" scoped>
.dock-manager-host {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
