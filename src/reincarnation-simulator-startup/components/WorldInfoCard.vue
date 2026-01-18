<template>
  <div class="world-info-card" v-if="worldData">
    <section class="card-section">
      <h3 class="section-title">基础信息</h3>
      <p><strong>名称:</strong> {{ worldData.基础信息?.名称 }}</p>
      <p><strong>描述:</strong> {{ worldData.基础信息?.描述 }}</p>
    </section>

    <section class="card-section">
      <h3 class="section-title">元规则</h3>
      <p><strong>宇宙蓝图:</strong> {{ worldData.元规则?.宇宙蓝图 }}</p>
      <p><strong>物理尺度:</strong> {{ worldData.元规则?.物理尺度 }}</p>
      <p><strong>支持纪元穿越:</strong> {{ worldData.元规则?.支持纪元穿越 }}</p>
    </section>

    <section class="card-section" v-if="worldData.历史纪元">
      <h3 class="section-title">纪元详情</h3>
      <div v-for="(epoch, epochId) in worldData.历史纪元" :key="epochId" class="epoch-details">
        <h4>
          {{ epoch.纪元名称 }}
          <span v-if="epochId === worldData.元规则.当前纪元ID" class="current-epoch-tag">（当前纪元）</span>
        </h4>

        <!-- 如果是当前纪元，则显示全部详情 -->
        <template v-if="epochId === worldData.元规则.当前纪元ID">
          <!-- 内容 -->
          <div v-if="epoch.内容" class="subsection">
            <h5 class="subsection-title">内容</h5>
            <div v-if="epoch.内容.文明">
              <h6>文明:</h6>
              <p><strong>形态:</strong> {{ epoch.内容.文明.主流文明形态 }}</p>
              <p><strong>结构:</strong> {{ epoch.内容.文明.社会结构 }}</p>
            </div>
            <div v-if="epoch.内容.历史?.历史纪元">
              <h6>历史:</h6>
              <div v-for="(era, key) in epoch.内容.历史.历史纪元" :key="key">
                <p>
                  <strong>{{ era.纪元名称 }}:</strong> {{ era.简述 }}
                </p>
              </div>
            </div>
          </div>

          <!-- 规则 -->
          <div v-if="epoch.规则" class="subsection">
            <h5 class="subsection-title">规则</h5>
            <div v-if="epoch.规则.当前标签?.length" class="tag-group">
              <h6>当前标签:</h6>
              <div class="tags-container">
                <span v-for="tag in epoch.规则.当前标签" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </div>
            <div v-if="epoch.规则.核心法则 && Object.keys(epoch.规则.核心法则).length" class="tag-group">
              <h6>核心法则:</h6>
              <div class="tags-container">
                <Tooltip v-for="(law, key) in epoch.规则.核心法则" :key="key" :content="law.描述">
                  <span class="tag">{{ law.名称 }}</span>
                </Tooltip>
              </div>
            </div>
            <div v-if="epoch.规则.权柄 && Object.keys(epoch.规则.权柄).length" class="tag-group">
              <h6>权柄:</h6>
              <div class="tags-container">
                <Tooltip v-for="(auth, key) in epoch.规则.权柄" :key="key" :content="auth.描述">
                  <span class="tag">{{ auth.名称 }} ({{ auth.类型 }})</span>
                </Tooltip>
              </div>
            </div>
            <div v-if="epoch.规则.演化逻辑?.演化规则?.length">
              <h6>演化逻辑:</h6>
              <p>当前阶段: {{ epoch.规则.演化逻辑.当前阶段 }}</p>
              <ul>
                <li v-for="(rule, index) in epoch.规则.演化逻辑.演化规则" :key="index">{{ rule.描述 }}</li>
              </ul>
            </div>
          </div>

          <!-- 力量体系 -->
          <div v-if="epoch.力量体系" class="subsection">
            <h5 class="subsection-title">力量体系</h5>
            <p><strong>体系概述:</strong> {{ epoch.力量体系.体系概述 }}</p>
            <div v-if="epoch.力量体系.机制核心?.length" class="tag-group">
              <h6>机制核心:</h6>
              <ul>
                <li v-for="(core, index) in epoch.力量体系.机制核心" :key="index">{{ core }}</li>
              </ul>
            </div>
            <div
              v-if="
                epoch.力量体系.专长与流派 &&
                Object.keys(epoch.力量体系.专长与流派).filter(k => k !== '$meta').length > 0
              "
              class="tag-group"
            >
              <h6>专长与流派:</h6>
              <div class="tags-container">
                <Tooltip
                  v-for="school in Object.values(epoch.力量体系.专长与流派).filter(item => typeof item === 'object')"
                  :key="school.流派名称"
                  :content="school.核心理念 || ''"
                >
                  <span class="tag">{{ school.流派名称 }}</span>
                </Tooltip>
              </div>
            </div>
            <div
              v-if="
                epoch.力量体系.关键资源依赖 &&
                Object.keys(epoch.力量体系.关键资源依赖).filter(k => k !== '$meta').length > 0
              "
              class="tag-group"
            >
              <h6>关键资源依赖:</h6>
              <div class="tags-container">
                <span
                  v-for="resource in Object.values(epoch.力量体系.关键资源依赖).filter(
                    item => typeof item === 'string',
                  )"
                  :key="resource"
                  class="tag tag-resource"
                  >{{ resource }}</span
                >
              </div>
            </div>
            <div
              v-if="
                epoch.力量体系.属性模板 && Object.keys(epoch.力量体系.属性模板).filter(k => k !== '$meta').length > 0
              "
              class="tag-group"
            >
              <h6>属性模板:</h6>
              <div class="tags-container">
                <template v-for="(attr, key) in epoch.力量体系.属性模板" :key="key">
                  <Tooltip v-if="key !== '$meta'" :content="attr.描述 || ''">
                    <span class="tag">{{ attr.名称 }}</span>
                  </Tooltip>
                </template>
              </div>
            </div>
            <div v-if="epoch.力量体系.境界定义 && Object.keys(epoch.力量体系.境界定义).length">
              <h6>境界定义:</h6>
              <ul class="level-list">
                <li
                  v-for="level in Object.values(epoch.力量体系.境界定义).filter(item => typeof item === 'object')"
                  :key="level.名称"
                  class="level-item"
                >
                  <div @click="toggleLevel(level)" class="level-header">
                    <span>能级 {{ level.能级 }}: {{ level.名称 }}</span>
                    <span>{{ expandedLevels[level.名称] ? '[-]' : '[+]' }}</span>
                  </div>
                  <div v-if="expandedLevels[level.名称]" class="level-details">
                    <p><strong>描述:</strong> {{ level.描述 }}</p>
                    <div v-if="level.解锁系统 && level.解锁系统.名称 !== '无'">
                      <p><strong>解锁系统:</strong> {{ level.解锁系统.名称 }} - {{ level.解锁系统.描述 }}</p>
                    </div>
                    <div v-if="level.晋升需求 && level.晋升需求.条件">
                      <p><strong>晋升需求:</strong> {{ level.晋升需求.条件.描述 }}</p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </template>
        <!-- 否则，只显示摘要信息 -->
        <template v-else>
          <p v-if="epoch.纪元概述" class="epoch-summary">{{ epoch.纪元概述 }}</p>
          <p v-else-if="!epoch.可扮演" class="epoch-summary-locked">【此纪元尚未开启，更多信息等待在轮回中解锁...】</p>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Tooltip from './Tooltip.vue';

defineProps({
  worldData: Object,
});

const expandedLevels = ref({});

const toggleLevel = level => {
  expandedLevels.value[level.名称] = !expandedLevels.value[level.名称];
};
</script>

<style scoped>
.world-info-card {
  padding: 1rem;
  text-align: left;
}
.card-section {
  margin-bottom: 1.5rem;
}
.section-title {
  color: #b8860b;
  font-size: 1.2rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(184, 134, 11, 0.3);
  padding-bottom: 0.5rem;
}
p {
  margin: 0.5rem 0;
  line-height: 1.6;
}
strong {
  color: #c8aa7a;
}
.epoch-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.current-epoch-tag {
  color: var(--color-gold);
  font-size: 0.9em;
  margin-left: 0.5rem;
  font-weight: bold;
}
.epoch-summary {
  color: #aaa;
  font-style: italic;
}
.epoch-summary-locked {
  color: #666;
  font-style: italic;
}
.subsection {
  margin-top: 1rem;
}
.subsection-title {
  color: #b8860b;
  font-size: 1.1rem;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}
h6 {
  color: #c8aa7a;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin-bottom: 1rem;
}
.tag {
  background-color: rgba(17, 233, 225, 0.2);
  color: #82d8d8;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.9em;
  cursor: default;
}
.tag-resource {
  background-color: rgba(218, 165, 32, 0.2);
  color: #daa520;
}

ul {
  padding-left: 20px;
}
.level-list {
  list-style: none;
  padding-left: 0;
}
.level-item {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}
.level-header {
  padding: 0.5rem 1rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  font-weight: bold;
}
.level-details {
  padding: 0 1rem 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.tag-group {
  margin-bottom: 1rem;
}
</style>
