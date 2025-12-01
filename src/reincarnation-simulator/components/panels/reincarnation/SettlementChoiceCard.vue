<template>
  <div class="settlement-choice-card" :class="{ 'is-selected': isSelected }" @click="selectCard">
    <div class="card-header">
      <span class="choice-type">{{ choice.选项类型 }}</span>
    </div>
    <div class="card-body">
      <p class="description">{{ choice.描述 }}</p>
      <div v-if="choice.数据" class="data-details">
        <strong class="data-name">{{ choice.数据.名称 }}</strong>
        <p class="data-description">{{ choice.数据.描述 }}</p>
      </div>
    </div>
    <div class="card-footer">
      <span class="cost">消耗灵魂本源: {{ choice.消耗 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  choice: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
});

const emits = defineEmits(['select']);

const selectCard = () => {
  emits('select', props.choice);
};
</script>