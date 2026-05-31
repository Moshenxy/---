<template>
  <div class="npc-list-panel">
    <div class="panel-section">
      <div class="section-title">NPC 列表</div>
      <div class="npc-list">
        <div v-for="npc in npcs" :key="npc.id" class="npc-item">
          <div class="npc-name">{{ npc.name }}</div>
          <div class="npc-relationship">好感度: {{ npc.favorability }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Character } from '../types/character';

interface NpcInfo {
  id: string;
  name: string;
  favorability: number;
}

const npcs = ref<NpcInfo[]>([]);

onMounted(() => {
  // Mock data for display purposes
  // In a real scenario, you would fetch this from the game state
  npcs.value = [
    { id: 'yukinoshita_yukino', name: '雪之下雪乃', favorability: 55 },
    { id: 'yuigahama_yui', name: '由比滨结衣', favorability: 60 },
  ];
});
</script>

<style lang="scss" scoped>
.npc-list-panel {
  padding: 15px;
}

.panel-section {
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #eae6dd;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #3a3f4b;
  margin-bottom: 12px;
}

.npc-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.npc-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.npc-name {
  font-weight: 500;
}

.npc-relationship {
  color: #6c757d;
}
</style>
