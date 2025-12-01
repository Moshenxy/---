<template>
  <div class="main-content-wrapper">
    <FormattedTextRenderer :text="combinedNarrative" />
  </div>
</template>

<script setup lang="ts">
import { combinedNarrative } from './store/getters';
import FormattedTextRenderer from './components/common/FormattedTextRenderer.vue';
</script>

<style lang="scss">
@use './styles/main.scss' as *;

.main-content-wrapper {
  position: relative;
  height: 100%;
  width: 100%; /* Explicitly set width */
  box-sizing: border-box; /* Include padding in the width calculation */
  overflow-y: auto;
  padding: 25px;
  background: $theme-primary-bg;
}
</style>
