<template>
  <div class="contact-detail-view">
    <div class="header">
      <button @click="$emit('back')" class="back-btn"><</button>
      <h1>详细资料</h1>
    </div>
    <div v-if="contact" class="contact-content">
      <div class="profile-header">
        <div class="avatar" v-html="getAvatar(contact.name, contact.id)"></div>
        <div class="name-section">
          <h2 class="name">{{ contact.name }}</h2>
          <p class="signature">"{{ contact.signature }}"</p>
        </div>
      </div>
      <div class="info-list">
        <div class="info-item">
          <span class="label">班级</span>
          <span class="value">{{ contact.class }}</span>
        </div>
         <div class="info-item">
          <span class="label">ID</span>
          <span class="value">{{ contact.id }}</span>
        </div>
      </div>
      <div class="actions">
        <button @click="$emit('view-chat', contact.chatId)" class="chat-btn">发消息</button>
      </div>
    </div>
     <div v-else class="loading">
        加载中...
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { get } from 'lodash';
import { store } from '../../../../store';
import { getAvatar } from '../../../../utils/avatar';
import { safeGetValue } from '../../../../utils/character-utils';

const props = defineProps({
  contactId: {
    type: String,
    required: true,
  },
});

defineEmits(['back', 'view-chat']);

const contact = computed(() => {
  if (!props.contactId || !store.worldState) return null;
  
  const character = get(store.worldState, `角色.${props.contactId}`);
  if (!character) return null;
  
  const userId = store.userId;
  const partnerId = props.contactId;
  const participants = [userId, partnerId].sort();
  const chatId = `chat_${participants[0]}_${participants[1]}`;

  return {
    id: props.contactId,
    name: `${safeGetValue(character, '姓', '', true)}${safeGetValue(character, '名', '', true)}` || props.contactId,
    signature: safeGetValue(character, '签名', '...', true),
    class: safeGetValue(character, '班级', '未知', true),
    chatId: chatId,
  };
});

</script>

<style lang="scss" scoped>
.contact-detail-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f9fafb;
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

.contact-content {
    flex-grow: 1;
    padding: 20px;
}

.profile-header {
    display: flex;
    align-items: center;
    gap: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e5e7eb;
}

.avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    overflow: hidden;
}

.name-section {
    .name {
        font-size: 22px;
        font-weight: 600;
        margin: 0 0 5px 0;
    }
    .signature {
        font-size: 14px;
        color: #6b7280;
        margin: 0;
    }
}

.info-list {
    margin-top: 20px;
    background: white;
    border-radius: 8px;
    padding: 0 15px;
    border: 1px solid #e5e7eb;
}

.info-item {
    display: flex;
    justify-content: space-between;
    padding: 15px 0;
    font-size: 16px;

    &:not(:last-child) {
        border-bottom: 1px solid #f3f4f6;
    }

    .label {
        color: #6b7280;
    }
    .value {
        color: #1f2937;
    }
}

.actions {
    margin-top: 30px;
    .chat-btn {
        width: 100%;
        padding: 12px;
        font-size: 16px;
        font-weight: 500;
        border-radius: 8px;
        border: none;
        background-color: #3b82f6;
        color: white;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
            background-color: #2563eb;
        }
    }
}

.loading {
    text-align: center;
    padding: 40px;
    color: #6b7280;
}
</style>