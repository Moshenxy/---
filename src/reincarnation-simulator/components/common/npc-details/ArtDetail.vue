<template>
  <div class="art-detail">
    <h4 class="art-name">{{ art.名称 }}</h4>
    <div class="art-meta">
      <span><strong>关联潜力:</strong> {{ art.关联潜力 }}</span>
      <span><strong>等级上限:</strong> {{ art.等级上限 }}</span>
    </div>
    <p class="art-description">{{ art.描述 }}</p>
    <div class="effects">
      <p><strong>效果:</strong> {{ art.效果描述 }}</p>
      <p><strong>公式:</strong> {{ art.效果等级公式 }}</p>
    </div>

    <div class="skills-section" v-if="skills.length > 0">
      <h5>下属技能</h5>
      <ul>
        <li v-for="skill in skills" :key="skill.ID">
          <strong>{{ skill.名称 }} ({{ skill.类型 }})</strong>
          <p>{{ skill.描述 }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';
import { store } from '../../../store';

const props = defineProps<{
  art: any;
}>();

const skills = computed(() => {
  const database = store.worldState?.数据库;
  if (!database || !('技能' in database)) return [];
  const skillDb = database.技能 as Record<string, any>;
  return Object.values(skillDb).filter(skill => skill.关联技艺 === props.art.ID);
});
</script>

<style lang="scss" scoped>
@use '../../../styles/theme/variables' as *;

.art-detail {
  padding: $spacing-md;
  color: $color-white-moon;
}
.art-name {
  color: $color-gold-pale;
  font-family: $font-family-title;
  font-size: $font-size-h3;
  margin-top: 0;
  margin-bottom: $spacing-md;
  text-align: center;
}
.art-meta {
  display: flex;
  justify-content: center;
  gap: $spacing-xl;
  margin-bottom: $spacing-lg;
  color: $color-grey-stone;
  font-size: $font-size-small;
  span strong {
    color: $color-gold-liu;
  }
}
.art-description {
  font-style: italic;
  text-align: center;
  margin-bottom: $spacing-lg;
  color: $color-grey-stone;
}
.effects {
  background: rgba($color-black-void, 0.3);
  padding: $spacing-md;
  border-radius: $border-radius-sm;
  margin-bottom: $spacing-lg;
  p {
    margin: 0 0 $spacing-sm 0;
  }
  strong {
    color: $color-cyan-tian;
  }
}
.skills-section {
  margin-top: $spacing-xl;
  h5 {
    color: $color-gold-pale;
    font-family: $font-family-title;
    border-bottom: 1px solid rgba($color-gold-liu, 0.3);
    padding-bottom: $spacing-sm;
    margin-bottom: $spacing-md;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    margin-bottom: $spacing-md;
    strong {
      color: $color-white-moon;
    }
    p {
      margin: $spacing-xs 0 0 0;
      color: $color-grey-stone;
      font-size: $font-size-small;
    }
  }
}
</style>
