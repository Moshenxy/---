<template>
  <div class="npc-directory-panel">
    <!-- NPC List -->
    <div class="npc-list-column">
      <h4>NPC列表</h4>
      <input type="text" v-model="npcSearchTerm" placeholder="搜索NPC..." class="search-input" />
      <ul v-if="filteredNpcs.length > 0" class="npc-list">
        <li
          v-for="npc in filteredNpcs"
          :key="npc.名称"
          :class="{ active: selectedNpc === npc }"
          @click="selectNpc(npc)"
        >
          <div class="npc-info">
            <span class="npc-name">{{ npc.名称 }}</span>
            <span class="npc-location">{{ npc.位置 }}</span>
          </div>
        </li>
      </ul>
      <div v-else class="placeholder">暂无NPC</div>
    </div>

    <!-- NPC Details -->
    <div class="npc-detail-column">
      <h4>NPC详情</h4>
      <div v-if="selectedNpc">
        <NpcDetailDisplay :npc="selectedNpc" :npc-id="selectedNpcId" />
      </div>
      <div v-else class="placeholder">选择一个NPC以查看详情</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { npcService } from '../../services/NpcService';
import type { 角色 } from '../../types';
import NpcDetailDisplay from '../common/NpcDetailDisplay.vue';

const selectedNpc = ref<角色 | null>(null);
const selectedNpcId = ref<string | null>(null);
const npcSearchTerm = ref('');

const filteredNpcs = computed(() => {
  let npcs = [...npcService.allNpcs.value];

  if (!npcSearchTerm.value) {
    return npcs;
  }

  return npcs.filter(n => n.名称 && n.名称.includes(npcSearchTerm.value));
});

function selectNpc(npc: 角色) {
  selectedNpc.value = npc;
  selectedNpcId.value = npcService.getNpcId(npc);
}

watch(filteredNpcs, () => {
  if (selectedNpc.value && !filteredNpcs.value.includes(selectedNpc.value)) {
    selectedNpc.value = null;
    selectedNpcId.value = null;
  }
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

.npc-directory-panel {
  display: grid;
  grid-template-columns: 1fr 2.5fr;
  height: 100%;
  position: relative;
  background: $color-black-void;
  color: $color-white-moon;
}
.search-input {
  width: 100%;
  padding: $spacing-sm;
  margin-bottom: $spacing-md;
  background-color: rgba($color-black-void, 0.5);
  border: 1px solid $color-grey-stone;
  color: $color-white-moon;
  border-radius: $border-radius-sm;
}
.npc-list {
  list-style: none;
  padding: 0;
  margin: 0;
  li {
    padding: $spacing-sm $spacing-md;
    cursor: pointer;
    border-radius: $border-radius-sm;
    transition: background-color 0.2s ease;
    display: flex;
    justify-content: space-between;
    align-items: center;
    &:hover {
      background-color: rgba($color-cyan-tian, 0.1);
    }
    &.active {
      background-color: $color-cyan-tian;
      color: $color-black-void;
      font-weight: bold;
    }
  }
}
[class*='-column'] {
  padding: $spacing-md;
  overflow-y: auto;
  border-right: 1px solid rgba($color-gold-liu, 0.15);
  &:last-child {
    border-right: none;
  }
  h4 {
    font-family: $font-family-title;
    color: $color-gold-pale;
    text-align: center;
    margin-top: 0;
    margin-bottom: $spacing-lg;
    padding-bottom: $spacing-md;
    border-bottom: 1px solid rgba($color-gold-liu, 0.3);
  }
}
.npc-info {
  display: flex;
  flex-direction: column;
}
.npc-location {
  font-size: $font-size-small;
  color: $color-grey-stone;
  margin-top: 4px;
}
.placeholder {
  text-align: center;
  margin-top: 50px;
  color: $color-grey-stone;
}
</style>
