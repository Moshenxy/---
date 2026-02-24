<template>
  <div v-if="show" class="modal-backdrop" @click.self="close">
    <div class="modal-content">
      <h4>{{ locationName }} 内的角色</h4>
      <ul class="character-list">
        <li v-for="char in characters" :key="char.id" @click="openChat(char.id)">
          <div class="avatar" :class="{ 'is-user': char.id === store.userId }">
            {{ getCharacterAvatarText(char.id) }}
          </div>
          <span class="name">{{ getCharacterFullName(char.id) }}</span>
        </li>
      </ul>
      <button @click="close" class="close-btn">关闭</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import { store, getters } from '../../store';
import { getCharacterById, safeGetValue } from '../../utils/character-utils';
import { appNavigator } from '../../utils/app-navigation';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  characters: {
    type: Array as PropType<{ id: string; name: string }[]>,
    required: true,
  },
  locationName: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['close']);

const close = () => {
  emit('close');
};

const getCharacterAvatarText = (charId: string) => {
  if (charId === store.userId) return '我';
  const char = getCharacterById(store.worldState, charId);
  return char ? `${safeGetValue(char, '姓', '?', true)}` : '?';
};

const getCharacterFullName = (charId: string) => {
  const char = getCharacterById(store.worldState, charId);
  return char ? `${safeGetValue(char, '姓', '', true)}${safeGetValue(char, '名', charId, true)}` : charId;
};

const openChat = (characterId: string) => {
  if (characterId === store.userId) return;
  const chat = getters.enrichedChatList.value.find(c => c.characterId === characterId);
  if (chat) {
    appNavigator.openApp('tianhuachat', { chatId: chat.id });
  } else {
    alert(`还不是好友，无法聊天。`);
  }
  close();
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
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  min-width: 250px;
  max-width: 90%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  h4 {
    margin-top: 0;
    text-align: center;
  }
}

.character-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 60vh;
  overflow-y: auto;

  li {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f5f5f5;
    }
  }
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #e0e0e0;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  margin-right: 12px;

  &.is-user {
    background-color: #007bff;
    color: white;
  }
}

.name {
  font-size: 1rem;
}

.close-btn {
  display: block;
  width: 100%;
  margin-top: 15px;
  padding: 10px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #5a6268;
  }
}
</style>
