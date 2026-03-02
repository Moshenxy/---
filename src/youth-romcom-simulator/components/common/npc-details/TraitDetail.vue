<template>
  <div class="trait-detail-content">
    <p>{{ introduction }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  introduction: string;
}>();
</script>

<style lang="scss" scoped>
@use '../../../styles/theme/variables' as *;

.trait-detail-content {
  color: $color-white-moon;
  font-size: $font-size-base;
  line-height: $line-height-base;
  white-space: pre-wrap;
}
</style>
