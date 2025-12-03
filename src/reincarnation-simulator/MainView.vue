<template>
  <div class="main-content-wrapper" ref="mainContentWrapper">
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
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  box-sizing: border-box;
  overflow-y: auto;
  padding: 25px;
  background: $theme-primary-bg;
}
</style>
