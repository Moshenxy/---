<template>
  <div class="object-renderer" :class="{ 'is-nested': isNested }">
    <ul :class="{ 'multi-column': Object.keys(filteredData).length > 4 }">
      <ObjectRendererItem
        v-for="(value, key) in filteredData"
        :key="key"
        :item-key="String(key)"
        :value="value"
        :context="props.context"
      />
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ObjectRendererItem from './ObjectRendererItem.vue';

const props = defineProps<{
  data: Record<string, any>;
  isNested?: boolean;
  context?: Record<string, any>;
}>();

const filteredData = computed(() => {
  if (!props.data) return {};
  const { $meta, ...rest } = props.data;
  return rest;
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

.object-renderer {
  background-color: rgba($color-black-void, 1);
  padding: $spacing-md;
  border-radius: $border-radius-md;
}
.object-renderer:not(.is-nested) > ul {
  grid-template-columns: 1fr;
  &.multi-column {
    grid-template-columns: 1fr 1fr;
  }
}

ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

li {
  display: block;
}

.object-key {
  color: $color-gold-pale;
  font-weight: bold;
  cursor: help;
  text-align: left;
  white-space: nowrap;
  padding-bottom: $spacing-lg; // Add padding to align with value cell
}

.value-cell {
  padding-bottom: $spacing-lg; // Add padding to align with key
}

.value-cell {
  min-width: 0;
}

.object-value {
  color: $color-white-moon;
}

.is-nested ul {
  padding-left: $spacing-md;
  margin-top: $spacing-sm;
  border-left: 1px solid rgba($color-gold-liu, 0.2);
}

.progress-bar-container {
  width: 100%;
  background-color: rgba($color-black-void, 0.5);
  border-radius: $border-radius-sm;
  position: relative;
  height: 24px;
  border: 1px solid rgba($color-gold-liu, 0.3);
}

.progress-bar {
  background: linear-gradient(90deg, rgba($color-cyan-tian, 0.5) 0%, rgba($color-cyan-tian, 0.8) 100%);
  height: 100%;
  border-radius: $border-radius-sm;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: $color-white-moon;
  font-size: $font-size-small;
  text-shadow: 1px 1px 2px $color-black-void;
}
</style>
