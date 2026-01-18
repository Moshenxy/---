<template>
  <div class="detail-tab-content grid-layout">
    <div v-if="npc.基础潜力" class="detail-item full-width">
      <strong class="detail-key">基础潜力</strong>
      <AttributeGrid :attributes="npc.基础潜力" />
    </div>
    <div v-if="npc.战斗参数" class="detail-item full-width">
      <strong class="detail-key">战斗参数</strong>
      <AttributeGrid :attributes="npc.战斗参数" />
    </div>
    <div class="detail-item full-width">
      <strong class="detail-key">世界专属属性</strong>
      <ObjectRenderer :data="worldAttributes" />
    </div>
    <div class="detail-item full-width">
      <strong class="detail-key">天赋</strong>
      <div class="detail-value">
        <div v-if="talents.length > 0" class="tags-container">
          <span v-for="talent in talents" :key="talent.ID" class="tag talent-tag" @click="showTalentDetail(talent)">{{
            talent.名称
          }}</span>
        </div>
        <div v-else class="placeholder">无</div>
      </div>
    </div>
    <div class="detail-item full-width">
      <strong class="detail-key">技艺</strong>
      <div v-if="skills.length > 0" class="skills-list">
        <div v-for="skill in skills" :key="skill.id" class="skill-item" @click="showArtDetail(skill)">
          <div class="skill-header">
            <h3>{{ skill.name }}</h3>
            <div class="skill-level">等级 {{ skill.level }} ({{ skill.title }})</div>
          </div>
        </div>
      </div>
      <div v-else class="placeholder">无</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { detailModalService } from '../../../services/DetailModalService';
import { store } from '../../../store';
import { Character } from '../../../types';
import AttributeGrid from '../AttributeGrid.vue';
import ObjectRenderer from '../ObjectRenderer.vue';
import ArtDetail from './ArtDetail.vue';
import TalentDetail from './TalentDetail.vue';

const props = defineProps<{ npc: Character }>();

const worldAttributes = computed(() => {
  const world = store.worldState?.世界?.[props.npc.所属世界];
  const npcAttributes = props.npc.世界专属属性;

  if (!npcAttributes) return {};
  if (!world) return npcAttributes;

  const currentEpochId = world.定义?.元规则?.当前纪元ID;
  if (!currentEpochId) return npcAttributes;

  const currentEpoch = (world.定义.历史纪元 as Record<string, any>)?.[currentEpochId];
  const attributeTemplates = currentEpoch?.力量体系?.属性模板;

  const resolvedAttributes: Record<string, any> = {};
  for (const attrId in npcAttributes) {
    if (attrId === '$meta') continue;

    const attributeValue = npcAttributes[attrId];
    
    // 如果属性值本身就是一个包含名称和描述的复杂对象
    if (typeof attributeValue === 'object' && attributeValue !== null && '名称' in attributeValue && '描述' in attributeValue) {
      // 使用它自己的名称作为key，并将整个对象作为value
      resolvedAttributes[attributeValue.名称] = attributeValue;
    } else {
      // 否则，回退到从模板查找名称
      const template = attributeTemplates ? (attributeTemplates as Record<string, any>)[attrId] : null;
      const attributeName = template?.名称 || attrId;
      resolvedAttributes[attributeName] = attributeValue;
    }
  }
  return resolvedAttributes;
});

const talents = computed(() => {
  const world = store.worldState?.世界?.[props.npc.所属世界];
  const database = world?.数据库;
  if (!props.npc.天赋 || !database || !('天赋' in database)) return [];

  const talentDb = database.天赋 as Record<string, any>;
  if (!talentDb) return [];

  return Object.keys(props.npc.天赋)
    .map(talentId => {
      const talentData = talentDb[talentId];
      return talentData ? { ...talentData, ID: talentId } : null;
    })
    .filter(Boolean);
});

const skills = computed(() => {
  const world = store.worldState?.世界?.[props.npc.所属世界];
  const database = world?.数据库;
  if (!props.npc.技艺 || !database || !('技艺' in database)) return [];

  const npcArts = props.npc.技艺;
  const artDb = database.技艺 as Record<string, any>;
  if (!artDb) return [];
  const skillsList = [];

  for (const artId in npcArts) {
    const artData = (npcArts as any)[artId];
    const artTemplate = artDb[artId];

    if (artTemplate && artTemplate.等级体系) {
      const levelKey = `level_${artData.等级}`;
      const currentLevelInfo = artTemplate.等级体系[levelKey];
      skillsList.push({
        id: artId,
        name: artTemplate.名称,
        level: artData.等级,
        title: currentLevelInfo ? currentLevelInfo.称号 : '',
      });
    }
  }
  return skillsList;
});

const showTalentDetail = (talent: any) => {
  detailModalService.show(talent.名称, TalentDetail, { talent });
};

const showArtDetail = (art: any) => {
  const world = store.worldState?.世界?.[props.npc.所属世界];
  const artTemplate = (world?.数据库?.技艺 as Record<string, any>)?.[art.id];
  if (artTemplate) {
    detailModalService.show(art.name, ArtDetail, { art: artTemplate });
  }
};
</script>

<style lang="scss" scoped>
@use '../../../styles/theme/variables' as *;
@use '../../../styles/theme/mixins' as *;

.grid-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-lg;
}

.detail-item {
  &.full-width {
    grid-column: 1 / -1;
  }
  .detail-key {
    color: $color-gold-pale;
    font-family: $font-family-title;
    font-size: $font-size-large;
    display: block;
    margin-bottom: $spacing-md;
  }
}

.placeholder {
  color: $color-grey-stone;
  font-style: italic;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.tag {
  display: inline-block;
  background-color: rgba($color-cyan-tian, 0.15);
  color: $color-cyan-tian;
  padding: 4px 8px;
  border-radius: $border-radius-sm;
}

.talent-tag {
  background-color: rgba($color-gold-liu, 0.2);
  color: $color-gold-pale;
  cursor: help;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.skill-item {
  background: rgba($color-black-void, 0.4);
  border-radius: $border-radius-sm;
  padding: $spacing-sm $spacing-md;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba($color-cyan-tian, 0.1);
  }
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: $font-size-base;
    color: $color-white-moon;
  }
}

.skill-level {
  font-size: $font-size-small;
  color: $color-grey-stone;
}
</style>
