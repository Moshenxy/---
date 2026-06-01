<template>
  <div class="forum-panel">
    <div class="tabs">
      <button :class="{ active: activeTab === 'bbs' }" @click="activeTab = 'bbs'">校园BBS</button>
      <button :class="{ active: activeTab === 'weekly' }" @click="activeTab = 'weekly'">周刊回顾</button>
    </div>
    <div class="tab-content">
      <div v-if="activeTab === 'bbs'" class="bbs-view">
        <div v-if="posts.length > 0" class="post-list">
          <div v-for="(post, index) in posts" :key="index" class="post-item">
            <h5 class="post-title">{{ post.title }}</h5>
            <p class="post-content">{{ post.content }}</p>
            <div class="post-meta">
              <span>发帖人: {{ post.author }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>BBS上还没有新帖子。</p>
        </div>
      </div>
      <div v-if="activeTab === 'weekly'" class="weekly-review-view">
        <div v-if="reviews.length > 0" class="review-list">
          <div v-for="review in reviews" :key="review.刊号" class="review-item">
            <h4 class="review-title">{{ review.本周头条 }}</h4>
            <div class="review-meta">
              <span>第{{ review.刊号 }}期 | {{ review.发行日期 }}</span>
            </div>
            <p class="review-content">{{ review.一周热点追击 }}</p>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>还没有周刊发布。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { forumService } from '../../services/ForumService';

const activeTab = ref('bbs');
const posts = computed(() => forumService.posts.value);
const reviews = computed(() => forumService.reviews.value);
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.forum-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tabs {
  display: flex;
  gap: $spacing-md;
  border-bottom: 1px solid rgba($color-cyan-tian, 0.2);
  margin-bottom: $spacing-md;

  button {
    padding: $spacing-sm $spacing-md;
    border: none;
    background: none;
    cursor: pointer;
    font-family: $font-family-title;
    font-size: $font-size-large;
    color: $color-grey-stone;
    position: relative;
    transition: color 0.3s ease;

    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: $color-gold-liu;
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }

    &:hover {
      color: $color-white-moon;
    }

    &.active {
      color: $color-gold-pale;
      &::after {
        transform: scaleX(1);
      }
    }
  }
}

.tab-content {
  flex-grow: 1;
  overflow-y: auto;
  @include custom-scrollbar;
  padding: $spacing-md;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.post-item {
  background-color: rgba($color-black-void, 0.3);
  border: 1px solid rgba($color-cyan-tian, 0.2);
  border-radius: $border-radius-md;
  padding: $spacing-md;
}

.post-title {
  font-family: $font-family-title;
  color: $color-gold-pale;
  font-size: $font-size-large;
  margin: 0 0 $spacing-md 0;
}

.post-content {
  line-height: 1.6;
  margin-bottom: $spacing-md;
  color: $color-white-moon;
}

.post-meta {
  font-size: $font-size-small;
  color: $color-grey-stone;
  text-align: right;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.review-item {
  border-bottom: 1px solid rgba($color-gold-liu, 0.2);
  padding-bottom: $spacing-lg;
}

.review-title {
  font-family: $font-family-title;
  font-size: $font-size-h3;
  color: $color-gold-pale;
  margin: 0 0 $spacing-sm 0;
}

.review-meta {
  font-size: $font-size-small;
  color: $color-grey-stone;
  margin-bottom: $spacing-md;
}

.review-content {
  line-height: 1.7;
  white-space: pre-wrap; /* Preserve newlines from the log */
}

.empty-state {
  text-align: center;
  color: $color-grey-stone;
  padding-top: 5em;
}
</style>