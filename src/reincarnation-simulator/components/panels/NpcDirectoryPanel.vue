<template>
  <div class="npc-directory-panel">
    <button class="toggle-world-list" @click="isWorldListVisible = !isWorldListVisible">世界</button>

    <!-- World List (Overlay) -->
    <div v-if="isWorldListVisible" class="world-list-overlay" @click.self="isWorldListVisible = false">
      <div class="world-list-column">
        <h4>世界列表</h4>
        <input type="text" v-model="worldSearchTerm" placeholder="搜索世界..." class="search-input" />
        <ul>
          <li
            v-for="world in filteredWorlds"
            :key="world.id"
            :class="{ active: selectedWorldId === world.id }"
            @click="selectWorld(world.id)"
          >
            {{ world.name }}
          </li>
        </ul>
      </div>
    </div>

    <!-- NPC List -->
    <div class="npc-list-column">
      <h4>NPC列表</h4>
      <input type="text" v-model="npcSearchTerm" placeholder="搜索NPC..." class="search-input" />
      <ul v-if="filteredNpcs.length > 0" class="npc-list">
        <li
          v-for="npc in filteredNpcs"
          :key="npc.姓名"
          :class="{ active: selectedNpc === npc }"
          @click="selectNpc(npc)"
        >
          <div class="npc-info">
            <span class="npc-name">{{ npc.姓名 }}</span>
            <span class="npc-location">{{ (npc as any).locationName }}</span>
          </div>
          <FollowButton v-if="npc.id" :npc-id="npc.id" />
        </li>
      </ul>
      <div v-else class="placeholder">该世界暂无NPC</div>
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
import { computed, onMounted, ref, watch } from 'vue';
import { npcService } from '../../services/NpcService';
import { useFollowSystem } from '../../services/useFollowSystem';
import type { Character } from '../../types';
import FollowButton from '../common/FollowButton.vue';
import NpcDetailDisplay from '../common/NpcDetailDisplay.vue';

interface WorldInfo {
  id: string;
  name: string;
}

const worlds = ref<WorldInfo[]>([]);
const selectedWorldId = ref<string | null>(null);
const selectedNpc = ref<Character | null>(null);
const selectedNpcId = ref<string | null>(null);
const isWorldListVisible = ref(false);
const worldSearchTerm = ref('');
const npcSearchTerm = ref('');
const { isFollowed } = useFollowSystem();

const filteredWorlds = computed(() => {
  if (!worldSearchTerm.value) return worlds.value;
  return worlds.value.filter(w => w.name.includes(worldSearchTerm.value));
});

const selectedWorldNpcs = computed(() => {
  if (!selectedWorldId.value) return [];
  const npcs = npcService.getNpcsByWorld(selectedWorldId.value).filter(npc => npcService.getNpcId(npc) !== '本体');
  // 直接修改原数组，为每个NPC对象添加 locationName 属性
  return npcs.map(npc => {
    const npcId = npcService.getNpcId(npc);
    return {
      ...npc,
      id: npcId,
      locationName: npcService.getLocationName(npc.当前位置),
    };
  });
});

const filteredNpcs = computed(() => {
  let npcs = [...selectedWorldNpcs.value];

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

  return npcs.filter(n => n.姓名 && n.姓名.includes(npcSearchTerm.value));
});

const loadWorlds = async () => {
  const allWorlds = await npcService.initializeWorldAndLocationData();
  // 过滤掉名为 "..." 的世界
  worlds.value = allWorlds.filter(w => w.name !== '...');
  if (worlds.value.length > 0 && !selectedWorldId.value) {
    selectedWorldId.value = worlds.value[0].id;
  }
};

function selectWorld(worldId: string) {
  selectedWorldId.value = worldId;
  isWorldListVisible.value = false;
}

function selectNpc(npc: any) { // 使用 any 类型以接受带有 id 的 npc 对象
  selectedNpc.value = npc;
  selectedNpcId.value = npc.id;
}

onMounted(loadWorlds);

watch(selectedWorldId, () => {
  selectedNpc.value = null;
  selectedNpcId.value = null;
});

watch(() => npcService.allNpcs.value, () => {
  if (worlds.value.length === 0) {
    loadWorlds();
  }
}, { deep: true });
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
.world-list-overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 250px;
  background-color: rgba(10, 15, 30, 0.85);
  backdrop-filter: blur(8px);
  z-index: 10;
  border-right: 1px solid rgba($color-gold-liu, 0.3);
  padding: $spacing-md;
}
.world-list-column ul,
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
.toggle-world-list {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 20;
  background: rgba($color-black-void, 0.7);
  border: 1px solid $color-gold-liu;
  color: $color-gold-liu;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  font-family: $font-family-title;
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
</style>
