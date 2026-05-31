<template>
  <div class="tianhuachat-app">
    <div v-if="viewState === 'main'" class="main-view">
      <div class="app-header">
        <h1>{{ currentViewName }}</h1>
      </div>
      <div class="app-content">
        <component
          :is="activeView"
          @view-chat="openChat"
          @view-new-friends="viewState = 'newFriends'"
          @view-group-list="viewState = 'groupList'"
          @view-contact-detail="openContactDetail"
        />
      </div>
      <div class="app-nav">
        <button @click="activeTab = 'messages'" :class="{ active: activeTab === 'messages' }">消息</button>
        <button @click="activeTab = 'contacts'" :class="{ active: activeTab === 'contacts' }">联系人</button>
        <button @click="activeTab = 'moments'" :class="{ active: activeTab === 'moments' }">空间</button>
      </div>
    </div>
    <ChatView
      v-else-if="viewState === 'chat' && currentConversationId"
      :conversation-id="currentConversationId"
      @back="closeChat"
    />
    <NewFriendsView v-else-if="viewState === 'newFriends'" @back="viewState = 'main'" />
    <GroupListView v-else-if="viewState === 'groupList'" @back="viewState = 'main'" @view-chat="openChat" />
    <ContactDetailView
      v-else-if="viewState === 'contactDetail' && currentContactId"
      :contact-id="currentContactId"
      @back="viewState = 'main'"
      @view-chat="openChat"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import MessageView from './tianhuachat/views/MessageView.vue';
import ContactsView from './tianhuachat/views/ContactsView.vue';
import MomentsView from './tianhuachat/views/MomentsView.vue';
import ChatView from './tianhuachat/views/ChatView.vue';
import NewFriendsView from './tianhuachat/views/NewFriendsView.vue';
import GroupListView from './tianhuachat/views/GroupListView.vue';
import ContactDetailView from './tianhuachat/views/ContactDetailView.vue';

type Tab = 'messages' | 'contacts' | 'moments';
type ViewState = 'main' | 'chat' | 'newFriends' | 'groupList' | 'contactDetail';

const activeTab = ref<Tab>('messages');
const currentConversationId = ref<string | null>(null);
const currentContactId = ref<string | null>(null);
const viewState = ref<ViewState>('main');

const viewMap = {
  messages: { component: MessageView, name: '天华信' },
  contacts: { component: ContactsView, name: '联系人' },
  moments: { component: MomentsView, name: 'MX空间' },
};

const activeView = computed(() => viewMap[activeTab.value].component);
const currentViewName = computed(() => viewMap[activeTab.value].name);

function openChat(conversationId: string) {
  currentConversationId.value = conversationId;
  viewState.value = 'chat';
}

function closeChat() {
  currentConversationId.value = null;
  viewState.value = 'main';
}

function openContactDetail(contactId: string) {
  currentContactId.value = contactId;
  viewState.value = 'contactDetail';
}
</script>

<style lang="scss" scoped>
.tianhuachat-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f0f2f5;
  color: #333;
}

.main-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-header {
  background-color: #3b82f6;
  color: white;
  padding: 15px;
  text-align: center;
  flex-shrink: 0;
  font-size: 16px;
}

.app-content {
  flex-grow: 1;
  overflow-y: auto;
  position: relative; /* For potential positioning inside views */
}

.app-nav {
  display: flex;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;

  button {
    flex-grow: 1;
    padding: 12px 0;
    background: white;
    border: none;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.2s ease;

    &.active {
      color: #3b82f6;
      font-weight: 600;
      background-color: #f9fafb;
    }

    &:hover:not(.active) {
      background-color: #f9fafb;
    }
  }
}
</style>
