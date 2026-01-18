<template>
  <div class="character-panel">
    <div class="panel-section">
      <div class="section-title">基础属性</div>
      <div id="base-attributes-list" class="attributes-list">
        <template v-for="(attr, key) in baseAttributes.value" :key="key">
          <AttributeDisplay
            :name="String(key)"
            :value="`${attr.值} / ${attr.软上限}`"
          />
        </template>
      </div>
    </div>
    <div class="panel-section">
      <div class="section-title">二级属性</div>
      <div id="secondary-attributes-list" class="attributes-list">
        <AttributeDisplay name="财力" :value="`¥ ${secondaryAttributes.财力}`" />
        <AttributeDisplay name="声望" :value="secondaryAttributes.声望" />
      </div>
    </div>
    <div class="panel-section">
      <div class="section-title">各科成绩</div>
      <div id="grades-list" class="attributes-list">
        <AttributeDisplay
          v-for="(subject, key) in subjects.value"
          :key="key"
          :name="String(key)"
          :value="`${subject.知识水平} (${subject.最近一次分数})`"
        />
      </div>
    </div>
    <div class="panel-section">
      <div class="section-title">技能与知识</div>
      <div id="skills-list" class="attributes-list">
        <AttributeDisplay
          v-for="(skill, key) in skills.value"
          :key="key"
          :name="String(key)"
          :value="`Lv.${skill.等级} / ${skill.软上限}`"
        />
      </div>
    </div>
    <div class="panel-section">
      <div class="section-title">天赋与特长</div>
      <div id="talents-list" class="attributes-list">
        <AttributeDisplay
          v-for="(talent, index) in talents"
          :key="index"
          :name="talent.名称"
          :value="talent.描述"
        />
      </div>
    </div>
    <div class="panel-section">
      <div class="section-title">今日课程</div>
      <div id="schedule-list" class="attributes-list">
         <AttributeDisplay
          v-for="(course, index) in todayCourses"
          :key="index"
          :name="course.标题"
          :value="course.时间段"
        />
      </div>
    </div>
    <div class="panel-section">
      <div class="section-title">人际关系</div>
      <div id="relations-list" class="attributes-list">
        <div v-for="(rel, name) in relationships.value" :key="name" class="attribute-item">
            <span class="attribute-name">{{ name }}</span>
            <span class="attribute-value">
                亲密:{{ rel.亲密 }} 信赖:{{ rel.信赖 }}
            </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getters } from '../store';
import AttributeDisplay from '../components/AttributeDisplay.vue';

const {
  character,
  secondaryAttributes,
  todayCourses,
  getBaseAttributes,
  getSubjects,
  getSkills,
  getTalents,
  getRelationships,
} = getters;

const baseAttributes = getBaseAttributes(character);
const subjects = getSubjects(character);
const skills = getSkills(character);
const talents = getters.getTalents(character);
const relationships = getRelationships(character);
</script>

<style lang="scss" scoped>
.character-panel {
  background: #f5f1e9;
  padding: 15px;
  overflow-y: auto;
  box-shadow: inset 0 0 10px rgba(58, 63, 75, 0.03);
  border-right: 1px solid #eae6dd;
}

.panel-section {
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #eae6dd;
  box-shadow: 0 2px 8px rgba(58, 63, 75, 0.05);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(58, 63, 75, 0.08);
  }
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #3a3f4b;
  margin-bottom: 12px;
  text-align: left;
  border-bottom: 2px solid #4169e1;
  padding-bottom: 8px;
  display: inline-block;
}

.attributes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attribute-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.attribute-name {
  color: #6c757d;
}

.attribute-value {
  color: #3a3f4b;
  font-weight: 500;
}
</style>