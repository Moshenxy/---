<template>
  <div v-if="show" class="modal-backdrop" @click.self="close">
    <div class="modal-content">
      <h3>{{ locationName }} 的角色</h3>
      <div class="character-groups">
        <div v-for="(group, groupName) in groupedCharacters" :key="groupName" class="character-group">
          <h4 class="group-name">{{ groupName }}</h4>
          <ul class="character-list">
            <li v-for="char in group" :key="char.id" class="character-item">
              <img :src="char.href" :alt="char.name" class="avatar" />
              <span class="name">{{ char.name }}</span>
            </li>
          </ul>
        </div>
      </div>
      <button @click="close" class="close-button">关闭</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue';

interface CharacterInfo {
  id: string;
  name: string;
  href: string;
  locationName: string;
}

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  characters: {
    type: Array as PropType<CharacterInfo[]>,
    required: true,
  },
  locationName: {
    type: String,
    required: true,
  }
});

const groupedCharacters = computed(() => {
    return props.characters.reduce((acc, char) => {
        const groupName = char.locationName || '未知地点';
        if (!acc[groupName]) {
            acc[groupName] = [];
        }
        acc[groupName].push(char);
        return acc;
    }, {} as Record<string, CharacterInfo[]>);
});

const emit = defineEmits(['close']);

const close = () => {
  emit('close');
};
</script>

<style lang="scss" scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

h3 {
  margin-top: 0;
  text-align: center;
  color: #333;
}

.character-groups {
  overflow-y: auto;
  flex-grow: 1;
  margin: 15px 0;
}

.character-group {
  & + & {
    margin-top: 15px;
  }
}

.group-name {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid #f0f0f0;
}

.character-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.character-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 15px;
  object-fit: cover;
}

.name {
  font-size: 16px;
  color: #555;
}

.close-button {
  display: block;
  width: 100%;
  padding: 10px;
  border: none;
  background-color: #0d6efd;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;

  &:hover {
    background-color: #0b5ed7;
  }
}
</style>