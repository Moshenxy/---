<template>
  <div class="character-list-view">
    <div class="search-bar">
      <input type="text" v-model="searchTerm" placeholder="搜索角色..." />
    </div>
    <ul class="character-list">
      <li
        v-for="character in filteredCharacters"
        :key="character.id"
        class="character-card"
        :class="{ active: character.id === props.activeCharacterId }"
        @click="selectCharacter(character.id)"
      >
        <span class="character-name">{{ character.name }}</span>
        <span class="character-class">{{ character.class }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { getters } from '../../../store';

const props = defineProps<{
  activeCharacterId: string | null;
}>();

const emit = defineEmits(['character-selected']);

const searchTerm = ref('');

const filteredCharacters = computed(() => {
  if (!searchTerm.value) {
    return getters.allCharacters.value;
  }
  return getters.allCharacters.value.filter(char =>
    char.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

function selectCharacter(characterId: string) {
  emit('character-selected', characterId);
}
</script>
