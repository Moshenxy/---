<template>
  <div class="contacts-view">
    <div class="contacts-header contact-search-bar">
      <input type="text" placeholder="🔍 搜索" v-model="searchTerm" />
      <button class="add-friend-btn" @click="showAddFriendModal">+</button>
    </div>
    <div class="contact-function-list">
      <div class="function-item" @click="showNewFriends">
        <span>新的朋友</span>
        <span class="count">{{ newFriendsCount }}</span>
      </div>
      <div class="function-item" @click="showGroupChats">
        <span>群聊</span>
        <span class="count">{{ groupChatsCount }}</span>
      </div>
    </div>
    <div class="contacts-list" id="contact-groups-container">
      <details class="contact-group" v-for="group in filteredContactGroups" :key="group.name" open>
        <summary>
          {{ group.name }} <span>{{ group.contacts.length }}</span>
        </summary>
        <div
          class="contact-item"
          v-for="contact in group.contacts"
          :key="contact.id"
          @click="handleContactClick(contact)"
          :data-contact-id="contact.id"
          :data-is-group="contact.isGroup"
        >
          <div class="avatar" v-html="getAvatar(contact)"></div>
          <div class="contact-details">
            <span class="contact-name">{{ contact.name }}</span>
            <p v-if="contact.signature" class="contact-signature">{{ contact.signature }}</p>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, defineEmits, onMounted } from 'vue';
import { actions, store } from '../../../../store';
import { getGroupedContacts } from '../../../../services/tianhuachat';
import { avatarService } from '../../../../services/AvatarService';

interface Contact {
  id: string;
  name: string;
  avatarName: string;
  signature?: string;
  isGroup?: boolean;
}

interface ContactGroup {
  name: string;
  contacts: Contact[];
}

const contactGroups = ref<ContactGroup[]>([]);
const searchTerm = ref('');
const avatarUrls = ref<Record<string, string>>({});

async function loadAvatar(contact: Contact) {
  if (!contact.id || avatarUrls.value[contact.id]) return;
  const url = await avatarService.getAvatarUrl(contact.id);
  if (url) {
    avatarUrls.value[contact.id] = url;
  } else {
    avatarUrls.value[contact.id] = 'fallback'; // Mark as checked
  }
}

function getAvatar(contact: Contact): string {
  const url = avatarUrls.value[contact.id];
  if (url && url !== 'fallback') {
    return `<img src="${url}" alt="${contact.name}" style="width: 100%; height: 100%; object-fit: cover;">`;
  }
  // Fallback to initial-based avatar
  const initial = contact.name.substring(0, 1).toUpperCase();
  const COLORS = ['#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e', '#f1c40f', '#e67e22', '#e74c3c'];
  const colorIndex = Math.abs(contact.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % COLORS.length;
  const backgroundColor = COLORS[colorIndex];
  return `<div style="background-color: ${backgroundColor}; display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; color: white; font-weight: bold;">${initial}</div>`;
}

onMounted(async () => {
  contactGroups.value = await getGroupedContacts();
  contactGroups.value.forEach(group => {
    group.contacts.forEach(contact => {
      loadAvatar(contact);
    });
  });
});

const filteredContactGroups = computed(() => {
  if (!searchTerm.value) {
    return contactGroups.value;
  }
  const lowerCaseSearch = searchTerm.value.toLowerCase();
  return contactGroups.value
    .map(group => {
      const filteredContacts = group.contacts.filter(contact => contact.name.toLowerCase().includes(lowerCaseSearch));
      return { ...group, contacts: filteredContacts };
    })
    .filter(group => group.contacts.length > 0);
});

const newFriendsCount = computed(() => {
  const newFriendsGroup = contactGroups.value.find(g => g.name === '新的朋友');
  return newFriendsGroup ? newFriendsGroup.contacts.length : 0;
});

const emit = defineEmits(['view-chat', 'view-new-friends', 'view-group-list', 'view-contact-detail']);

function handleContactClick(contact: any) {
  if (contact.isGroup) {
    emit('view-chat', contact.id);
  } else {
    emit('view-contact-detail', contact.id);
  }
}

const groupChatsCount = computed(() => {
  const groupChats = contactGroups.value.find(g => g.name === '群聊');
  return groupChats ? groupChats.contacts.length : 0;
});

function showNewFriends() {
  emit('view-new-friends');
}

function showGroupChats() {
  emit('view-group-list');
}

function showAddFriendModal() {
  store.isAddFriendModalVisible = true;
}
</script>

<style lang="scss" scoped>
$mobile-bg: #f9fafb;
$mobile-border: #e5e7eb;
$mobile-card-bg: #ffffff;
$text-secondary: #6c757d;
$mobile-fg: #374151;

.contacts-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: $mobile-bg;
}

.contact-search-bar {
  padding: 8px 15px;
  display: flex;
  gap: 10px;
  border-bottom: 1px solid $mobile-border;
  background-color: $mobile-card-bg;

  input {
    flex-grow: 1;
    border: none;
    background-color: $mobile-bg;
    border-radius: 18px;
    padding: 8px 15px;
    font-size: 15px;
    &:focus {
      outline: none;
    }
  }

  .add-friend-btn {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background-color: $mobile-bg;
    color: $text-secondary;
    font-size: 24px;
    cursor: pointer;
  }
}

.contact-function-list {
  background-color: $mobile-card-bg;
  margin-bottom: 8px;
  .function-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    font-size: 16px;
    border-bottom: 1px solid $mobile-border;
    cursor: pointer;
    &:hover {
      background-color: $mobile-bg;
    }
    .count {
      color: $text-secondary;
      font-size: 14px;
    }
  }
}

#contact-groups-container {
  flex-grow: 1;
  overflow-y: auto;
  background-color: $mobile-card-bg;
}

.contact-group {
  margin: 0;
  padding: 0;
  border-bottom: 1px solid $mobile-border;

  summary {
    padding: 10px 15px;
    font-weight: 500;
    color: $text-secondary;
    background-color: $mobile-bg;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
  }
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  background-color: $mobile-card-bg;
  gap: 12px;

  &:hover {
    background-color: darken($mobile-bg, 2%);
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 12px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 18px;
    font-weight: bold;
    color: white;
    flex-shrink: 0;
  }

  .contact-details {
    flex-grow: 1;
    overflow: hidden;
  }

  .contact-name {
    font-weight: 500;
    font-size: 16px;
    color: $mobile-fg;
  }

  .contact-signature {
    font-size: 13px;
    color: $text-secondary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
  }
}
</style>
