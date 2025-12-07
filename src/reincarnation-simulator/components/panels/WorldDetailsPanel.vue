<template>
  <div class="panel-wrapper world-detail-panel-content" v-if="world && activeEpoch">
    <div class="scroll-container">
      <!-- 元规则 -->
      <section class="world-section">
        <h3 class="section-title">元规则</h3>
        <div class="rules-grid">
          <div class="rule-item">
            <div class="rule-name">宇宙蓝图</div>
            <div class="rule-value">{{ world.元规则.宇宙蓝图 }}</div>
          </div>
          <div class="rule-item">
            <div class="rule-name">物理尺度</div>
            <div class="rule-value">{{ world.元规则.物理尺度 }}</div>
          </div>
        </div>
      </section>

      <!-- 纪元切换 -->
      <section class="world-section epoch-selection">
        <h3 class="section-title">内容详情</h3>
        <div class="tabs-container main-tabs">
          <button class="epoch-tab" :class="{ active: activeTab === 'details' }" @click="activeTab = 'details'">
            纪元详情
          </button>
          <button class="epoch-tab" :class="{ active: activeTab === 'summary' }" @click="activeTab = 'summary'">
            世界摘要
          </button>
        </div>
      </section>

      <div v-if="activeTab === 'summary'" class="summary-content" v-html="worldSummary"></div>

      <template v-if="activeTab === 'details' && activeEpoch">
        <!-- 纪元规则 -->
        <section class="world-section">
          <div class="epoch-header">
            <h3 class="section-title">纪元: {{ activeEpoch.纪元名称 }}</h3>
            <p class="epoch-overview">{{ activeEpoch.纪元概述 }}</p>
          </div>
          <div class="rules-grid">
            <div class="rule-item">
              <div class="rule-name">世界能级</div>
              <div class="rule-value">{{ activeEpoch.规则.世界能级 }}</div>
            </div>
            <div class="rule-item">
              <div class="rule-name">时间流速</div>
              <div class="rule-value">{{ activeEpoch.规则.时间流速 }}x</div>
            </div>
            <div class="rule-item">
              <div class="rule-name">空间稳定性</div>
              <div class="rule-value">{{ activeEpoch.规则.空间稳定性 }}%</div>
            </div>
            <div class="rule-item">
              <div class="rule-name">生命位格</div>
              <div class="rule-value">{{ activeEpoch.规则.生命位格.基准值 }}</div>
            </div>
          </div>
        </section>

        <!-- 力量体系 -->
        <section class="world-section">
          <h3 class="section-title">力量体系</h3>
          <p class="system-overview">{{ activeEpoch.力量体系.体系概述 }}</p>


          <div class="subsection">
            <h4 class="subsection-title">境界定义</h4>
            <div class="ladder-container">
              <ul class="境界-ladder">
                <li v-for="level in 境界定义Array" :key="level.名称" class="ladder-step" @click="showRealmDetails(level)">
                  <span class="level-energy">能级 {{ level.能级 }}</span>
                  <span class="level-name">{{ level.名称 }}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
  <div v-else class="panel-wrapper loading-state">加载世界信息中...</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { lorebookService } from '../../services/LorebookService';
import { detailModalService } from '../../services/DetailModalService';
import { avatarWorld, mainWorld } from '../../store/getters';
import type { Epoch, World } from '../../types';
import RealmDetailCard from '../common/RealmDetailCard.vue';

const props = defineProps<{
  worldType: 'mainWorld' | 'avatarWorld';
}>();

const activeTab = ref('details');
const worldSummary = ref('加载摘要中...');

const world = computed<World | null>(() => {
  return props.worldType === 'mainWorld' ? mainWorld.value : avatarWorld.value;
});

const availableEpochs = computed(() => {
  if (!world.value || !world.value.历史纪元) return [];
  return Object.values(world.value.历史纪元).filter(epoch => typeof epoch === 'object' && epoch.纪元ID);
});

const selectedEpochId = ref<string | null>(null);

onMounted(async () => {
  const entry = await lorebookService.readFromLorebook('主世界摘要');
  if (entry) {
    // 将分隔符替换为HTML换行，并确保每个条目都是一个独立的段落
    worldSummary.value = entry
      .split('\n\n---\n\n')
      .map(block => `<p>${block.replace(/\n/g, '<br>')}</p>`)
      .join('');
  } else {
    worldSummary.value = '未能找到主世界摘要。';
  }
});

watch(
  world,
  newWorld => {
    if (newWorld) {
      selectedEpochId.value = newWorld.元规则.当前纪元ID || availableEpochs.value[0]?.纪元ID || null;
    }
  },
  { immediate: true },
);

const activeEpoch = computed<Epoch | null>(() => {
  if (!world.value || !selectedEpochId.value) return null;
  return (world.value.历史纪元 as any)[selectedEpochId.value] || null;
});

const 境界定义Array = computed(() => {
  if (!activeEpoch.value?.力量体系?.境界定义) return [];
  const definitions = activeEpoch.value.力量体系.境界定义;
  return Object.keys(definitions)
    .filter(key => key !== '$meta')
    .map(key => (definitions as any)[key])
    .sort((a, b) => a.能级 - b.能级);
});

const showRealmDetails = (realm: any) => {
 if (!realm) return;
 detailModalService.show(realm.名称, RealmDetailCard, { realm });
};
</script>

<style lang="scss" scoped>
.world-detail-panel-content {
  color: #e0e0e0;
  padding: 16px;
  height: 100%;
  overflow: hidden;
  background: transparent;
  font-family: 'Noto Sans SC', sans-serif;
}

.scroll-container {
  height: 100%;
  overflow-y: auto;
  padding-right: 12px;
}

.world-section {
  margin-bottom: 24px;
}
.world-section:last-child {
  margin-bottom: 0;
}

.epoch-header {
  text-align: center;
  margin-bottom: 16px;
}
.epoch-header .section-title {
  margin-bottom: 8px;
}
.epoch-header .epoch-overview {
  font-size: 0.9em;
  color: #a0a0a0;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.5;
}

.section-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.5em;
  color: #f0e6d2;
  text-align: center;
  margin-bottom: 16px;
  text-shadow: 0 0 10px rgba(184, 134, 11, 0.5);
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.rule-item {
  background-color: rgba(40, 42, 58, 0.7);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid rgba(17, 233, 225, 0.2);
}

.rule-item .rule-name {
  font-size: 0.8em;
  color: #a0a0a0;
  margin-bottom: 8px;
}

.rule-item .rule-value {
  font-size: 1.25em;
  font-weight: bold;
  color: #82d8d8;
}

.system-overview {
  font-size: 1em;
  line-height: 1.6;
  text-align: justify;
  margin-bottom: 16px;
  padding: 12px;
  background-color: rgba(10, 10, 15, 0.3);
  border-radius: 4px;
}

.subsection-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.25em;
  color: #b8860b;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(184, 134, 11, 0.3);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  background-color: rgba(17, 233, 225, 0.2);
  color: #82d8d8;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
}

.ladder-container {
  background: linear-gradient(to top, rgba(10, 10, 15, 0.5) 0%, transparent 100%);
  padding: 12px;
  border-radius: 8px;
}

.境界-ladder {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
}

.ladder-step {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 4px;
  background-color: rgba(28, 32, 53, 0.5);
  border-left: 3px solid #b8860b;
  cursor: help;
  transition: all 0.2s ease;
}

.ladder-step:hover {
  background-color: rgba(62, 71, 112, 0.5);
  transform: translateX(5px);
}

.ladder-step .level-name {
  font-size: 1.1em;
  font-weight: bold;
}

.ladder-step .level-energy {
  font-size: 0.8em;
  color: #a0a0a0;
  background-color: rgba(10, 10, 15, 0.5);
  padding: 4px 8px;
  border-radius: 4px;
}

.epoch-selection {
  .tabs-container {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .epoch-tab {
    background-color: rgba(40, 42, 58, 0.7);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(17, 233, 225, 0.2);
    color: #a0a0a0;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .epoch-tab.active {
    color: #82d8d8;
    border-color: #11e9e1;
    background-color: rgba(17, 233, 225, 0.2);
  }

  .epoch-tab:hover:not(.active) {
    background-color: rgba(62, 71, 112, 0.3);
  }
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-family: 'Noto Serif SC', serif;
  color: #f0e6d2;
}
.summary-content {
  padding: 16px;
  line-height: 1.7;
  white-space: normal; /* 确保长文本能正常换行 */
}
:deep(.summary-content p) {
  margin-bottom: 1.5em; /* 增加段落间距 */
}
:deep(.summary-content p:last-child) {
  margin-bottom: 0;
}
</style>
