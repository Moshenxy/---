<template>
  <div class="talent-detail">
    <h4 class="talent-name">{{ talent.名称 }}</h4>
    <div class="talent-meta">
      <span class="meta-item"><strong>类型:</strong> {{ talent.类型 || '未知' }}</span>
      <span class="meta-item"><strong>能级:</strong> {{ talent.能级 || 'N/A' }}</span>
    </div>
    <p class="talent-description">{{ talent.描述 }}</p>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps<{
  talent: {
    名称: string;
    类型?: string;
    能级?: number;
    描述: string;
  };
}>();
</script>

<style lang="scss" scoped>
@use '../../../styles/theme/variables' as *;

.talent-detail {
  padding: $spacing-md;
  color: $color-white-moon;
}

.talent-name {
  color: $color-gold-pale;
  font-family: $font-family-title;
  font-size: $font-size-h3;
  margin-top: 0;
  margin-bottom: $spacing-md;
  text-align: center;
}

.talent-meta {
  display: flex;
  justify-content: center;
  gap: $spacing-xl;
  margin-bottom: $spacing-lg;
  color: $color-grey-stone;
  font-size: $font-size-small;

  .meta-item strong {
    color: $color-gold-liu;
  }
}

.talent-description {
  font-size: $font-size-base;
  line-height: $line-height-base;
  text-align: justify;
}
</style>
