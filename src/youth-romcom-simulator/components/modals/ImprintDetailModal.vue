<template>
  <div class="imprint-detail-modal-content" v-if="imprint">
    <div class="imprint-header">
      <h2 class="imprint-name">{{ imprint.名称 }}</h2>
      <div class="imprint-tags">
        <span class="tag type-tag">{{ imprint.类型 }}</span>
        <span class="tag level-tag" :data-level="imprint.能级">能级 {{ imprint.能级 }}</span>
      </div>
    </div>

    <div class="imprint-body">
      <div class="imprint-main-display">
        <div class="imprint-mandala" :data-level="imprint.能级">
          <!-- Central visual element, can be an icon or complex SVG -->
          <span class="mandala-icon">✧</span>
        </div>
        <p class="imprint-description">{{ imprint.描述 }}</p>
      </div>

      <div class="imprint-effects">
        <h3 class="effects-title">效果</h3>
        <ul class="effects-list" v-if="imprint.effects">
          <template v-if="imprint.effects.attributes_bonus">
            <li v-for="(value, key) in imprint.effects.attributes_bonus" :key="key" class="effect-item">
              <strong class="effect-type">{{ key }}:</strong>
              <span class="effect-value">+{{ value }}</span>
              <p class="effect-description">固定值加成</p>
            </li>
          </template>
          <template v-if="imprint.effects.percentage_bonus">
            <li v-for="(value, key) in imprint.effects.percentage_bonus" :key="key" class="effect-item">
              <strong class="effect-type">{{ key }}:</strong>
              <span class="effect-value">{{ value }}</span>
              <p class="effect-description">百分比加成</p>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Imprint } from '../../types/items';

defineProps<{
  imprint: Imprint | null;
}>();
</script>
