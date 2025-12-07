<template>
  <div class="detail-tab-content grid-layout">
    <div class="detail-item full-width">
      <strong class="detail-key">基础潜力</strong>
      <AttributeGrid :attributes="npc.基础潜力" />
    </div>
    <div class="detail-item full-width">
      <strong class="detail-key">战斗参数</strong>
      <AttributeGrid :attributes="npc.战斗参数" />
    </div>
    <div class="detail-item full-width">
      <strong class="detail-key">世界专属属性</strong>
      <ObjectRenderer :data="npc.世界专属属性" />
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
import { get } from 'lodash';
import { Character } from '../../../types';
import { store } from '../../../store';
import { detailModalService } from '../../../services/DetailModalService';
import ArtDetail from './ArtDetail.vue';
import TalentDetail from './TalentDetail.vue';
import AttributeGrid from '../AttributeGrid.vue';
import ObjectRenderer from '../ObjectRenderer.vue';

const props = defineProps<{ npc: Character }>();

const talents = computed(() => {
  const database = store.worldState?.数据库;
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
  const database = store.worldState?.数据库;
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
  const artTemplate = (store.worldState?.数据库?.技艺 as Record<string, any>)?.[art.id];
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
