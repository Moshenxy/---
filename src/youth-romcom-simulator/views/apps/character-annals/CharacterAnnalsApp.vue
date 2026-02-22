<template>
  <div class="character-annals-app" :class="{ 'sidebar-closed': !isSidebarOpen }">
    <div class="sidebar-container">
      <CharacterListView @character-selected="handleCharacterSelection" :active-character-id="selectedCharacterId" />
    </div>
    <div class="main-content">
      <div class="detail-view-container">
        <CharacterDetailView
          v-if="selectedCharacterId"
          :character-id="selectedCharacterId"
          @character-selected="handleCharacterSelection"
        />
        <div v-else class="placeholder">
          <p>请从左侧列表选择一个角色查看详情</p>
        </div>
      </div>
    </div>
    <div class="sidebar-toggle" @click="toggleSidebar">
      <span class="arrow" :class="{ 'arrow-left': isSidebarOpen, 'arrow-right': !isSidebarOpen }"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CharacterListView from './CharacterListView.vue';
import CharacterDetailView from './CharacterDetailView.vue';
import './styles/character-annals.scss';

const selectedCharacterId = ref<string | null>(null);
const isSidebarOpen = ref(true);

function handleCharacterSelection(characterId: string) {
  selectedCharacterId.value = characterId;
}

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}
</script>