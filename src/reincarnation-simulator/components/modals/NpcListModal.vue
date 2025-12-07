<template>
  <div class="npc-list-modal-content">
    <div v-if="npcs.length > 0" class="npc-list-container">
      <ul class="npc-list">
        <li v-for="npc in npcs" :key="npc.姓名[0]" class="npc-item">
          <div class="npc-header">
            <span class="npc-name">{{ npc.姓名[0] }}</span>
            <span class="npc-identity">{{ npc.身份.join(', ') }}</span>
          </div>
          <p class="npc-description">{{ npc.外观描述 }}</p>
        </li>
      </ul>
    </div>
    <div v-else class="no-npcs">
      <p>当前世界没有可供探查的NPC信息。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { npcService } from '../../services/NpcService';
import type { Character } from '../../types';

const props = defineProps<{
  worldId: string;
}>();

const npcs = computed(() => {
  return npcService.getNpcsByWorld(props.worldId);
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.npc-list-modal-content {
  width: 100%;
  max-height: 60vh;
  overflow-y: auto;
  @include custom-scrollbar;
}

.npc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.npc-item {
  padding: $spacing-md;
  border-bottom: 1px solid rgba($color-gold-liu, 0.2);

  &:last-child {
    border-bottom: none;
  }
}

.npc-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: $spacing-sm;
}

.npc-name {
  font-family: $font-family-title;
  font-size: $font-size-large;
  color: $color-gold-pale;
}

.npc-identity {
  font-size: $font-size-small;
  color: $color-grey-stone;
  font-style: italic;
}

.npc-description {
  font-size: $font-size-base;
  color: $color-white-moon;
  line-height: $line-height-base;
  margin: 0;
}

.no-npcs {
  text-align: center;
  padding: $spacing-xl;
  color: $color-grey-stone;
}
</style>