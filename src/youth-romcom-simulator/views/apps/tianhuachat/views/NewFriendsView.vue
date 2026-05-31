<template>
  <div class="new-friends-view">
    <div class="header">
      <button @click="$emit('back')" class="back-btn"><</button>
      <h1>新的朋友</h1>
    </div>
    <div class="friend-request-list">
      <div v-for="request in friendRequests" :key="request.id" class="request-item">
        <div class="avatar" v-html="getAvatar(request.name, request.id)"></div>
        <div class="request-info">
          <div class="name">{{ request.name }}</div>
          <div class="message">请求添加你为好友</div>
        </div>
        <div class="actions">
          <button @click="handleRequest(request.id, 'accept')" class="accept-btn">接受</button>
          <button @click="handleRequest(request.id, 'reject')" class="reject-btn">拒绝</button>
        </div>
      </div>
      <div v-if="friendRequests.length === 0" class="no-requests">
        没有新的朋友请求
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { actions } from '../../../../store';
import { getAvatar } from '../../../../utils/avatar';
import { getGroupedContacts } from '../../../../services/tianhuachat';

defineEmits(['back']);

const friendRequests = ref<any[]>([]);

onMounted(async () => {
    const groups = await getGroupedContacts();
    const newFriendsGroup = groups.find(g => g.name === '新的朋友');
    friendRequests.value = newFriendsGroup ? newFriendsGroup.contacts : [];
});

function handleRequest(characterId: string, type: 'accept' | 'reject') {
  const characterName = friendRequests.value.find(r => r.id === characterId)?.name || '该用户';
  const actionText = type === 'accept' ? `接受了 ${characterName} 的好友请求` : `拒绝了 ${characterName} 的好友请求`;
  
  actions.addActionToQueue({
    action: 'handleFriendRequest',
    characterId,
    requestType: type,
  });
  actions.handleAction(actionText);

  alert(`${type === 'accept' ? '已接受' : '已拒绝'} ${characterName} 的好友请求。`);
}
</script>

<style lang="scss" scoped>
.new-friends-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f0f2f5;
}

.header {
  display: flex;
  align-items: center;
  background-color: #3b82f6;
  color: white;
  padding: 10px 15px;
  flex-shrink: 0;

  .back-btn {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    margin-right: 15px;
    cursor: pointer;
  }

  h1 {
    font-size: 18px;
    margin: 0;
  }
}

.friend-request-list {
  flex-grow: 1;
  overflow-y: auto;
}

.request-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
}

.request-info {
  flex-grow: 1;
  .name {
    font-weight: 500;
  }
  .message {
    font-size: 14px;
    color: #6b7280;
  }
}

.actions {
  display: flex;
  gap: 10px;

  button {
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }

  .accept-btn {
    background-color: #10b981;
    color: white;
  }

  .reject-btn {
    background-color: #e5e7eb;
    color: #4b5563;
  }
}

.no-requests {
  text-align: center;
  color: #9ca3af;
  padding: 40px;
}
</style>