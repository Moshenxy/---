<template>
  <div class="attribute-item">
    <span class="attribute-name">{{ name }}</span>
    <span class="attribute-value">{{ value }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string;
  value: string | number;
}>();
</script>

<style lang="scss" scoped>
.attribute-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.attribute-name {
  color: #6c757d;
}

.attribute-value {
  color: #3a3f4b;
  font-weight: 500;
}
</style>