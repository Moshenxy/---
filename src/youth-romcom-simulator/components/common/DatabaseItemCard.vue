<template>
  <div class="database-item-card">
    <div class="info-grid">
      <div class="info-item">
        <strong>类型</strong>
        <span>{{ item.类型 || '未知' }}</span>
      </div>
      <div class="info-item">
        <strong>子类型</strong>
        <span>{{ item.子类型 || '无' }}</span>
      </div>
      <div class="info-item">
        <strong>能级</strong>
        <span>{{ item.能级 ?? '未知' }}</span>
      </div>
      <div class="info-item full-width">
        <strong>描述</strong>
        <span>{{ item.描述 || '无详细描述。' }}</span>
      </div>
      <div v-if="effects" class="info-item full-width">
        <strong>效果</strong>
        <span>{{ effects }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, computed } from 'vue';

const props = defineProps({
  item: {
    type: Object as PropType<any>,
    required: true,
  },
});

const effects = computed(() => {
  if (!props.item.effects) return null;

  const { attributes_bonus, percentage_bonus } = props.item.effects;
  const parts: string[] = [];

  if (attributes_bonus) {
    for (const key in attributes_bonus) {
      if (key === '$meta') continue;
      parts.push(`${key} +${attributes_bonus[key]}`);
    }
  }

  if (percentage_bonus) {
    for (const key in percentage_bonus) {
      if (key === '$meta') continue;
      parts.push(`${key} +${percentage_bonus[key]}`);
    }
  }

  return parts.join('；');
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.database-item-card {
  padding: $spacing-md;
  min-width: 350px;

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-lg;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;

    strong {
      font-family: $font-family-main;
      color: $color-gold-pale;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.7;
    }

    span {
      font-size: 14px;
      color: $color-white-moon;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    &.full-width {
      grid-column: 1 / -1;
    }
  }
}
</style>