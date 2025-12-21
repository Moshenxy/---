<template>
  <div class="world-confirmation-page">
    <h1 class="main-title">世界已构筑</h1>
    <h2 class="subtitle">请确认最终的世界设定，然后开启你的轮回之旅。</h2>
    <div class="world-details-container">
      <WorldInfoCard v-if="worldData" :world-data="worldData" />
      <div v-else class="loading-state">
        <p>{{ loadingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import WorldInfoCard from './WorldInfoCard.vue';

const worldData = ref(null);
const loadingMessage = ref('正在从变量中加载主世界数据...');

onMounted(async () => {
  try {
    const messages = await TavernHelper.getChatMessages('0');
    const latestData = messages[0]?.data;

    if (latestData && latestData.stat_data && latestData.stat_data.世界) {
      const worlds = latestData.stat_data.世界;
      const mainWorldId = Object.keys(worlds).find(id => worlds[id]?.定义?.元规则?.定位 === '主世界');

      if (mainWorldId) {
        const mainWorldObject = worlds[mainWorldId];
        const mainEpochId = mainWorldObject.定义.元规则.当前纪元ID;
        const mainEpoch = mainWorldObject.定义.历史纪元[mainEpochId];

        // 直接构建一个传递给 props 的对象，不再需要复杂的适配器
        worldData.value = {
          基础信息: {
            ID: mainWorldId,
            名称: mainWorldObject.名称,
            描述: mainEpoch?.纪元概述 || '暂无描述',
          },
          元规则: mainWorldObject.定义.元规则,
          历史纪元: mainWorldObject.定义.历史纪元, // 传递原始的、完整的历史纪元对象
        };

        console.log('成功加载并传递主世界数据:', worldData.value);
      } else {
        loadingMessage.value = '未在变量中找到“定位”为“主世界”的世界。';
      }
    } else {
      loadingMessage.value = '未能从酒馆消息中加载“世界”变量，请确保已成功构筑世界。';
    }
  } catch (error) {
    console.error('加载并解析世界变量时出错:', error);
    loadingMessage.value = '加载世界变量时发生错误，请检查控制台获取详细信息。';
  }
});
</script>

<style lang="scss" scoped>
.world-confirmation-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  padding: 2rem;
  box-sizing: border-box;
}

.main-title {
  font-family: var(--font-family-title);
  font-size: 2.5rem;
  color: var(--color-gold-pale);
  margin-bottom: 0.5rem;
}

.subtitle {
  font-family: var(--font-family-main);
  font-size: 1.2rem;
  color: var(--color-cyan-tian);
  margin-bottom: 2rem;
}

.world-details-container {
  width: 100%;
  height: 60vh;
  max-width: 800px;
  background-color: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  overflow: auto;
  padding: 1rem;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-family: 'Noto Serif SC', serif;
  color: #f0e6d2;
}
</style>
