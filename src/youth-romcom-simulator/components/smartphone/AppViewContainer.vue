<template>
  <div class="app-view-container">
    <div class="app-header">
      <button class="back-btn" @click="$emit('back')">
        <i class="fas fa-chevron-left"></i>
      </button>
      <h3 class="app-title">{{ title }}</h3>
      <div class="header-actions">
        <slot name="header-actions"></slot>
      </div>
    </div>
    <div class="app-content">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'AppViewContainer',
  props: {
    title: {
      type: String,
      required: true,
    },
  },
  emits: ['back'],
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.app-view-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: $color-black-void;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  background-color: rgba($color-indigo-deep, 0.7);
  border-bottom: 1px solid rgba($color-gold-liu, 0.3);
  flex-shrink: 0;

  .back-btn {
    background: none;
    border: none;
    color: $color-gold-pale;
    font-size: $font-size-h3;
    cursor: pointer;
  }

  .app-title {
    color: $color-gold-pale;
    font-family: $font-family-title;
    font-size: $font-size-h3;
    margin: 0;
  }

  .header-actions {
    width: 24px; // to balance the back button
  }
}

.app-content {
  flex-grow: 1;
  overflow-y: auto;
  @include custom-scrollbar;
  padding: $spacing-md;
}
</style>
