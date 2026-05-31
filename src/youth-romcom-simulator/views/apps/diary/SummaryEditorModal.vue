<template>
  <div class="modal-overlay" v-if="show">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">编辑总结</h3>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        <textarea class="summary-editor" v-model="editableSummary"></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="saveChanges">保存并更新日志</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue';

const props = defineProps({
  show: Boolean,
  summary: String,
});

const emit = defineEmits(['close', 'save']);

const editableSummary = ref('');

watch(
  () => props.summary,
  newVal => {
    editableSummary.value = newVal || '';
  },
);

const saveChanges = () => {
  emit('save', editableSummary.value);
  emit('close');
};
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.modal-title {
  font-size: 1.25rem;
  margin: 0;
}

.modal-close {
  border: none;
  background: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.summary-editor {
  width: 100%;
  min-height: 200px;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ced4da;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.6;
}

.modal-footer {
  text-align: right;
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #0d6efd;
  color: white;
  &:hover {
    background-color: #0b5ed7;
  }
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  &:hover {
    background-color: #5a6268;
  }
}
</style>
