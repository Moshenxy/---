<template>
  <div class="post-detail-view">
    <div class="detail-header">
      <button @click="$emit('back')" class="back-btn">< 返回列表</button>
      <h2 class="detail-title">{{ post.title }}</h2>
    </div>
    <div class="post-meta">
      <span>版块: {{ post.board }}</span>
      <span>作者: {{ post.author }}</span>
    </div>
    <div class="post-content-full" v-html="post.content.replace(/\n/g, '<br>')"></div>
    <div class="replies-section">
      <h3>回复</h3>
      <div v-if="post.replies && post.replies.length > 0" class="reply-list">
        <div v-for="(reply, index) in post.replies" :key="index" class="reply-item">
          <p class="reply-content">{{ reply.content }}</p>
          <p class="reply-author">- {{ getAuthorName(reply.author) }}</p>
        </div>
      </div>
      <div v-else class="no-replies">
        <p>暂无回复</p>
      </div>
    </div>
    <div class="reply-input-section">
      <textarea v-model="newReply" placeholder="输入你的回复..."></textarea>
      <button @click="submitReply" class="submit-reply-btn">发表回复</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ForumPost } from '../../../../services/ForumService';
import { actions, getters, store } from '../../../../store';
import { getCharacterById, safeGetValue } from '../../../../utils/character-utils';

interface Props {
  post: ForumPost;
}

const props = defineProps<Props>();
const emit = defineEmits(['back']);

const newReply = ref('');

function submitReply() {
  if (!newReply.value.trim()) return;
  
  const command = `[行动指令|回复帖子|${props.post.id}|${newReply.value.trim()}]`;
  actions.addCachedCommand(command);
  
  // Optimistic update for instant feedback
  props.post.replies.push({
    author: store.userId,
    content: newReply.value.trim(),
  });
  
  actions.showToastr('你的回复已提交，将在下次与AI交互时处理。');
  newReply.value = '';
}

function getAuthorName(authorId: string): string {
  if (authorId === '{{user}}') return getters.userFullName.value;
  if (!store.worldState) return authorId;
  const char = getCharacterById(store.worldState, authorId);
  return char ? `${safeGetValue(char, '姓', '')}${safeGetValue(char, '名', authorId)}` : authorId;
}
</script>

<style scoped lang="scss">
.post-detail-view {
  padding: 15px;
}
.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.back-btn {
  background: none;
  border: 1px solid #ccc;
  padding: 5px 10px;
  cursor: pointer;
  margin-right: 15px;
  border-radius: 4px;
  font-size: 0.9rem;
}
.detail-title {
    font-size: 1.2rem;
    margin: 0;
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.post-meta {
    font-size: 0.8rem;
    color: #6c757d;
    margin-bottom: 20px;
    display: flex;
    gap: 15px;
}
.post-content-full {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  line-height: 1.7;
  margin-bottom: 25px;
  white-space: pre-wrap;
  word-wrap: break-word;
}
.replies-section h3 {
    margin-top: 0;
    border-bottom: 1px solid #dee2e6;
    padding-bottom: 10px;
    margin-bottom: 15px;
    font-size: 1.1rem;
}
.reply-item {
    background: #f8f9fa;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 10px;
    border-left: 3px solid #0d6efd;
}
.reply-content {
    margin: 0 0 8px 0;
    line-height: 1.6;
}
.reply-author {
    text-align: right;
    font-size: 0.8rem;
    color: #6c757d;
    margin: 0;
}
.no-replies {
    color: #6c757d;
    text-align: center;
    padding: 30px;
    background: #f8f9fa;
    border-radius: 4px;
}
.reply-input-section {
  margin-top: 20px;
  
  textarea {
    width: 100%;
    min-height: 80px;
    padding: 10px;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    resize: vertical;
    margin-bottom: 10px;
    box-sizing: border-box;
  }

  .submit-reply-btn {
    background-color: #0d6efd;
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    float: right;
    transition: background-color 0.2s;

    &:hover {
      background-color: #0b5ed7;
    }
  }
}
</style>