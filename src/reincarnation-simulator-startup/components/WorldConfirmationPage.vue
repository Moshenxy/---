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
import { ref, onMounted } from 'vue';
import { readFromLorebook } from '../services/LorebookService';
import { parseWorldLoreForMap } from '../services/WorldParser';
import WorldInfoCard from './WorldInfoCard.vue';

const worldData = ref(null);
const loadingMessage = ref('正在加载世界数据...');

onMounted(async () => {
  try {
    const content = await readFromLorebook('主世界', true); // Force refresh
    if (content) {
      const parsedData = parseWorldLoreForMap(content);
      if (parsedData) {
        worldData.value = parsedData;
      } else {
        loadingMessage.value = '解析世界数据失败，格式可能不正确。';
      }
    } else {
      loadingMessage.value = '未能加载主世界数据，可能是世界书条目不存在。请返回上一步重试。';
    }
  } catch (error) {
    console.error('加载并解析世界数据时出错:', error);
    loadingMessage.value = '解析世界数据时发生错误，请检查控制台获取详细信息。';
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
