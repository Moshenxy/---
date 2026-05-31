<template>
  <div class="message-view">
    <div class="chat-list">
      <div class="chat-item" v-for="chat in chatList" :key="chat.id" @click="$emit('view-chat', chat.id)">
        <div class="avatar" :class="{ 'group-avatar': chat.isGroup }" v-html="getAvatar(chat.name, chat.characterId || chat.id)"></div>
        <div class="chat-info">
          <div class="chat-name">{{ chat.name }} <span v-if="chat.isGroup" class="group-tag">群</span></div>
          <div class="last-message">{{ chat.lastMessage }}</div>
        </div>
        <div class="chat-meta">
          <div class="last-time">{{ chat.lastTime }}</div>
          <div class="unread-badge" v-if="chat.unreadCount > 0">{{ chat.unreadCount }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getters } from '../../../../store';
import { getAvatar } from '../../../../utils/avatar';

defineEmits(['view-chat']);

const chatList = computed(() => getters.enrichedChatList.value);
</script>

<style lang="scss" scoped>
.message-view {
  height: 100%;
  overflow-y: auto;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f9fafb;
  }
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.chat-info {
  flex-grow: 1;
  overflow: hidden;
}

.group-avatar {
    background-color: #f97316; // A different color for groups
}

.group-tag {
    font-size: 10px;
    padding: 2px 4px;
    border-radius: 4px;
    background-color: #e5e7eb;
    color: #4b5563;
    margin-left: 5px;
}

.chat-name {
  font-weight: 500;
  color: #1f2937;
}

.last-message {
  font-size: 14px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-meta {
  text-align: right;
  font-size: 12px;
  color: #9ca3af;
}

.unread-badge {
  background-color: #ef4444;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 10px;
  margin-top: 4px;
  display: inline-block;
}
</style>