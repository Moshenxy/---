<template>
  <div class="input-history-popup">
    <div class="history-section">
      <h4>最近输入</h4>
      <ul v-if="historyState.recent.length > 0">
        <li v-for="(entry, index) in historyState.recent" :key="`recent-${index}`">
          <span class="entry-text" @click="useEntry(entry)">{{ entry }}</span>
          <div class="actions">
            <button @click="saveEntry(entry)" :disabled="isSaved(entry)">收藏</button>
            <button @click="deleteRecentEntry(index)">删除</button>
          </div>
        </li>
      </ul>
      <p v-else class="empty-text">暂无历史记录。</p>
    </div>
    <div class="history-section">
      <h4>收藏内容</h4>
      <ul v-if="historyState.saved.length > 0">
        <li v-for="(entry, index) in historyState.saved" :key="`saved-${index}`">
          <span class="entry-text" @click="useEntry(entry)">{{ entry }}</span>
          <div class="actions">
            <button @click="deleteSavedEntry(index)">取消收藏</button>
          </div>
        </li>
      </ul>
      <p v-else class="empty-text">暂无收藏内容。</p>
    </div>
    <button @click="$emit('close')" class="close-button-popup">关闭</button>
  </div>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue';
import { inputHistoryService } from '../../services/InputHistoryService';

const historyState = inputHistoryService.state;
const emit = defineEmits(['select-entry', 'close']);

const useEntry = (entry: string) => {
  emit('select-entry', entry);
};

const saveEntry = (entry: string) => {
  inputHistoryService.save(entry);
};

const deleteRecentEntry = (index: number) => {
  inputHistoryService.deleteRecent(index);
};

const deleteSavedEntry = (index: number) => {
  inputHistoryService.deleteSaved(index);
};

const isSaved = (entry: string) => {
  return historyState.saved.includes(entry);
};
</script>

<style lang="scss" scoped>
// Styling is now handled globally to avoid variable conflicts.
</style>
