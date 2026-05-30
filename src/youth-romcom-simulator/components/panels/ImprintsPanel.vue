<template>
  <div class="panel-wrapper imprints-panel-container">
    <div class="imprints-grid">
      <div
        v-for="(imprint, index) in paddedImprints"
        :key="index"
        class="imprint-slot"
        :class="{ empty: !imprint, clickable: !!imprint }"
        :data-level="imprint?.能级"
        @click="imprint && openImprintDetail(imprint)"
      >
        <template v-if="imprint">
          <div class="imprint-name">{{ imprint.名称 }}</div>
          <div class="imprint-level">能级: {{ imprint.能级 }}</div>
        </template>
        <div v-else class="empty-text">空</div>
      </div>
    </div>
    <div class="detail-placeholder">
      <p>点击烙印查看详情</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { reincarnationImprints } from '../../store/getters';
import { detailModalService } from '../../services/DetailModalService';
import ImprintDetailModal from '../modals/ImprintDetailModal.vue';
import type { Imprint } from '../../types/items';

const imprints = computed(() => reincarnationImprints.value);

const openImprintDetail = (imprint: Imprint) => {
  detailModalService.show(imprint.名称, ImprintDetailModal, { imprint });
};

// Ensure there are always 9 items for the layout, and filter out placeholders
const paddedImprints = computed<(Imprint | null)[]>(() => {
  const validImprints = imprints.value || [];
  const result: (Imprint | null)[] = [...validImprints];
  while (result.length < 9) {
    result.push(null);
  }
  return result.slice(0, 9);
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;
@import '../../styles/components/_imprints-panel.scss';

.detail-placeholder {
  margin-top: $spacing-lg;
  color: $color-grey-stone;
  font-style: italic;
  text-align: center;
}

.imprint-slot.clickable {
  cursor: pointer;
  &:hover {
    background-color: rgba($color-gold-liu, 0.1);
    transform: translateY(-2px);
  }
}

.empty-text {
  color: $color-grey-stone;
  font-size: $font-size-large;
}
</style>
