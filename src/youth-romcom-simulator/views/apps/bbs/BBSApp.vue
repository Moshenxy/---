<template>
  <div class="bbs-app">
    <div class="app-header">
      <h1>校园论坛</h1>
      <button class="new-post-btn" @click="showNewPostView = true" v-if="!selectedPost && !showNewPostView">+</button>
    </div>
    <div class="app-content">
      <div v-if="showNewPostView" class="new-post-view">
        <input type="text" v-model="newPost.title" placeholder="帖子标题" />
        <select v-model="newPost.board">
          <option disabled value="">请选择版块</option>
          <option>校园杂谈</option>
          <option>学习交流</option>
          <option>都市传说</option>
          <option>失物招领</option>
        </select>
        <textarea v-model="newPost.content" placeholder="帖子内容..."></textarea>
        <div class="new-post-actions">
          <button @click="showNewPostView = false">取消</button>
          <button @click="submitNewPost">发布</button>
        </div>
      </div>
      <PostDetailView v-else-if="selectedPost" :post="selectedPost" @back="selectedPost = null" />
      <div v-else>
        <div v-if="posts.length === 0" class="loading">正在加载帖子...</div>
        <div v-else class="post-list">
          <div v-for="post in posts" :key="post.id" class="post-item" @click="selectPost(post)">
            <div class="post-item-header">
              <span class="post-board">[{{ post.board }}]</span>
              <span class="post-title">{{ post.title }}</span>
            </div>
            <div class="post-item-meta">
              <span class="post-author">{{ getAuthorName(post.author) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, onUnmounted } from 'vue';
import { forumService, type ForumPost } from '../../../services/ForumService';
import PostDetailView from './components/PostDetailView.vue';
import { getters, store } from '../../../store';
import { getCharacterById, safeGetValue } from '../../../utils/character-utils';
import { eventBus } from '../../../utils/event-bus';

const posts = computed(() => forumService.posts.value);
const selectedPost = ref<ForumPost | null>(null);
const showNewPostView = ref(false);

const newPost = reactive({
  title: '',
  board: '',
  content: '',
});

function selectPost(post: ForumPost) {
  selectedPost.value = post;
}

function getAuthorName(authorId: string): string {
  if (authorId === '{{user}}') return getters.userFullName.value;
  if (!store.worldState) return authorId;
  const char = getCharacterById(store.worldState, authorId);
  return char ? `${safeGetValue(char, '姓', '')}${safeGetValue(char, '名', authorId)}` : authorId;
}

function submitNewPost() {
  if (!newPost.title.trim() || !newPost.board || !newPost.content.trim()) {
    alert('请填写所有字段');
    return;
  }
  // 实际应调用服务
  console.log('Submitting new post:', newPost);
  forumService.posts.value.unshift({
    id: `post_${Date.now()}`,
    title: newPost.title,
    board: newPost.board,
    author: '{{user}}',
    isPinned: false,
    content: newPost.content,
    replies: [],
  });
  // 重置
  newPost.title = '';
  newPost.board = '';
  newPost.content = '';
  showNewPostView.value = false;
}
</script>

<style lang="scss">
@import '../../../styles/apps/bbs.scss';
</style>