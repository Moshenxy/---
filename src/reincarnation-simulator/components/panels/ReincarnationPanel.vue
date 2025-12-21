<template>
  <div class="reincarnation-panel">
    <div class="tabs">
      <button
        :class="{ active: activeTab === 'worldSelection' }"
        @click="activeTab = 'worldSelection'"
        :disabled="reincarnationStatus !== 'world-selection' && reincarnationStatus !== 'cooldown'"
      >
        待选择世界 ({{ statusText }})
      </button>
      <button
        :class="{ active: activeTab === 'avatarSelection' }"
        @click="activeTab = 'avatarSelection'"
        :disabled="reincarnationStatus !== 'avatar-selection'"
      >
        可选化身
      </button>
      <button
        :class="{ active: activeTab === 'settlementView' }"
        @click="activeTab = 'settlementView'"
        :disabled="reincarnationStatus !== 'settlement'"
      >
        宿命抉择
      </button>
      <button :class="{ active: activeTab === 'log' }" @click="activeTab = 'log'">本世历程</button>
      <button :class="{ active: activeTab === 'ripples' }" @click="activeTab = 'ripples'">往世涟漪</button>
    </div>
    <div class="tab-content">
      <WorldSelection v-if="activeTab === 'worldSelection'" />
      <AvatarSelection v-if="activeTab === 'avatarSelection'" />
      <SettlementView v-if="activeTab === 'settlementView'" />
      <LogPanel v-if="activeTab === 'log'" />
      <RipplesPanel v-if="activeTab === 'ripples'" />

      <div v-if="reincarnationStatus === 'simulating'" class="status-placeholder">轮回中...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { get } from 'lodash';
import { store } from '../../store';
import LogPanel from './LogPanel.vue';
import RipplesPanel from './RipplesPanel.vue';
import AvatarSelection from './reincarnation/AvatarSelection.vue';
import SettlementView from './reincarnation/SettlementView.vue';
import WorldSelection from './reincarnation/WorldSelection.vue';
import { simulatorStatus, simulatorCooldown } from '../../store/getters';

const activeTab = ref('worldSelection');

const reincarnationStatus = computed(() => simulatorStatus.value);
const cooldown = computed(() => simulatorCooldown.value);

const statusText = computed(() => {
  switch (reincarnationStatus.value) {
    case 'world-selection':
      return '轮回待命';
    case 'avatar-selection':
      return '选择化身';
    case 'simulating':
      return '轮回中';
    case 'settlement':
      return '等待结算';
    case 'cooldown':
      return `冷却中: ${cooldown.value.remainingTime}`;
    default:
      return '未知状态';
  }
});

watch(
  reincarnationStatus,
  newStatus => {
    if (newStatus === 'world-selection') {
      activeTab.value = 'worldSelection';
    } else if (newStatus === 'avatar-selection') {
      activeTab.value = 'avatarSelection';
    } else if (newStatus === 'settlement') {
      activeTab.value = 'settlementView';
    }
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.reincarnation-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: $spacing-md;
}

.tabs-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba($color-cyan-tian, 0.2);
  margin-bottom: $spacing-md;
}

.tabs {
  display: flex;
  gap: $spacing-md;

  button {
    padding: $spacing-sm $spacing-md;
    border: none;
    background: none;
    cursor: pointer;
    font-family: $font-family-title;
    font-size: $font-size-large;
    color: $color-grey-stone;
    position: relative;
    transition: color 0.3s ease;

    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: $color-gold-liu;
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }

    &:hover {
      color: $color-white-moon;
    }

    &.active {
      color: $color-gold-pale;
      &::after {
        transform: scaleX(1);
      }
    }

    &:disabled {
      color: rgba($color-grey-stone, 0.4);
      cursor: not-allowed;
    }
  }
}

.tab-content {
  flex-grow: 1;
  overflow-y: auto;
  @include custom-scrollbar;
}
</style>
