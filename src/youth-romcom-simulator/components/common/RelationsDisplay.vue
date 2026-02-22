<template>
  <div class="relations-display">
    <ul v-if="Object.keys(relations).length > 0" class="relation-list">
      <li v-for="(relation, id) in relations" :key="id" class="relation-item">
        <div class="relation-header" @click="toggleExpand(id)">
          <span class="relation-name">{{ getNpcNameById(String(id)) }}</span>
          <div class="relation-tags">
            <span class="tag">{{ relation.阶段.亲密度 }}</span>
          </div>
        </div>
        <div v-if="expandedRelation === id" class="relation-details">
          <div v-for="group in vectorGroups" :key="group.title" class="vector-group">
            <strong class="group-title">{{ group.title }}</strong>
            <ProgressBar
              v-for="vector in group.vectors"
              :key="vector.label"
              :label="vector.label"
              :value="get(relation, vector.path, 0)"
              :min="vector.min"
              :max="vector.max"
              :color="vector.color"
            />
          </div>
        </div>
      </li>
    </ul>
    <div v-else class="placeholder">暂无人际关系信息</div>
  </div>
</template>

<script setup lang="ts">
import { get } from 'lodash';
import { computed, ref } from 'vue';
import { npcService } from '../../services/NpcService';
import { store } from '../../store';
import ProgressBar from './ProgressBar.vue';
import type { 关系 } from '../../types';

const vectorGroups = [
  {
    title: '关系数值',
    vectors: [
      { label: '亲密度', path: '数值.亲密度', min: -100, max: 200, color: '#c74343' },
      { label: '支配度', path: '数值.支配度', min: -100, max: 200, color: '#3a8f9d' },
      { label: '信赖度', path: '数值.信赖度', min: -100, max: 200, color: '#d4af37' },
    ],
  },
];

const props = defineProps<{
  subjectId: string;
}>();

const relations = computed(() => {
  const allRelations = store.worldState?.关系 || {};
  const subjectRelations: Record<string, 关系> = {};

  if (!props.subjectId) return {};

  // 只处理主体是 subjectId 的情况 (仅显示主体对客体的关系)
  const primaryRelations = (allRelations as Record<string, any>)[props.subjectId];
  if (primaryRelations) {
    for (const targetId in primaryRelations) {
      if (typeof primaryRelations[targetId] === 'object') {
        subjectRelations[targetId] = primaryRelations[targetId];
      }
    }
  }

  return subjectRelations;
});

const { getNpcNameById } = npcService;

const expandedRelation = ref<string | null>(null);

function toggleExpand(id: string | number) {
  const relationId = String(id);
  if (expandedRelation.value === relationId) {
    expandedRelation.value = null;
  } else {
    expandedRelation.value = relationId;
  }
}

// This function is kept for potential future use, but the new structure doesn't have these tags.
function getFormattedTags(relation: any): string[] {
  const causeTags = get(relation, '因果标签', {});
  return Object.values(causeTags)
    .filter((tag: any) => typeof tag === 'object' && tag !== null && tag.标签)
    .map((tag: any) => tag.标签);
}
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

.relations-display {
  padding-top: $spacing-md;
}

.relation-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.relation-item {
  border-bottom: 1px solid rgba($color-gold-liu, 0.1);
  padding: $spacing-md 0;
}

.relation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.relation-name {
  font-weight: bold;
  color: $color-white-moon;
}

.relation-tags .tag {
  font-size: $font-size-small;
  background-color: rgba($color-cyan-tian, 0.2);
  color: $color-cyan-tian;
  padding: 2px 6px;
  border-radius: $border-radius-sm;
  margin-left: $spacing-sm;
}

.relation-details {
  margin-top: $spacing-md;
  padding: $spacing-md;
  background-color: rgba($color-black-void, 0.3);
  border-radius: $border-radius-md;
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-lg;
}

.vector-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.group-title {
  font-family: $font-family-title;
  color: $color-gold-pale;
  margin-bottom: $spacing-sm;
  border-bottom: 1px solid rgba($color-gold-liu, 0.2);
  padding-bottom: $spacing-sm;
}

.placeholder {
  color: $color-grey-stone;
  text-align: center;
  padding: $spacing-xl 0;
}
</style>
