<template>
  <div class="detail-tab-content grid-layout">
    <div class="detail-item full-width">
      <strong class="detail-key">人际关系</strong>
      <RelationsDisplay v-if="npcId" :subject-id="npcId" />
      <div v-else class="placeholder">无法加载关系信息。</div>
    </div>
    <!-- 物品和记忆部分暂时移除，待数据源明确后重构 -->
  </div>
</template>

<script setup lang="ts">
import type { 角色 } from '../../../types';
import RelationsDisplay from '../RelationsDisplay.vue';

defineProps<{
  npc: 角色;
  npcId: string | null;
}>();
</script>

<style lang="scss" scoped>
@use '../../../styles/theme/variables' as *;

.grid-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-lg;
}

.detail-item {
  &.full-width {
    grid-column: 1 / -1;
  }
  .detail-key {
    color: $color-gold-pale;
    font-family: $font-family-title;
    font-size: $font-size-large;
    display: block;
    margin-bottom: $spacing-md;
  }
}
.placeholder {
  color: $color-grey-stone;
  font-style: italic;
}
</style>
