<template>
  <div class="group-list-view">
    <div class="header">
      <button @click="$emit('back')" class="back-btn"><</button>
      <h1>群聊</h1>
    </div>
    <div class="group-list">
      <div v-for="group in groupList" :key="group.id" class="group-item" @click="$emit('view-chat', group.id)">
        <div class="avatar group-avatar">{{ group.avatarName }}</div>
        <div class="group-name">{{ group.name }}</div>
      </div>
      <div v-if="groupList.length === 0" class="no-groups">
        你还没有加入任何群聊
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getters } from '../../../../store';

defineEmits(['back', 'view-chat']);

const groupList = computed(() => {
  const groupChats = getters.contactGroups.value.find(g => g.name === '群聊');
  return groupChats ? groupChats.contacts : [];
});
</script>

<style lang="scss" scoped>
.group-list-view {
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

.group-list {
  flex-grow: 1;
  overflow-y: auto;
}

.group-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  
  &:hover {
    background-color: #f9fafb;
  }
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px; /* Square for groups */
  background-color: #f97316;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  margin-right: 12px;
}

.group-name {
  font-weight: 500;
}

.no-groups {
  text-align: center;
  color: #9ca3af;
  padding: 40px;
}
</style>