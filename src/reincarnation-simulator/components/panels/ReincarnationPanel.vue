<template>
  <div class="reincarnation-panel">
    <div class="tabs">
      <button :class="{ active: activeTab === 'worldSelection' }" @click="activeTab = 'worldSelection'">
        待选择世界
        <span :style="{ color: cooldownService.isCoolingDown.value ? '#ffb74d' : (isSimulationRunning ? '#e57373' : '#81c784') }">
          {{
            cooldownService.isCoolingDown.value
            ? `（冷却中: ${cooldownService.remainingTime.value}）`
            : (isSimulationRunning ? '（轮回中）' : '（轮回待命）')
          }}
        </span>
      </button>
      <button
        :class="{ active: activeTab === 'avatarSelection' }"
        @click="activeTab = 'avatarSelection'"
        :disabled="!canSelectAvatar"
      >
        可选化身
      </button>
      <button :class="{ active: activeTab === 'settlementView' }" @click="activeTab = 'settlementView'">宿命抉择</button>
      <button :class="{ active: activeTab === 'log' }" @click="activeTab = 'log'">本世历程</button>
      <button :class="{ active: activeTab === 'ripples' }" @click="activeTab = 'ripples'">往世涟漪</button>
      <button
        :class="{ active: activeTab === 'settlement' }"
        @click="activeTab = 'settlement'"
        v-if="hasSettlementData"
      >
        轮回结算
      </button>
    </div>
    <div class="tab-content">
      <WorldSelection v-if="activeTab === 'worldSelection'" />
      <AvatarSelection v-if="activeTab === 'avatarSelection'" />
      <SettlementView v-if="activeTab === 'settlementView'" />
      <LogPanel v-if="activeTab === 'log'" />
      <RipplesPanel v-if="activeTab === 'ripples'" />
      <SettlementPanel v-if="activeTab === 'settlement'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { store } from '../../store';
import { isSimulationRunning } from '../../store/getters';
import { cooldownService } from '../../services/CooldownService';
import LogPanel from './LogPanel.vue';
import RipplesPanel from './RipplesPanel.vue';
import AvatarSelection from './reincarnation/AvatarSelection.vue';
import SettlementView from './reincarnation/SettlementView.vue';
import WorldSelection from './reincarnation/WorldSelection.vue';
import SettlementPanel from './SettlementPanel.vue';

const activeTab = ref('worldSelection');

const canSelectAvatar = computed(() => Object.keys(store.reincarnationAvatarOptions || {}).length > 0);
const hasSettlementData = computed(() => store.worldState?.模拟器?.结算?.待处理 === true);

// 如果有结算数据，自动跳转到结算页面
watch(
  hasSettlementData,
  newValue => {
    if (newValue) {
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
