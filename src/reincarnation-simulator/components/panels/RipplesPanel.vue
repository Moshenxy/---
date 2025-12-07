<template>
  <div class="ripples-panel">
    <div v-if="!selectedRipple" class="ripples-list">
      <div v-if="ripples.length === 0" class="empty-state">暂无往世涟漪记录。</div>
      <ul v-else>
        <li v-for="ripple in ripples" :key="ripple.id" @click="selectRipple(ripple)">
          <span class="ripple-title">{{ ripple.title }}</span>
          <span class="ripple-summary">{{ ripple['本世概述']?.substring(0, 50) }}...</span>
        </li>
      </ul>
    </div>
    <div v-else class="ripple-detail">
      <button @click="selectedRipple = null" class="back-button">&lt; 返回列表</button>
      <div class="detail-content">
        <div v-for="(value, key) in selectedRipple" :key="key" class="detail-item">
          <strong class="detail-key">{{ key }}:</strong>
          <pre class="detail-value">{{ value }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ripplesService, Ripple } from '../../services/RipplesService';

const ripples = computed(() => ripplesService.ripples);
const selectedRipple = ref<Ripple | null>(null);

const selectRipple = (ripple: Ripple) => {
  selectedRipple.value = ripple;
};

onMounted(() => {
  ripplesService.loadRipples();
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.ripples-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ripples-list {
  height: 100%;
  overflow-y: auto;
  @include custom-scrollbar;
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    padding: $spacing-md;
    border-bottom: 1px solid rgba($color-gold-liu, 0.2);
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba($color-gold-pale, 0.1);
    }
  }

  .ripple-title {
    display: block;
    font-size: $font-size-large;
    color: $color-gold-pale;
    margin-bottom: $spacing-xs;
  }

  .ripple-summary {
    font-size: $font-size-small;
    color: $color-grey-stone;
  }
}

.ripple-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .back-button {
    margin-bottom: $spacing-md;
    align-self: flex-start;
  }

  .detail-content {
    flex-grow: 1;
    overflow-y: auto;
    @include custom-scrollbar;
    padding-right: $spacing-sm;
  }

  .detail-item {
    margin-bottom: $spacing-lg;
  }

  .detail-key {
    font-weight: bold;
    color: $color-gold-pale;
    margin-bottom: $spacing-xs;
    display: block;
  }

  .detail-value {
    white-space: pre-wrap;
    word-wrap: break-word;
    color: $color-white-moon;
    font-family: inherit;
    font-size: $font-size-base;
  }
}

.empty-state {
  text-align: center;
  padding: $spacing-xl;
  color: $color-grey-stone;
}
</style>