<template>
  <div class="world-state-panel">
    <div class="panel-section">
      <div class="section-title">世界状态</div>
      <div class="state-list">
        <AttributeDisplay name="当前时间" :value="currentTime" />
        <AttributeDisplay name="季节" :value="worldState?.季节 || 'N/A'" />
        <AttributeDisplay name="天气" :value="worldState?.天气 || 'N/A'" />
        <AttributeDisplay name="温度" :value="`${worldState?.温度 || 'N/A'}°C`" />
        <AttributeDisplay name="经济指数" :value="worldState?.经济指数 || 0" />
        <AttributeDisplay name="流行趋势" :value="worldState?.流行趋势 || 'N/A'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import AttributeDisplay from '../components/AttributeDisplay.vue';

interface WorldState {
  当前时间: {
    年: number;
    月: number;
    日: number;
    时: number;
    分: number;
    星期: string;
  };
  季节: string;
  天气: string;
  温度: number;
  经济指数: number;
  流行趋势: string;
}

const worldState = ref<WorldState | null>(null);

const currentTime = computed(() => {
  if (!worldState.value) return '';
  const time = worldState.value.当前时间;
  return `${time.年}-${time.月}-${time.日} ${time.时}:${time.分} (${time.星期})`;
});

onMounted(() => {
  // Mock data for display purposes
  worldState.value = {
    当前时间: {
      年: 2024,
      月: 9,
      日: 1,
      时: 8,
      分: 0,
      星期: '周一',
    },
    季节: '秋',
    天气: '晴',
    温度: 22,
    经济指数: 100,
    流行趋势: '复古Y2K穿搭',
  };
});
</script>

<style lang="scss" scoped>
.world-state-panel {
  padding: 15px;
}

.panel-section {
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #eae6dd;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #3a3f4b;
  margin-bottom: 12px;
}

.state-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
