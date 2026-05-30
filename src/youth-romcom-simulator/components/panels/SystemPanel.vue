<template>
  <div class="system-panel">
    <div class="panel-tabs">
      <button :class="{ active: activeTab === 'saveLoad' }" @click="activeTab = 'saveLoad'">存档管理</button>
      <button :class="{ active: activeTab === 'memory' }" @click="activeTab = 'memory'">记忆系统</button>
      <button :class="{ active: activeTab === 'debug' }" @click="activeTab = 'debug'">调试</button>
    </div>
    <div class="panel-content">
      <SaveLoadPanel v-show="activeTab === 'saveLoad'" />
      <MemoryPanel v-show="activeTab === 'memory'" />
      <DebugPanel v-show="activeTab === 'debug'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MemoryPanel from './MemoryPanel.vue';
import SaveLoadPanel from './SaveLoadPanel.vue';
import DebugPanel from './DebugPanel.vue';

const activeTab = ref('saveLoad');
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.system-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: transparent;
}

.panel-tabs {
  display: flex;
  border-bottom: 1px solid rgba($color-gold-liu, 0.3);
  padding: 0 $spacing-lg;

  button {
    @include button-secondary;
    border-radius: 0;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px; // Overlap with the container's border

    &.active {
      color: $color-gold-pale;
      border-bottom-color: $color-gold-pale;
      background-color: rgba($color-gold-liu, 0.05);
    }
  }
}

.panel-content {
  flex-grow: 1;
  overflow: hidden;
  padding: $spacing-lg;
}
</style>
