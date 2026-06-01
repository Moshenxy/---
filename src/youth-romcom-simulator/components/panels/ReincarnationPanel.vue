<template>
  <div class="reincarnation-panel">
    <div class="tab-content">
      <DiaryPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import DiaryPanel from './DiaryPanel.vue';

</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.reincarnation-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}


.tab-content {
  flex-grow: 1;
  overflow-y: auto;
  @include custom-scrollbar;
}
</style>
