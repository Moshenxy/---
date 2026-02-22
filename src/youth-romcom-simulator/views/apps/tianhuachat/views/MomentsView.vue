<template>
  <div class="moments-view">
    <div class="moment-card" v-for="moment in moments" :key="moment.ID">
      <div class="moment-header">
        <div class="avatar">{{ moment.avatarName }}</div>
        <div class="author-info">
          <div class="author-name">{{ moment.authorName }}</div>
          <div class="timestamp">{{ moment.时间戳 }}</div>
        </div>
      </div>
      <div class="moment-content">
        <p>{{ moment.内容 }}</p>
      </div>
      <div class="moment-actions">
        <button @click="likeMoment(moment.ID)">❤️ {{ moment.点赞.length }}</button>
        <button @click="toggleCommentInput(moment.ID)">💬 {{ moment.评论.length }}</button>
      </div>
      <div v-if="activeCommentInput === moment.ID" class="comment-input-area">
        <input
          type="text"
          v-model="commentText"
          placeholder="发表你的评论..."
          @keypress.enter="submitComment(moment.ID)"
        />
        <button @click="submitComment(moment.ID)">发送</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { actions, getters } from '../../../../store';

const moments = computed(() => getters.enrichedMoments.value);
const activeCommentInput = ref<string | null>(null);
const commentText = ref('');

function likeMoment(momentId: string) {
  if (!momentId) return;
  actions.likeMoment(momentId);
}

function toggleCommentInput(momentId: string) {
  if (activeCommentInput.value === momentId) {
    activeCommentInput.value = null;
  } else {
    activeCommentInput.value = momentId;
    commentText.value = '';
  }
}

function submitComment(momentId: string) {
  const text = commentText.value.trim();
  if (!text || !momentId) return;
  actions.commentOnMoment(momentId, text);
  commentText.value = '';
  activeCommentInput.value = null;
}
</script>

<style lang="scss" scoped>
.moments-view {
  height: 100%;
  overflow-y: auto;
  padding: 15px;
  background-color: #f3f4f6;
}

.moment-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.moment-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f97316;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  margin-right: 12px;
}

.author-name {
  font-weight: 500;
}

.timestamp {
  font-size: 12px;
  color: #9ca3af;
}

.moment-content {
  margin-bottom: 12px;
}

.moment-actions {
  display: flex;
  gap: 10px;
  border-top: 1px solid #e5e7eb;
  padding-top: 10px;

  button {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: color 0.2s ease;

    &:hover {
      color: #3b82f6;
    }
  }
}

.comment-input-area {
  margin-top: 10px;
  display: flex;
  gap: 10px;

  input {
    flex-grow: 1;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 14px;
  }

  button {
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 8px 15px;
    cursor: pointer;
  }
}
</style>
