<template>
  <div class="complex-attribute">
    <div class="header">
      <h5 class="name">{{ data.名称 }}</h5>
      <p class="description">{{ data.描述 }}</p>
    </div>
    <div class="body">
      <div v-for="(value, key) in childAttributes" :key="key" class="child-attribute">
        <span class="child-key">{{ key }}:</span>
        <div class="child-value">
          <template v-if="isGridData(value)">
            <AttributeGrid
              :attributes="value"
              :style="{
                display: 'grid',
                'grid-template-columns': 'repeat(auto-fit, minmax(100px, 1fr))',
              }"
            />
          </template>
          <template v-else>
            {{ value }}
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AttributeGrid from '../AttributeGrid.vue';

const props = defineProps<{
  data: Record<string, any>;
}>();

const childAttributes = computed(() => {
  const { 名称, 描述, $meta, ...rest } = props.data;
  return rest;
});

const isGridData = (value: any) => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};
</script>

<style lang="scss" scoped>
@use '../../../styles/theme/variables' as *;

.complex-attribute {
  background: rgba($color-indigo-deep, 0.3);
  border-radius: $border-radius-md;
  width: 150%; // 允许该组件突破父容器的宽度限制
  border: 1px solid rgba($color-gold-liu, 0.15);
  padding: $spacing-md;
  margin-bottom: $spacing-lg;
}

.header {
  border-bottom: 1px solid rgba($color-gold-liu, 0.2);
  padding-bottom: $spacing-md;
  margin-bottom: $spacing-md;
}

.name {
  font-family: $font-family-title;
  font-size: $font-size-h3;
  color: $color-gold-pale;
  margin: 0 0 $spacing-sm 0;
}

.description {
  font-size: $font-size-small;
  color: $color-grey-stone;
  margin: 0;
}

.body {
  // display: flex;
  // flex-direction: column;
  // gap: $spacing-md;
}

.child-attribute {
  // display: flex;
  // flex-direction: column;
  // gap: $spacing-sm;
}

.child-key {
  font-weight: bold;
  color: $color-white-moon;
}

.child-value {
  min-width: 0;
}
</style>
