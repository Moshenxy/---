<template>
  <div class="detail-tab-content grid-layout">
    <div v-if="npc.属性" class="detail-item full-width">
      <strong class="detail-key">属性</strong>
      <AttributeGrid :attributes="npc.属性" />
    </div>
    <div class="detail-item full-width">
      <strong class="detail-key">人格内核</strong>
      <div v-if="npc.人格内核" class="kernel-content">
        <div class="kernel-section">
          <h5 class="kernel-title">标识符</h5>
          <p class="kernel-text identifier">{{ npc.人格内核.标识符 }}</p>
        </div>
        <div class="kernel-section">
          <h5 class="kernel-title">公开行为逻辑</h5>
          <p class="kernel-text">{{ npc.人格内核.行为逻辑.公开模式 }}</p>
        </div>
        <div class="kernel-section">
          <h5 class="kernel-title">行为剖面</h5>
          <ul class="profile-list">
            <li v-for="(profile, index) in npc.人格内核.行为剖面" :key="index" class="profile-item">
              <strong class="profile-context" @click="toggleProfile(index)">
                情境: {{ profile.情境 }}
                <span class="toggle-icon" :class="{ 'is-open': expandedProfiles[index] }">▶</span>
              </strong>
              <div v-if="expandedProfiles[index]" class="profile-details">
                <p class="profile-behavior"><span>行为:</span> {{ profile.行为模式 }}</p>
                <p class="profile-motivation"><span>动机:</span> {{ profile.动机解释 }}</p>
              </div>
            </li>
          </ul>
        </div>
        <div v-if="npc.人格内核.对话风格" class="kernel-section">
          <h5 class="kernel-title">对话风格</h5>
          <div class="dialogue-style">
            <p v-if="npc.人格内核.对话风格.口头禅"><strong>口头禅:</strong> {{ npc.人格内核.对话风格.口头禅 }}</p>
            <div v-if="npc.人格内核.对话风格.常用语?.length">
              <strong>常用语:</strong>
              <div class="tags-container">
                <span v-for="phrase in npc.人格内核.对话风格.常用语" :key="phrase" class="tag phrase-tag">{{ phrase }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="placeholder">无</div>
    </div>
    <div class="detail-item full-width">
      <strong class="detail-key">技能</strong>
      <div v-if="npc.技能 && Object.keys(npc.技能).length > 0" class="skills-list">
        <div v-for="(skill, skillName) in npc.技能" :key="skillName" class="skill-item" @click="showSkillDetail(skill, skillName as string)">
          <div class="skill-header">
            <h3>{{ skillName }}</h3>
            <div class="skill-level">等级 {{ skill.等级 }}</div>
          </div>
        </div>
      </div>
      <div v-else class="placeholder">无</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { detailModalService } from '../../../services/DetailModalService';
import { type Npc, type 技能 as Skill } from '../../../types';
import AttributeGrid from '../AttributeGrid.vue';
import ObjectRenderer from '../ObjectRenderer.vue';

const props = defineProps<{ npc: Npc }>();

const expandedProfiles = ref<Record<number, boolean>>({});

const toggleProfile = (index: number) => {
  expandedProfiles.value[index] = !expandedProfiles.value[index];
};

// Reset expanded state when npc changes
watch(() => props.npc, () => {
  expandedProfiles.value = {};
}, { immediate: true });


const showSkillDetail = (skill: Skill, skillName: string) => {
  // Assuming a simple modal for now, this can be expanded
  detailModalService.show(skillName, ObjectRenderer, { data: skill });
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

.personality-kernel {
  .kernel-content {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }
  .kernel-section {
    .kernel-title {
      font-family: $font-family-title;
      font-size: $font-size-base;
      color: $color-gold-pale;
      margin-bottom: $spacing-sm;
      border-bottom: 1px solid rgba($color-gold-liu, 0.2);
      padding-bottom: $spacing-sm;
    }
    .kernel-text {
      white-space: pre-wrap;
      &.identifier {
        font-style: italic;
        color: $color-cyan-tian;
      }
    }
  }
}

.profile-list {
  list-style: none;
  padding-left: $spacing-md;
  .profile-item {
    margin-bottom: $spacing-md;
    border-left: 3px solid rgba($color-gold-liu, 0.3);
    padding-left: $spacing-md;
    .profile-context {
      font-weight: bold;
      color: $color-white-moon;
    }
    .profile-behavior, .profile-motivation {
      font-size: $font-size-small;
      color: $color-grey-stone;
      span {
        color: $color-gold-pale;
        font-weight: bold;
      }
    }
  }
}

.dialogue-style {
  p {
    margin-bottom: $spacing-sm;
  }
  .phrase-tag {
    background-color: rgba($color-cyan-tian, 0.15);
    color: $color-cyan-tian;
    cursor: default;
  }
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
.personality-kernel {
  .kernel-content {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }
  .kernel-section {
    .kernel-title {
      font-family: $font-family-title;
      font-size: $font-size-base;
      color: $color-gold-pale;
      margin-bottom: $spacing-sm;
      border-bottom: 1px solid rgba($color-gold-liu, 0.2);
      padding-bottom: $spacing-sm;
    }
    .kernel-text {
      white-space: pre-wrap;
      &.identifier {
        font-style: italic;
        color: $color-cyan-tian;
      }
    }
  }
}

.profile-list {
  list-style: none;
  padding-left: $spacing-md;
  .profile-item {
    margin-bottom: $spacing-md;
    border-left: 3px solid rgba($color-gold-liu, 0.3);
    padding-left: $spacing-md;
    .profile-context {
      font-weight: bold;
      color: $color-white-moon;
    }
    .profile-behavior, .profile-motivation {
      font-size: $font-size-small;
      color: $color-grey-stone;
      span {
        color: $color-gold-pale;
        font-weight: bold;
      }
    }
  }
  .profile-details {
    padding-top: $spacing-sm;
  }
  .toggle-icon {
    display: inline-block;
    transition: transform 0.2s ease-in-out;
    font-size: 0.8em;
    margin-left: $spacing-sm;
    &.is-open {
      transform: rotate(90deg);
    }
  }
}

.dialogue-style {
  p {
    margin-bottom: $spacing-sm;
  }
  .phrase-tag {
    background-color: rgba($color-indigo-deep, 0.3);
    color: $color-white-moon;
    cursor: default;
  }
}
</style>
