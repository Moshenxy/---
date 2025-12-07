<template>
  <div class="realm-detail-card" v-if="realm">
    <div class="info-item">
      <strong>能级</strong>
      <span>{{ realm.能级 }}</span>
    </div>
    <div class="info-item">
      <strong>名称</strong>
      <span>{{ realm.名称 }}</span>
    </div>
    <div class="info-item full-width">
      <strong>描述</strong>
      <span>{{ realm.描述 }}</span>
    </div>
    <div class="info-item full-width">
      <strong>解锁系统</strong>
      <span>{{ realm.解锁系统?.名称 }} - {{ realm.解锁系统?.描述 }}</span>
    </div>
    <div class="info-item full-width">
      <strong>晋升需求</strong>
      <ul>
        <li v-for="(req, key) in realm.晋升需求" :key="key">
          {{ req.条件?.描述 }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

defineProps({
  realm: {
    type: Object as PropType<any>,
    required: true,
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

.realm-detail-card {
  padding: $spacing-md;
  min-width: 400px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-lg;

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

    span,
    ul {
      font-size: 14px;
      color: $color-white-moon;
      line-height: 1.6;
    }

    ul {
      padding-left: 20px;
    }

    &.full-width {
      grid-column: 1 / -1;
    }
  }
}
</style>
