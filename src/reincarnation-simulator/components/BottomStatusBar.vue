<template>
  <div class="bottom-status">
    <div id="status-effects-wrapper" class="status-effects-wrapper">
      <template v-if="statusEffects.length > 0 && statusEffects[0] !== '$__META_EXTENSIBLE__$'">
        <div
          v-for="(effect, index) in statusEffects"
          :key="index"
          class="status-effect"
          :title="typeof effect === 'object' ? effect.description : ''"
        >
          <div class="effect-icon"></div>
          <span>{{ typeof effect === 'object' ? effect.name : effect }}</span>
        </div>
      </template>
      <template v-else>
        <div class="status-effect">
          <div class="effect-icon"></div>
          <span>当前无状态效果</span>
        </div>
      </template>
    </div>
    <div class="quick-send-container">
      <textarea
        id="quick-send-input"
        class="quick-send-input"
        placeholder="请在此输入回复..."
        v-model="quickSendInput"
        @keypress.enter.exact.prevent="executeQuickSend"
      ></textarea>
      <button id="btn-quick-send" class="interaction-btn" @click="executeQuickSend">发送</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { get } from 'lodash';
import { store } from '../store';

const emit = defineEmits(['quick-send']);

import { currentAvatar } from '../store/getters';

const statusEffects = computed(() => {
  const statuses = currentAvatar.value?.当前状态;
  if (!statuses) return [];
  // 转换对象为数组并过滤掉元数据
  return Object.values(statuses).filter(effect => typeof effect === 'object');
});
const quickSendInput = ref('');

function executeQuickSend() {
  if (!quickSendInput.value.trim()) return;
  emit('quick-send', quickSendInput.value.trim());
  quickSendInput.value = '';
}
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '../styles/main.scss' as *;

.bottom-status {
  background: white;
  border-top: 1px solid $theme-border-color;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 10px 15px;
  height: auto;
}

.status-effects-wrapper {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.status-effect {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background-color: color.scale($theme-accent-color, $alpha: -90%);
  border: 1px solid color.scale($theme-accent-color, $alpha: -80%);
  border-radius: 16px;
  font-size: 13px;
  cursor: help;
  transition: all 0.2s ease;

  &:hover {
    background-color: color.scale($theme-accent-color, $alpha: -85%);
    transform: translateY(-1px);
  }
}

.quick-send-container {
  display: flex;
  align-items: center;
  gap: 8px;
}
.quick-send-input {
  background: white;
  border: 1px solid $steel-gray;
  border-radius: 6px;
  color: $theme-primary-text;
  padding: 8px 12px;
  font-size: 14px;
  width: 250px;
  height: 38px;
  resize: none;
  line-height: 1.5;
  font-family: inherit;
  transition: all 0.2s ease;
  &:focus {
    height: 80px;
    border-color: $royal-blue;
    box-shadow: 0 0 0 3px color.scale($royal-blue, $alpha: -80%);
  }
  &::placeholder {
    color: $steel-gray;
  }
}

.interaction-btn {
  padding: 10px 15px;
  background-image: linear-gradient(to bottom, #ffffff, #f7f7f7);
  border: 1px solid $steel-gray;
  border-radius: 6px;
  color: $theme-primary-text;
  font-size: 13px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &:hover {
    border-color: $royal-blue;
    color: $royal-blue;
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba($royal-blue, 0.15);
  }
}
</style>
