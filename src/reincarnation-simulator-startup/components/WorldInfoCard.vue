<template>
  <div class="world-info-card" v-if="worldData">
    <section class="card-section">
      <h3 class="section-title">基础信息</h3>
      <p><strong>ID:</strong> {{ worldData.基础信息?.ID }}</p>
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
        <h3 class="section-title">历史纪元</h3>
        <div v-for="epoch in Object.values(worldData.历史纪元)" :key="epoch.纪元ID" class="epoch-details">
            <p><strong>纪元ID:</strong> {{ epoch.纪元ID }}</p>
            <p><strong>纪元名称:</strong> {{ epoch.纪元名称 }}</p>
            <div v-if="epoch.力量体系" class="subsection">
                <h4 class="subsection-title">力量体系</h4>
                <p>{{ epoch.力量体系.体系概述 }}</p>
                <div v-if="epoch.力量体系.专长与流派">
                    <h5>专长与流派:</h5>
                    <ul class="tags-container">
                        <li v-for="school in epoch.力量体系.专长与流派" :key="school.流派名称" class="tag">{{ school.流派名称 }}</li>
                    </ul>
                </div>
                <div v-if="epoch.力量体系.属性模板">
                    <h5>属性模板:</h5>
                    <ul>
                        <li v-for="attr in epoch.力量体系.属性模板" :key="attr.属性">
                            <strong>{{ attr.属性 }}:</strong> {{ attr.描述 }}
                        </li>
                    </ul>
                </div>
                <div v-if="epoch.力量体系.境界定义">
                    <h5>境界定义:</h5>
                    <ul class="level-list">
                        <li v-for="level in Object.values(epoch.力量体系.境界定义).filter(item => typeof item === 'object')" :key="level.名称" class="level-item">
                           <div @click="toggleLevel(level)" class="level-header">
                               <span>能级 {{ level.能级 }}: {{ level.名称 }}</span>
                               <span>{{ expandedLevels[level.名称] ? '[-]' : '[+]' }}</span>
                           </div>
                           <div v-if="expandedLevels[level.名称]" class="level-details">
                               <p><strong>描述:</strong> {{ level.描述 }}</p>
                               <div v-if="level.解锁系统">
                                   <p><strong>解锁系统:</strong> {{ level.解锁系统.名称 }} - {{ level.解锁系统.描述 }}</p>
                               </div>
                               <div v-if="level.晋升需求">
                                   <p><strong>晋升需求:</strong></p>
                                   <ul>
                                       <li v-for="(req, index) in Object.values(level.晋升需求).filter(item => typeof item === 'object')" :key="index">
                                           {{ req.条件.描述 }}
                                       </li>
                                   </ul>
                               </div>
                           </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  worldData: Object,
});

const expandedLevels = ref({});

const toggleLevel = (level) => {
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
.subsection-title {
    color: #b8860b;
    font-size: 1.1rem;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
}
.tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    list-style: none;
    padding: 0;
}
.tag {
    background-color: rgba(17, 233, 225, 0.2);
    color: #82d8d8;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8em;
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
</style>