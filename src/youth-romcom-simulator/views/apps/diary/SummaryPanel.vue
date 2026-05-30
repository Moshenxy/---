<template>
  <div class="summary-panel">
    <div class="summary-section">
      <h3 class="summary-title">{{ title }}</h3>
      <div class="summary-content">
        <p v-if="summaryText">{{ summaryText }}</p>
        <p v-else class="placeholder-text">自动总结生成中...</p>
      </div>
      <button class="btn-edit" @click="openEditor">编辑</button>
    </div>

    <SummaryEditorModal
      :show="isEditorVisible"
      :summary="editingSummary"
      @close="isEditorVisible = false"
      @save="handleSaveFromEditor"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRefs } from 'vue';
import { actions, getters, store } from '../../../store';
import SummaryEditorModal from './SummaryEditorModal.vue';

const props = defineProps<{
  summaryType: 'small' | 'large';
}>();

const { summaryType } = toRefs(props);

const title = computed(() => (summaryType.value === 'small' ? '小总结 (近期提要)' : '大总结 (往事概览)'));
const summaryText = computed(() =>
  summaryType.value === 'small' ? getters.smallSummaryText.value : getters.largeSummaryText.value,
);

const isEditorVisible = ref(false);
const editingSummary = ref('');

const openEditor = () => {
  editingSummary.value = summaryText.value;
  isEditorVisible.value = true;
};

const handleSaveFromEditor = (newSummary: string) => {
  if (summaryType.value) {
    console.log(`从 ${summaryType.value} 总结更新日志:`, newSummary);
    const entries = summaryType.value === 'small' ? store.diary.smallSummaryEntries : store.diary.largeSummaryEntries;
    actions.updateLogFromSummary(entries, newSummary, summaryType.value);
  }
};
</script>

<style lang="scss" scoped>
.summary-panel {
  padding: 1rem;
  background-color: #f8f9fa;
  border-left: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.summary-section {
  .summary-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: #495057;
  }

  .summary-content {
    background-color: #fff;
    padding: 0.75rem;
    border-radius: 4px;
    min-height: 100px;
    font-size: 0.9rem;
    line-height: 1.6;
    color: #333;
    border: 1px solid #e9ecef;
  }

  .btn-edit {
    margin-top: 0.5rem;
    padding: 0.25rem 0.75rem;
    font-size: 0.8rem;
    border: 1px solid #0d6efd;
    background-color: transparent;
    color: #0d6efd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: #e7f0fe;
    }
  }
}
</style>
