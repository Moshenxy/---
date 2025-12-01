<template>
  <div class="avatar-selection">
    <div v-if="avatars.length === 0">等待AI生成化身...</div>
    <div v-else v-for="(avatar, index) in avatars" :key="index" class="avatar-card" @click="selectAvatar(avatar)">
      <h4>{{ avatar.姓名 }}</h4>
      <p><strong>身份:</strong> {{ avatar.身份 }}</p>
      <p><strong>简介:</strong> {{ avatar.简介 }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { actions, store } from '../../../store';

const avatars = computed(() => store.reincarnationAvatarOptions);

const selectAvatar = (avatar: any) => {
  // 直接调用新的 action，传递化身姓名
  actions.selectAvatarAndStart(avatar.姓名);

  // 选择后不清空选项，允许用户更改
  // 清空和关闭模态框的操作交由父组件或执行按钮完成
};
</script>

<style lang="scss" scoped>
.avatar-selection {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.avatar-card {
  border: 1px solid #ccc;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #007bff;
    box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
  }

  h4 {
    margin-top: 0;
  }
}
</style>
