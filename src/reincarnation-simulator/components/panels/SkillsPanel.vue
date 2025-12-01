<template>
  <div class="skills-panel">
    <h2>技艺</h2>
    <div v-if="skills.length === 0" class="empty-state">
      <p>尚未掌握任何技艺。</p>
    </div>
    <div v-else class="skills-list">
      <div v-for="skill in skills" :key="skill.id" class="skill-item">
        <div class="skill-header">
          <h3>{{ skill.name }}</h3>
          <div class="skill-level">等级 {{ skill.level }}</div>
        </div>
        <p class="skill-description">{{ skill.description }}</p>
        <div class="skill-progress">
          <div class="progress-bar-wrapper">
            <progress :value="skill.exp" :max="skill.expToNextLevel"></progress>
            <span class="progress-text">{{ skill.exp }} / {{ skill.expToNextLevel }}</span>
          </div>
        </div>

        <div v-if="skill.associatedSkills && skill.associatedSkills.length > 0" class="associated-skills">
          <button @click="toggleSkills(skill.id)" class="associated-skills-title">
            相关技能
            <span :class="['arrow', { 'expanded': isExpanded(skill.id) }]"></span>
          </button>
          <ul v-if="isExpanded(skill.id)" class="associated-skills-list">
            <li v-for="activeSkill in skill.associatedSkills" :key="activeSkill.ID" class="associated-skill-item">
              <div class="skill-name"><strong>{{ activeSkill.名称 }}</strong> ({{ activeSkill.类型 }})</div>
              <div class="skill-detail skill-description-detail">{{ activeSkill.描述 }}</div>
              <div class="skill-detail"><strong>基础效果:</strong> {{ activeSkill.基础效果 }}</div>
              <div class="skill-detail"><strong>成长:</strong> {{ activeSkill.效果等级公式 }}</div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { playerSkills } from '../../store/getters';

const skills = computed(() => playerSkills.value);
const expandedSkills = ref<Record<string, boolean>>({});

const toggleSkills = (skillId: string) => {
  expandedSkills.value[skillId] = !expandedSkills.value[skillId];
};

const isExpanded = (skillId: string) => {
  return !!expandedSkills.value[skillId];
};
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.skills-panel {
  height: 100%;
  padding: $spacing-lg;
  box-sizing: border-box;
  overflow-y: auto;
  @include custom-scrollbar($color-gold-liu, transparent);
  
  h2 {
    font-family: $font-family-title;
    font-size: $font-size-h1;
    color: lighten($color-gold-pale, 10%);
    text-align: center;
    margin-bottom: $spacing-xl;
    text-shadow: 0 0 15px rgba($color-gold-liu, 0.7), 0 0 5px rgba($color-gold-liu, 0.5);
  }

  .empty-state {
    @include flex-center;
    height: 100%;
    color: $color-grey-stone;
    font-size: $font-size-large;
  }

  .skills-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }

  .skill-item {
    background: linear-gradient(145deg, rgba($color-indigo-deep, 0.5), rgba($color-black-void, 0.5));
    border: 1px solid rgba($color-gold-liu, 0.2);
    border-radius: $border-radius-md;
    padding: $spacing-md;
    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba($color-gold-liu, 0.2);
      border-color: rgba($color-gold-liu, 0.4);
    }
  }

  .skill-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;

    h3 {
      font-family: $font-family-title;
      font-size: $font-size-h2;
      color: $color-gold-pale;
      margin: 0;
    }

    .skill-level {
      font-size: $font-size-base;
      font-weight: bold;
      color: lighten($color-cyan-tian, 15%);
      background-color: rgba($color-cyan-tian, 0.15);
      padding: $spacing-xs $spacing-sm;
      border-radius: $border-radius-sm;
      border: 1px solid rgba($color-cyan-tian, 0.4);
      text-shadow: 0 0 5px rgba($color-cyan-tian, 0.5);
    }
  }
  
  .skill-description {
    font-size: $font-size-base;
    color: $color-white-moon;
    line-height: $line-height-base;
    margin-bottom: $spacing-md;
  }

  .skill-progress {
    .progress-bar-wrapper {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      
      progress {
        flex-grow: 1;
        height: 10px;
        -webkit-appearance: none;
        appearance: none;
        
        &::-webkit-progress-bar {
          background-color: rgba($color-black-void, 0.7);
          border-radius: 5px;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
        }
        
        &::-webkit-progress-value {
          background-image: linear-gradient(to right, $color-cyan-tian, lighten($color-cyan-tian, 15%));
          border-radius: 5px;
          box-shadow: 0 0 5px rgba($color-cyan-tian, 0.7);
          transition: width 0.3s ease;
        }
      }
      
      .progress-text {
        font-size: $font-size-small;
        color: lighten($color-grey-stone, 10%);
        font-weight: bold;
        white-space: nowrap;
        min-width: 80px; // Aligns text
        text-align: right;
      }
    }
  }

  .associated-skills {
    margin-top: $spacing-lg;
    padding-top: $spacing-md;
    border-top: 1px solid rgba($color-gold-liu, 0.15);
  }

  .associated-skills-title {
    font-family: $font-family-title;
    font-size: $font-size-h3;
    color: lighten($color-cyan-tian, 15%);
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-sm;
    background: none;
    border: none;
    border-bottom: 1px solid rgba($color-cyan-tian, 0.2);
    cursor: pointer;
    width: 100%;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-sm;
    border-radius: $border-radius-sm;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: rgba($color-cyan-tian, 0.1);
    }

    .arrow {
      border: solid lighten($color-cyan-tian, 10%);
      border-width: 0 2px 2px 0;
      display: inline-block;
      padding: 3px;
      transform: rotate(45deg);
      transition: transform 0.3s ease;
    }

    .arrow.expanded {
      transform: rotate(-135deg);
    }
  }

  .associated-skills-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  .associated-skill-item {
    display: flex;
    flex-direction: column;
    padding: $spacing-md;
    background-color: rgba($color-black-void, 0.5);
    border-radius: $border-radius-md;
    border: 1px solid rgba($color-black-void, 0.7);
    box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);
    
    .skill-name {
      font-size: $font-size-base;
      color: $color-white-moon;
      margin-bottom: $spacing-sm;

      strong {
        font-weight: bold;
        color: $color-gold-pale;
      }
    }

    .skill-detail {
      font-size: $font-size-small;
      color: $color-grey-stone;
      line-height: 1.6;
      margin-top: $spacing-xs;

      strong {
        color: $color-cyan-tian;
        font-weight: normal;
      }
    }
    
    .skill-description-detail {
      font-style: italic;
      color: darken($color-grey-stone, 10%);
      margin-bottom: $spacing-sm;
    }
  }
}
</style>
