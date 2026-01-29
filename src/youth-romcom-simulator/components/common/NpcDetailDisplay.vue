<template>
  <div class="npc-detail-display">
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id as Tab"
      >
        {{ tab.name }}
      </button>
    </div>
    <div class="tab-content">
      <template v-if="npc">
        <NpcArchiveTab v-if="activeTab === 'archive'" :npc="npc" />
        <NpcAttributesTab v-if="activeTab === 'attributes'" :npc="npc" />
        <NpcCauseTab v-if="activeTab === 'cause'" :npc="npc" :npc-id="npcId" />
      </template>
      <div v-else class="placeholder">
        <p>暂无数据</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { 角色 } from '../../types';
import NpcArchiveTab from './npc-details/NpcArchiveTab.vue';
import NpcAttributesTab from './npc-details/NpcAttributesTab.vue';
import NpcCauseTab from './npc-details/NpcCauseTab.vue';

defineProps<{
  npc: 角色 | null;
  npcId: string | null;
}>();

type Tab = 'archive' | 'attributes' | 'cause';

const activeTab = ref<Tab>('archive');

const tabs = [
  { id: 'archive', name: '【档案】' },
  { id: 'attributes', name: '【能力】' },
  { id: 'cause', name: '【因果】' },
];
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.npc-detail-display {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tabs {
  display: flex;
  flex-shrink: 0;
  border-bottom: 1px solid rgba($color-gold-liu, 0.3);

  button {
    background: none;
    border: none;
    color: $color-grey-stone;
    padding: $spacing-md $spacing-lg;
    cursor: pointer;
    font-family: $font-family-title;
    font-size: $font-size-large;
    transition: all 0.2s ease;
    border-bottom: 2px solid transparent;

    &.active {
      color: $color-gold-pale;
      border-bottom-color: $color-gold-liu;
    }

    &:hover {
      color: $color-white-moon;
    }
  }
}

.tab-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: $spacing-lg;
  @include custom-scrollbar;
}

.placeholder {
  @include flex-center;
  height: 100%;
  color: $color-grey-stone;
  font-size: $font-size-large;
}
</style>
