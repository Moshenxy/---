<template>
  <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">{{ title }}</h2>
        <button class="modal-close-btn" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Modal Title',
  },
});

defineEmits(['close']);
</script>

<style lang="scss" scoped>
@use '../../styles/main.scss' as *;

.modal-backdrop {
  display: flex;
  position: fixed; /* Use fixed to cover the whole viewport */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba($charcoal-blue, 0.5);
  backdrop-filter: blur(8px);
  justify-content: center;
  align-items: center;
  z-index: 1000;
  transition: opacity 0.3s ease;
}

.modal-content {
  background: white;
  border: 1px solid $theme-border-color;
  border-radius: 12px;
  padding: 25px;
  width: 90%;
  max-width: 800px;
  height: 90%;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.2);
  transform: scale(0.95);
  transition: transform 0.3s ease;
}

.modal-backdrop.is-visible .modal-content {
  transform: scale(1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid $theme-border-color;
  padding-bottom: 15px;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.modal-title {
  font-size: 20px;
  color: $royal-blue;
  font-weight: 600;
}

.modal-close-btn {
  font-size: 28px;
  color: $steel-gray;
  cursor: pointer;
  background: none;
  border: none;
  transition: color 0.2s ease;
  margin-left: 15px;
  &:hover {
    color: $danger-red;
  }
}

.modal-body {
  flex-grow: 1;
  overflow-y: auto;
}
</style>
