<template>
  <div v-if="modalState.isVisible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button class="modal-close-btn" @click="closeModal">&times;</button>
      <component :is="modalComponent" :worldType="worldType" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { modalService } from '../services/ModalService';

const modalState = computed(() => modalService.state);
const modalComponent = modalService.component;
const worldType = modalService.worldType;

const closeModal = () => {
  modalService.hide();
};
</script>

<style lang="scss" scoped>
/* Styles are now in app.scss, so this component doesn't need its own styles. */
/* We can add component-specific styles here if needed in the future. */
</style>
