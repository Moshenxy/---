<template>
  <Modal :show="show" @close="$emit('close')">
    <template #header>
      <h2 class="modal-title">指令中心</h2>
    </template>
    <template #body>
      <p>指令中心内容将在此处实现。</p>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import Modal from './Modal.vue';
defineProps<{ show: boolean }>();
defineEmits(['close']);
</script>
