<template>
  <div class="detail-tab-content grid-layout">
    <div class="detail-item">
      <strong class="detail-key">名称:</strong>
      <div class="detail-value"><p>{{ npc.名称 }}</p></div>
    </div>
    <div class="detail-item">
      <strong class="detail-key">生日:</strong>
      <div class="detail-value"><p>{{ formattedBirthDate }} ({{ age }})</p></div>
    </div>
    <div class="detail-item">
      <strong class="detail-key">身份:</strong>
      <div class="detail-value">
        <span v-for="item in npc.身份" :key="item.组织" class="tag">{{ item.组织 }} - {{ item.职位 }}</span>
      </div>
    </div>
    <div class="detail-item">
      <strong class="detail-key">核心动机:</strong>
       <div class="detail-value">
        <span v-for="(value, key) in npc.内在世界.核心动机" :key="key" class="tag">
          {{ key }}: {{ value }}
        </span>
      </div>
    </div>
    <div class="detail-item full-width">
      <strong class="detail-key">容貌:</strong>
      <div class="detail-value"><p>{{ npc.个人信息.容貌 }}</p></div>
    </div>
    <div class="detail-item full-width">
      <strong class="detail-key">身材:</strong>
      <div class="detail-value"><p>{{ npc.个人信息.身材 }}</p></div>
    </div>
     <div class="detail-item full-width">
      <strong class="detail-key">核心特质:</strong>
      <div class="detail-value">
        <ul class="history-list">
          <li v-for="trait in npc.核心特质" :key="trait.名称">
            <strong>{{ trait.名称 }}</strong>
            <p class="influence-text">{{ trait.介绍 }}</p>
          </li>
        </ul>
      </div>
    </div>
    <div class="detail-item full-width">
      <strong class="detail-key">记忆:</strong>
      <div class="detail-value">
        <ul class="history-list">
          <li v-for="(event, index) in npc.记忆" :key="index">
            <strong>{{ new Date(event.时间).toLocaleDateString() }}: {{ event.事件摘要 }}</strong>
            <p class="influence-text">影响: {{ event.影响 }}</p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { 角色 } from '../../../types';

const props = defineProps<{ npc: 角色 }>();

const age = computed(() => {
  if (!props.npc.个人信息?.年龄) return '未知';
  return props.npc.个人信息.年龄;
});

const formattedBirthDate = computed(() => {
  const bd = props.npc.个人信息?.出生日期;
  if (!bd) return '未知';
  const date = new Date(bd);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
});

</script>

<style lang="scss" scoped>
@use '../../../styles/theme/variables' as *;
@use '../../../styles/theme/mixins' as *;

.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: $spacing-lg;
}

.detail-item {
  &.full-width {
    grid-column: 1 / -1;
  }
  .detail-key {
    color: $color-gold-pale;
    font-family: $font-family-title;
    font-size: $font-size-large;
    display: block;
    margin-bottom: $spacing-md;
  }
  .detail-value {
    color: $color-white-moon;
    font-size: $font-size-base;
    line-height: 1.7;
    p {
      margin: 0;
      white-space: pre-wrap;
    }
    .tag {
      display: inline-block;
      background-color: rgba($color-cyan-tian, 0.15);
      color: $color-cyan-tian;
      padding: 4px 8px;
      border-radius: $border-radius-sm;
      margin-right: $spacing-sm;
      margin-bottom: $spacing-sm;
    }
  }
}

.history-list {
  list-style: none;
  padding: 0;
  li {
    margin-bottom: $spacing-md;
    strong {
      color: $color-gold-pale;
    }
    p {
      color: $color-grey-stone;
      font-size: $font-size-small;
    }
  }
}
.influence-text {
  color: $color-cyan-tian;
  font-style: italic;
  font-size: $font-size-small;
  margin-top: $spacing-sm;
}
</style>
