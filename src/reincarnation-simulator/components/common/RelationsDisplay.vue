<template>
  <div class="relations-display">
    <ul class="relation-list">
      <li v-for="(relation, id) in relations" :key="id" class="relation-item">
        <div class="relation-header" @click="toggleExpand(id)">
          <span class="relation-name">{{ getNpcNameById(String(id)) }}</span>
          <div class="relation-tags">
            <span v-for="tag in getFormattedTags(relation)" :key="tag" class="tag">{{ tag }}</span>
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { get } from 'lodash';
import { npcService } from '../../services/NpcService';
import ProgressBar from './ProgressBar.vue';
import { store } from '../../store';

const vectorGroups = [
  {
    title: '认知层',
    vectors: [
      { label: '可靠度', path: '认知层.可靠度', min: -100, max: 100, color: '#3a8f9d' },
      { label: '能力评价', path: '认知层.能力评价', min: -100, max: 100, color: '#3a8f9d' },
      { label: '威胁度', path: '认知层.威胁度', min: 0, max: 100, color: '#e53935' },
    ],
  },
  {
    title: '情感层',
    vectors: [
      { label: '亲近感', path: '情感层.亲近感', min: -100, max: 100, color: '#c74343' },
      { label: '仰慕度', path: '情感层.仰慕度', min: 0, max: 100, color: '#c74343' },
    ],
  },
  {
    title: '利益层',
    vectors: [
      { label: '资源价值', path: '利益层.资源价值', min: 0, max: 100, color: '#d4af37' },
      { label: '合作潜力', path: '利益层.合作潜力', min: 0, max: 100, color: '#d4af37' },
      { label: '利益冲突', path: '利益层.利益冲突', min: 0, max: 100, color: '#e53935' },
    ],
  },
];

const props = defineProps<{
  subjectId: string;
}>();

const relations = computed(() => {
  if (!props.subjectId || !store.worldState?.因果之网) {
    return {};
  }
  return store.worldState.因果之网[props.subjectId] || {};
});

const { getNpcNameById } = npcService;

const expandedRelation = ref<string | null>(null);

function toggleExpand(name: string | number) {
  const relationName = String(name);
  if (expandedRelation.value === relationName) {
    expandedRelation.value = null;
  } else {
    expandedRelation.value = relationName;
  }
}

function getFormattedTags(relation: any): string[] {
  const causeTags = get(relation, '因果标签', {});
  return Object.values(causeTags)
    .filter((tag: any) => typeof tag === 'object' && tag !== null && tag.标签)
    .map((tag: any) => tag.标签);
}
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

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
  background-color: rgba($color-white-moon, 0.1);
  color: $color-grey-stone;
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
</style>
