<template>
  <div class="chat-view">
    <div class="chat-header">
      <button class="back-btn" @click="$emit('back')">‹</button>
      <span class="chat-title">{{ chatName }}</span>
    </div>
    <div class="message-list" ref="messageListEl">
      <template v-for="(msg, index) in messages" :key="index">
        <div v-if="msg.isSystem" class="chat-bubble-wrapper system">
          <div class="chat-bubble">{{ msg.text }}</div>
        </div>
        <div v-else class="chat-bubble-wrapper" :class="{ user: msg.isUser, other: !msg.isUser }">
          <div class="chat-avatar" v-html="getAvatar(msg.sender, msg.senderId)"></div>
          <div class="chat-bubble-content">
            <div class="chat-sender-name">{{ msg.sender }}</div>
            <div class="message-line">
              <div class="chat-bubble">{{ msg.text }}</div>
              <div class="chat-timestamp">{{ msg.timestamp }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>
    <div class="chat-input-area">
      <select class="chat-prefix-select" v-model="messagePrefix">
        <option value="">对话</option>
        <option value="图片">图片</option>
        <option value="红包">红包</option>
        <option value="语音">语音</option>
      </select>
      <textarea
        placeholder="输入消息..."
        v-model="newMessage"
        @keypress.enter.prevent="handleEnter"
        ref="inputEl"
        @input="adjustTextareaHeight"
      ></textarea>
      <button @click="sendMessage" class="interaction-btn primary-btn">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { get } from 'lodash';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { formatSocialData, parseSocialData } from '../../../../services/SocialDataParser';
import { handlePrivateMessage, handleGroupMessage } from '../../../../services/SocialService';
import { actions, getters, store } from '../../../../store';
import { getAvatar } from '../../../../utils/avatar';

const props = defineProps({
  conversationId: {
    type: String,
    required: true,
  },
});

defineEmits(['back']);

const chatName = computed(() => {
  const chat = getters.enrichedChatList.value.find(c => c.id === props.conversationId);
  return chat ? chat.name : '聊天';
});

const messageListEl = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLTextAreaElement | null>(null);
const messagePrefix = ref('');

const messages = computed(() => {
  if (!store.worldState) return [];

  const chatInfo = getters.enrichedChatList.value.find(c => c.id === props.conversationId);
  if (!chatInfo) return [];

  let history: string[] = [];
  if (chatInfo.isGroup) {
    const groupsText = get(store.worldState, '聊天群组-主', '');
    const groups = parseSocialData(groupsText);
    const group = groups.find(g => g.ID === props.conversationId);
    history = group ? group.历史 || [] : [];
  } else {
    const conversationsText = get(store.worldState, '聊天会话列表-主', '');
    const conversations = parseSocialData(conversationsText);
    const conversation = conversations.find(c => c.ID === props.conversationId);
    history = conversation ? conversation.历史 || [] : [];
  }

  return history.map((rawMsg: string) => {
    const content =
      typeof rawMsg === 'string' && rawMsg.startsWith('[') && rawMsg.endsWith(']') ? rawMsg.slice(1, -1) : rawMsg;

    const parts = content.split('|');
    const type = parts[0];

    const userFullName = getters.userFullName.value || '{{user}}';
    const allCharacters: { [id: string]: any } = get(store.worldState, '角色', {});

    if (type === '私聊' || type === '群聊') {
      let senderId = parts[1] || '';
      let timestamp = parts[3] || '';
      let text = parts.slice(4).join('|');
      let senderName = '未知';

      const isUser = senderId === store.userId || senderId === '{{user}}';

      if (isUser) {
        senderName = userFullName;
        senderId = store.userId; // Normalize to actual ID
      } else {
        const senderCharacter = allCharacters[senderId];
        if (senderCharacter) {
          senderName = `${get(senderCharacter, '姓[0]', '')}${get(senderCharacter, '名[0]', '')}`;
        } else {
          senderName = senderId; // Fallback to ID if character not found
        }
      }

      return {
        isSystem: false,
        isUser,
        sender: senderName,
        senderId,
        text,
        timestamp,
      };
    } else {
      // Treat as system message if not a valid chat message format
      const text = parts.length > 1 ? parts.slice(1).join('|') : content;
      return {
        isSystem: true,
        text,
        isUser: false,
        sender: 'System',
        timestamp: '',
        senderId: 'system',
      };
    }
  });
});

const newMessage = ref('');

async function sendMessage() {
  const messageText = newMessage.value.trim();
  if (!messageText) return;

  const chatInfo = getters.enrichedChatList.value.find(c => c.id === props.conversationId);
  if (!chatInfo) return;

  const prefix = messagePrefix.value;
  const finalMessage = prefix ? `【${prefix}】${messageText}` : messageText;

  // 1. Add to action queue to be sent to AI later
  actions.addActionToQueue({
    action: 'chat',
    chatId: props.conversationId,
    isGroup: chatInfo.isGroup,
    message: finalMessage,
  });

  // 2. Directly write to the lorebook for persistence and immediate feedback
  const receiverId = chatInfo.isGroup ? props.conversationId : chatInfo.characterId || '';
  if (!receiverId) {
    console.error('无法确定接收者ID，消息发送失败。');
    return;
  }

  const rawMessageParts = [
    chatInfo.isGroup ? '群聊' : '私聊',
    store.userId,
    receiverId,
    getters.timeStr.value,
    finalMessage,
  ];

  try {
    if (chatInfo.isGroup) {
      await handleGroupMessage(rawMessageParts);
    } else {
      await handlePrivateMessage(rawMessageParts, store.worldState, store.userId);
    }
    // After successful write, refresh the data to update the UI
    await actions.loadAllData();
  } catch (error) {
    console.error('Failed to send message and write to lorebook:', error);
    // Optionally: show an error toastr to the user
  }

  newMessage.value = '';
  nextTick(() => {
    if (inputEl.value) {
      adjustTextareaHeight();
    }
    scrollToBottom();
  });
}

function handleEnter(e: KeyboardEvent) {
  if (e.shiftKey) return;
  sendMessage();
}

function scrollToBottom() {
  if (messageListEl.value) {
    messageListEl.value.scrollTop = messageListEl.value.scrollHeight;
  }
}

function adjustTextareaHeight() {
  if (inputEl.value) {
    inputEl.value.style.height = 'auto';
    inputEl.value.style.height = `${inputEl.value.scrollHeight}px`;

    const inputArea = inputEl.value.closest('.chat-input-area');
    if (messageListEl.value && inputArea) {
      messageListEl.value.style.paddingBottom = `${inputArea.clientHeight}px`;
    }
  }
}

watch(
  messages,
  () => {
    nextTick(scrollToBottom);
  },
  { deep: true, immediate: true },
);

onMounted(() => {
  const chatInfo = getters.enrichedChatList.value.find(c => c.id === props.conversationId);
  if (chatInfo && !chatInfo.isGroup && chatInfo.unreadCount > 0) {
    const conversation = get(store.worldState, `聊天会话列表.${props.conversationId}`);
    if (conversation) {
      conversation.未读数 = 0;
    }
  }

  nextTick(() => {
    adjustTextareaHeight();
    scrollToBottom();
  });
});
</script>

<style lang="scss" scoped>
// Importing variables from the old SCSS for consistency
$text-secondary: #6c757d;
$mobile-fg: #374151;
$chat-bubble-user-bg: #4a89dc;
$mobile-border: #e5e7eb;
$mobile-card-bg: #ffffff;

.chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  background-color: #f3f4f6;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background-color: white;
  border-bottom: 1px solid $mobile-border;
  flex-shrink: 0;

  .back-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    margin-right: 10px;
    color: $text-secondary;
  }
  .chat-title {
    font-weight: 600;
    font-size: 16px;
  }
}

.message-list {
  flex-grow: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.chat-bubble-wrapper {
  display: flex;
  gap: 10px;
  max-width: 85%;
  align-items: flex-start;
  margin-bottom: 10px;

  .chat-avatar {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
  }

  .chat-bubble-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .chat-sender-name {
    font-size: 13px;
    color: $text-secondary;
    margin-bottom: 4px;
  }

  .message-line {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }

  .chat-bubble {
    background-color: #ffffff;
    border-radius: 12px;
    padding: 10px 14px;
    line-height: 1.6;
    font-size: 15px;
    color: $mobile-fg;
    word-break: break-word;
  }

  .chat-timestamp {
    font-size: 12px;
    color: $text-secondary;
    flex-shrink: 0;
  }

  &.user {
    align-self: flex-end;
    flex-direction: row-reverse;

    .chat-bubble-content {
      align-items: flex-end;
    }

    .message-line {
      flex-direction: row-reverse;
    }

    .chat-bubble {
      background-color: $chat-bubble-user-bg;
      color: white;
    }
  }

  &.system {
    justify-content: center;
    align-self: center;
    max-width: 100%;
    .chat-bubble {
      background-color: $mobile-border;
      color: $text-secondary;
      font-size: 13px;
      border-radius: 12px;
      padding: 6px 12px;
      text-align: center;
      max-width: fit-content;
    }
  }
}

.chat-input-area {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px;
  background-color: $mobile-card-bg;
  border-top: 1px solid $mobile-border;
  flex-shrink: 0;

  .chat-prefix-select {
    flex-shrink: 0;
    padding: 6px 8px;
    font-size: 14px;
    border: 1px solid $mobile-border;
    border-radius: 6px;
    margin-bottom: 5px;
    height: 36px;
  }

  textarea {
    flex-grow: 1;
    border: 1px solid $mobile-border;
    border-radius: 18px;
    padding: 8px 14px;
    font-size: 15px;
    line-height: 1.4;
    resize: none;
    overflow-y: auto;
    max-height: 100px;
    min-height: 22px; // Corresponds to padding + line-height
  }

  .interaction-btn {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin-bottom: 2px;
    background-color: #3b82f6;
    color: white;
    border: none;
    cursor: pointer;
    &:hover {
      background-color: #2563eb;
    }
  }
}
</style>
