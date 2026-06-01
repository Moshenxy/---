<template>
  <div class="world-selection-container">
    <div v-if="isLoading" class="loading-state">
      <div class="progress-bar-container">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
      <span>天机重演中... {{ progress }}%</span>
    </div>

    <div v-if="!isLoading" ref="starmapContainer" class="star-map-canvas" @click="handleCanvasClick"></div>

    <div class="world-detail-panel" :class="{ visible: !!detailedWorld }">
      <template v-if="detailedWorld && activeEpoch">
        <h4>{{ detailedWorld.name }}</h4>
        <div class="detail-item">
          <p><strong>宇宙蓝图:</strong> {{ detailedWorld.cosmologicalBlueprint }}</p>
        </div>
        <div class="detail-item">
          <p><strong>物理尺度:</strong> {{ detailedWorld.physicalScale }}</p>
        </div>

        <div class="epoch-tabs">
          <button
            v-for="epoch in detailedWorld.epochs"
            :key="epoch.id"
            :class="{ active: activeEpochId === epoch.id }"
            @click="activeEpochId = epoch.id"
          >
            {{ epoch.name }}
          </button>
        </div>

        <div class="detail-item">
          <p><strong>能级:</strong> {{ activeEpoch.energyLevel }}</p>
        </div>
        <div class="detail-item">
          <p><strong>时间流速:</strong> {{ activeEpoch.timeFlow }}x</p>
        </div>
        <div class="detail-item" v-if="activeEpoch.coreLaws && activeEpoch.coreLaws.length > 0">
          <p><strong>核心法则:</strong></p>
          <ul>
            <li v-for="(law, index) in activeEpoch.coreLaws" :key="index">{{ law }}</li>
          </ul>
        </div>
        <div class="world-description">
          <p>{{ activeEpoch.description }}</p>
        </div>
        <div class="panel-footer">
          <button
            v-if="isDetailedWorldActive"
            @click="prepareReincarnation(detailedWorld.raw)"
            :disabled="!isDetailedWorldActive"
          >
            踏入此界
          </button>
          <p v-else class="unselectable-notice">缘分未至，无法进入</p>
        </div>
      </template>
    </div>

    <div class="map-controls">
      <button @click="rescanWorlds()" class="rescan-btn">重演天机</button>
    </div>

    <div class="speed-controls-overlay">
      <button @click="adjustSpeed(1)" title="加速" class="control-btn">+</button>
      <div class="speed-bar-container">
        <div class="speed-bar-track"></div>
        <div class="speed-bar-fill" :style="{ height: `${speedLevel * 25}%` }"></div>
      </div>
      <button @click="adjustSpeed(-1)" title="减速" class="control-btn">-</button>
    </div>

    <div v-if="isSimulationRunning" class="evolving-overlay">
      <p>世界演化中，请稍候...</p>
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { get } from 'lodash';
// import { lorebookService } from '../../../services/LorebookService'; // 不再需要
import { StarMapService } from '../../../services/StarMapService';
import { actions, store } from '../../../store';
import { isSimulationRunning, simulatorCooldown } from '../../../store/getters';
import type { WorldbookEntry } from '../../../types';
import './WorldSelection.scss';
interface Epoch {
  id: string;
  name: string;
  energyLevel: number;
  timeFlow: number;
  description: string;
  coreLaws: string[];
}

interface ParsedWorld {
  id: number;
  name: string;
  raw: any;
  cosmologicalBlueprint: string;
  physicalScale: string;
  currentEpochId: string;
  epochs: Epoch[];
}

const starmapContainer = ref<HTMLElement | null>(null);
let starMapService: StarMapService | null = null;

const isLoading = ref(true);
const detailedWorld = ref<ParsedWorld | null>(null);
const selectableWorldIds = ref<Set<number>>(new Set());
const progress = ref(0);
let progressInterval: number | null = null;
const activeEpochId = ref<string | null>(null);

// 5-speed level control
const speedLevels = [0, 0.2, 0.5, 1.0, 2.0];
const speedLevel = ref(2); // Default to level 2 (1.0x speed)

const parsedWorlds = computed<ParsedWorld[]>(() => {
  const worlds = get(store.worldState, '世界', {});
  let idCounter = 0;
  return Object.entries(worlds)
    .filter(([worldId]) => worldId !== '$meta' && !worldId.includes('template'))
    .map(([worldId, worldData]: [string, any]) => {
      const historicalEpochs = get(worldData, '定义.历史纪元', {});
      const epochs: Epoch[] = Object.entries(historicalEpochs).map(([epochId, epochData]: [string, any]) => {
        const coreLaws = get(epochData, '规则.核心法则', {});
        return {
          id: epochId,
          name: epochData.纪元名称 || '未知纪元',
          energyLevel: get(epochData, '规则.世界能级', 1),
          timeFlow: get(epochData, '规则.时间流速', 1),
          description: epochData.纪元概述 || '一片混沌，无法窥其貌。',
          coreLaws: Object.values(coreLaws)
            .map((law: any) => law.名称)
            .filter(Boolean) as string[],
        };
      });

      return {
        id: ++idCounter,
        name: worldData.名称 || '未知世界',
        raw: { ...worldData, originalId: worldId },
        cosmologicalBlueprint: get(worldData, '定义.元规则.宇宙蓝图', '未知'),
        physicalScale: get(worldData, '定义.元规则.物理尺度', '未知'),
        currentEpochId: get(worldData, '定义.元规则.当前纪元ID', ''),
        epochs: epochs,
      };
    });
});

const cooldown = computed(() => simulatorCooldown.value);

const isDetailedWorldActive = computed(() => {
  // 按钮的激活状态取决于：1. 轮回未在进行中 2. 模拟器不处于冷却状态
  return !isSimulationRunning.value && cooldown.value.status !== '冷却中';
});

const selectRandomWorlds = () => {
  // 核心原则：直接使用 `isSimulationRunning` getter 作为唯一的状态源
  // 如果轮回正在进行中，则所有世界都不可选
  if (isSimulationRunning.value) {
    selectableWorldIds.value = new Set();
    return;
  }

  // 否则（轮回已结束或未开始），随机选择三个世界作为可选项
  const worlds = parsedWorlds.value;
  if (worlds.length === 0) return;

  const ids = worlds.map(w => w.id);
  if (worlds.length <= 3) {
    selectableWorldIds.value = new Set(ids);
  } else {
    const shuffled = [...ids].sort(() => 0.5 - Math.random());
    selectableWorldIds.value = new Set(shuffled.slice(0, 3));
  }
};

const rescanWorlds = () => {
  isLoading.value = true;
  detailedWorld.value = null;
  progress.value = 0;

  if (progressInterval) {
    clearInterval(progressInterval);
  }

  progressInterval = window.setInterval(() => {
    if (progress.value < 99) {
      progress.value++;
    } else {
      if (progressInterval) clearInterval(progressInterval);
    }
  }, 960); // 1分35秒 (95000ms / 99 ~= 960ms)

  // 关键修复：在请求新世界之前，必须先清空旧的世界列表缓存
  actions.resetReincarnationSelection();
  // 异步调用，不等待其完成，让UI继续更新
  actions.triggerCreationWorkflow();
};

// const syncNewWorlds = () => {
//   store.newWorldsAvailable = false;
//   // 强制重新加载页面，以达到最彻底的刷新效果
//   window.location.reload();
// };

const handleCanvasClick = (event: MouseEvent) => {
  if (!starMapService) return;
  const pickedWorld = starMapService.pickStar(event);
  if (pickedWorld) {
    detailedWorld.value = pickedWorld as ParsedWorld;
  } else {
    detailedWorld.value = null;
  }
};

const activeEpoch = computed(() => {
  if (!detailedWorld.value || !activeEpochId.value) return null;
  return detailedWorld.value.epochs.find(e => e.id === activeEpochId.value);
});

watch(detailedWorld, newWorld => {
  if (newWorld) {
    activeEpochId.value = newWorld.currentEpochId;
  } else {
    activeEpochId.value = null;
  }
});

watch(starmapContainer, newContainer => {
  if (newContainer && !starMapService) {
    console.log('[WorldSelection] starmapContainer is now available. Initializing StarMapService.');
    starMapService = new StarMapService(newContainer);

    // If worlds are already loaded, create stars immediately
    if (parsedWorlds.value.length > 0) {
      console.log('[WorldSelection] Worlds already present, calling createStars from container watch.');
      starMapService.createStars(parsedWorlds.value, selectableWorldIds.value);
    }
  }
});

onMounted(async () => {
  console.log('[WorldSelection] Component Mounted.');
  // isLoading.value = true; // 不再在这里控制加载状态
  await actions.fetchReincarnationWorlds();
  selectRandomWorlds();
  if (starMapService) {
    starMapService.createStars(parsedWorlds.value, selectableWorldIds.value);
  }
  isLoading.value = false; // 首次加载时，在获取完世界后结束加载
});

onUnmounted(() => {
  starMapService?.destroy();
});

watch(
  parsedWorlds,
  newWorlds => {
    console.log(`[WorldSelection] Parsed worlds watcher triggered: ${newWorlds.length} worlds.`);
    if (newWorlds.length > 0) {
      // if (isLoading.value) { // 不再在这里控制加载状态
      //   isLoading.value = false;
      // }
      // 函数已改为同步，不再需要 await
      selectRandomWorlds();

      // The service might not be ready yet, the starmapContainer watcher will handle creation
      if (starMapService) {
        console.log('[WorldSelection] Service exists, calling createStars from worlds watch.');
        starMapService.createStars(newWorlds, selectableWorldIds.value);
      }
    }
  },
  { deep: true },
);

// 关键修复：直接监听轮回状态的变化
watch(isSimulationRunning, (isRunning, wasRunning) => {
  // 当轮回从“进行中”变为“已结束”时，重新触发世界选择
  if (wasRunning && !isRunning) {
    console.log('[WorldSelection] Simulation has ended. Re-selecting random worlds.');
    selectRandomWorlds();
  }
});

const prepareReincarnation = (world: any) => {
  if (!isSimulationRunning.value) {
    actions.triggerIdentityWorkflow(world.originalId);
    detailedWorld.value = null;
  }
};

const adjustSpeed = (delta: number) => {
  const newLevel = speedLevel.value + delta;
  if (newLevel >= 0 && newLevel < speedLevels.length) {
    speedLevel.value = newLevel;
    if (starMapService) {
      starMapService.setSpeedMultiplier(speedLevels[speedLevel.value]);
    }
  }
};

watch(
  speedLevel,
  newLevel => {
    if (starMapService) {
      starMapService.setSpeedMultiplier(speedLevels[newLevel]);
    }
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
@use '../../../styles/theme/variables' as *;
@use '../../../styles/theme/mixins' as *;

.world-selection-container {
  // Ensure the container itself doesn't create scrollbars
  overflow: hidden;
}

.star-map-canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  cursor: grab;
  &:active {
    cursor: grabbing;
  }
}

.unselectable-notice {
  text-align: center;
  color: $color-grey-stone;
  font-style: italic;
}

.map-controls {
  position: absolute;
  bottom: 20px;
  right: 20px; /* Aligned to the right */
}

.speed-controls-overlay {
  position: absolute;
  top: 50%;
  left: 30px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 10;

  .control-btn {
    position: relative;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: transparent;
    border: 1px solid rgba($color-gold-liu, 0.4);
    color: $color-gold-pale;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    transition: all 0.3s ease;
    @include flex-center;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      height: 80%;
      border-radius: 50%;
      border: 1px solid rgba($color-cyan-tian, 0.5);
      transition: all 0.3s ease;
    }

    &:hover {
      border-color: $color-gold-liu;
      color: $color-white-moon;
      box-shadow: 0 0 10px rgba($color-gold-liu, 0.5);

      &::before {
        transform: translate(-50%, -50%) scale(1.2);
        opacity: 0;
      }
    }
  }

  .speed-bar-container {
    width: 8px;
    height: 100px;
    background: rgba($color-black-void, 0.5);
    border-radius: 4px;
    position: relative;
    border: 1px solid rgba($color-gold-liu, 0.2);
    overflow: hidden;
    display: flex;
    flex-direction: column-reverse; /* Fill from bottom */
  }

  .speed-bar-fill {
    width: 100%;
    background: linear-gradient(to top, $color-cyan-tian, $color-gold-pale);
    transition: height 0.3s ease;
  }
}

.epoch-tabs {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;

  button {
    padding: $spacing-xs $spacing-md;
    border: 1px solid rgba($color-cyan-tian, 0.3);
    background-color: transparent;
    color: $color-grey-stone;
    border-radius: $border-radius-sm;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: rgba($color-cyan-tian, 0.1);
      border-color: $color-cyan-tian;
      color: $color-white-moon;
    }

    &.active {
      background-color: $color-cyan-tian;
      border-color: $color-cyan-tian;
      color: $color-black-void;
      font-weight: bold;
    }
  }
}

.detail-item {
  ul {
    list-style-type: none;
    padding-left: $spacing-md;
    margin: $spacing-sm 0 0 0;
  }

  li {
    color: $color-white-moon;
    font-size: $font-size-small;
    line-height: 1.6;
  }
}
</style>
