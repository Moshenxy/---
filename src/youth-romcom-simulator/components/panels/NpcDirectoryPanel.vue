<template>
  <div class="npc-directory-panel-mobile">
    <transition name="slide-fade" mode="out-in">
      <!-- NPC List View -->
      <div v-if="!selectedNpc" class="npc-list-view">
        <input type="text" v-model="npcSearchTerm" placeholder="搜索联系人..." class="search-input" />
        <ul v-if="displayedNpcs.length > 0" class="npc-list">
          <li v-for="npc in displayedNpcs" :key="npc.id" @click="selectNpc(npc)">
            <div class="npc-info">
              <span class="npc-name">{{ npc.名称 }}</span>
              <span class="npc-location">{{ (npc as any).locationName }}</span>
            </div>
            <FollowButton v-if="npc.id" :npc-id="npc.id" />
          </li>
        </ul>
        <div v-else class="placeholder">没有找到联系人</div>
      </div>

      <!-- NPC Detail View -->
      <div v-else class="npc-detail-view">
        <div class="detail-header">
          <button @click="goBackToList" class="back-button"><i class="fas fa-arrow-left"></i> 返回</button>
        </div>
        <NpcDetailDisplay :npc="selectedNpc" :npc-id="selectedNpcId" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { npcService } from '../../services/NpcService';
import { useFollowSystem } from '../../services/useFollowSystem';
import { detailModalService } from '../../services/DetailModalService';
import type { 角色 as Character } from '../../types';
import FollowButton from '../common/FollowButton.vue';
import NpcDetailDisplay from '../common/NpcDetailDisplay.vue';
import LocationInfoCard from '../common/LocationInfoCard.vue';

const selectedNpc = ref<any | null>(null);
const selectedNpcId = ref<string | null>(null);
const npcSearchTerm = ref('');
const { isFollowed } = useFollowSystem();

const displayedNpcs = computed(() => {
  // Directly use allNpcs from the service, as world filtering is no longer needed.
  let npcs = npcService.allNpcs.value.map(npc => ({
    ...npc,
    // Ensure 'id' is attached for keying and other logic. The 'id' is attached in the service.
    id: (npc as any).id,
    locationName: npcService.getLocationName(npc.位置),
  }));

  // Sort by followed status first
  npcs.sort((a, b) => {
    const aFollowed = a.id ? isFollowed(a.id) : false;
    const bFollowed = b.id ? isFollowed(b.id) : false;
    if (aFollowed && !bFollowed) return -1;
    if (!aFollowed && bFollowed) return 1;
    return 0;
  });

  if (!npcSearchTerm.value) {
    return npcs;
  }

  return npcs.filter(n => n.名称 && n.名称.toLowerCase().includes(npcSearchTerm.value.toLowerCase()));
});

function selectNpc(npc: any) {
  selectedNpc.value = npc;
  selectedNpcId.value = npc.id;
}

function showLocationDetails(locationId: string) {
  if (!locationId) return;
  detailModalService.show('地点详情', LocationInfoCard, { locationId });
}

// Watch for changes in the total NPC list and pre-select the first one if none is selected.
watch(
  displayedNpcs,
  newNpcs => {
    if (newNpcs.length > 0 && !selectedNpc.value) {
      // selectNpc(newNpcs[0]);
    } else if (newNpcs.length === 0) {
      selectedNpc.value = null;
      selectedNpcId.value = null;
    }
  },
  { immediate: true },
);

const goBackToList = () => {
  selectedNpc.value = null;
  selectedNpcId.value = null;
};
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

.npc-directory-panel-mobile {
  height: 100%;
  color: $color-white-moon;
  display: flex;
  flex-direction: column;
}

.npc-list-view,
.npc-detail-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.search-input {
  width: 100%;
  padding: $spacing-md;
  margin-bottom: $spacing-md;
  background-color: rgba($color-black-void, 0.8);
  border: 1px solid $color-gold-liu;
  color: $color-white-moon;
  border-radius: $border-radius-md;
  font-size: $font-size-base;
}

.npc-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1;
  overflow-y: auto;

  li {
    padding: $spacing-md;
    cursor: pointer;
    border-bottom: 1px solid rgba($color-gold-liu, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba($color-gold-pale, 0.1);
    }
  }
}

.npc-info {
  display: flex;
  flex-direction: column;
}

.npc-name {
  font-weight: bold;
  font-size: $font-size-large;
}

.npc-location {
  font-size: $font-size-small;
  color: $color-grey-stone;
  margin-top: 4px;
}

.detail-header {
  padding: $spacing-sm 0;
  margin-bottom: $spacing-md;
}

.back-button {
  background: none;
  border: none;
  color: $color-gold-pale;
  font-size: $font-size-base;
  cursor: pointer;

  i {
    margin-right: $spacing-sm;
  }
}

/* Slide-fade transition for view switching */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(10px);
  opacity: 0;
}
</style>
