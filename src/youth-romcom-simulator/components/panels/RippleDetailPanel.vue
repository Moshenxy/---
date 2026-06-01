<template>
  <div class="ripple-detail-panel">
    <div v-if="ripple" class="ripple-content">
      <div v-for="(value, key) in ripple" :key="key" class="detail-item">
        <strong class="detail-key">{{ key }}:</strong>
        <span class="detail-value">{{ value }}</span>
      </div>
    </div>
    <div v-else class="loading-message">
      正在加载往世涟漪数据...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, toRefs } from 'vue';
import { ripplesService, Ripple } from '../../services/RipplesService';

const props = defineProps<{
  rippleId: number;
}>();

const { rippleId } = toRefs(props);
const ripple = ref<Ripple | undefined>(undefined);

onMounted(() => {
  ripple.value = ripplesService.getRippleById(rippleId.value);
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.ripple-detail-panel {
  padding: $spacing-lg;
  height: 100%;
  overflow-y: auto;
  @include custom-scrollbar;
}

.ripple-content {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.detail-item {
  display: flex;
  flex-direction: column;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid rgba($color-gold-liu, 0.1);
}

.detail-key {
  font-weight: bold;
  color: $color-gold-pale;
  margin-bottom: $spacing-xs;
}

.detail-value {
  white-space: pre-wrap;
  color: $color-white-moon;
  line-height: 1.6;
}

.loading-message {
  color: $color-grey-stone;
  text-align: center;
  padding: $spacing-xl;
}
</style>