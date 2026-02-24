<template>
  <div class="character-app-container">
    <div class="character-app" v-if="protagonist">
      <div class="card character-header">
        <div class="avatar">
          <span>{{ protagonist.名称 ? protagonist.名称.charAt(0) : '?' }}</span>
        </div>
        <div class="character-info">
          <h2 class="character-name">{{ protagonist.名称 }}</h2>
          <p class="character-identity" v-if="protagonist.身份 && protagonist.身份.length > 0">
            {{ protagonist.身份[0].组织 }} - {{ protagonist.身份[0].职位 }}
          </p>
        </div>
      </div>

      <div class="tabs">
        <button @click="activeTab = 'status'" :class="{ active: activeTab === 'status' }">状态</button>
        <button @click="activeTab = 'attributes'" :class="{ active: activeTab === 'attributes' }">属性</button>
        <button @click="activeTab = 'skills'" :class="{ active: activeTab === 'skills' }">技能</button>
      </div>

      <div class="tab-content">
        <div v-if="activeTab === 'status'" class="card status-section">
          <div class="status-list" v-if="protagonist.当前状态 && protagonist.当前状态.length">
            <div
              v-for="(status, index) in protagonist.当前状态"
              :key="index"
              class="status-item"
              @click="selectedStatus = status"
            >
              <span>{{ status.名称 }}</span>
              <span class="status-duration">{{ formatDuration(status.持续到) }}</span>
            </div>
          </div>
          <div v-else class="empty-state">无特殊状态</div>
        </div>

        <div v-if="activeTab === 'attributes'" class="card attributes-section">
          <div class="attributes-grid">
            <AttributeDisplay
              v-for="(attr, key) in protagonist.属性"
              :key="key"
              :name="translateAttribute(key)"
              :value="attr"
            />
          </div>
        </div>

        <div v-if="activeTab === 'skills'" class="card skills-section">
          <div class="skills-list" v-if="protagonist.技能 && Object.keys(protagonist.技能).length">
            <div
              v-for="(skill, key) in protagonist.技能"
              :key="key"
              class="skill-item"
              @click="selectedSkill = { name: key, ...skill }"
            >
              <div class="skill-header">
                <span class="skill-name">{{ key }}</span>
                <span class="skill-level" :style="{ color: getSkillLevelColor(skill.等级) }">Lv. {{ skill.等级 }}</span>
              </div>
              <p class="skill-description">{{ skill.介绍 }}</p>
            </div>
          </div>
          <div v-else class="empty-state">尚未习得任何技能</div>
        </div>
      </div>
    </div>
    <div v-else class="loading-pane">正在加载角色数据...</div>

    <!-- Status Detail Modal -->
    <div v-if="selectedStatus" class="modal-overlay" @click="selectedStatus = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedStatus.名称 }}</h3>
          <button class="close-button" @click="selectedStatus = null">&times;</button>
        </div>
        <div class="modal-body">
          <p><strong>效果:</strong> {{ selectedStatus.效果 }}</p>
          <p><strong>来源:</strong> {{ selectedStatus.来源 }}</p>
          <p><strong>持续到:</strong> {{ formatDuration(selectedStatus.持续到, true) }}</p>
        </div>
      </div>
    </div>
    <!-- Skill Detail Modal -->
    <div v-if="selectedSkill" class="modal-overlay" @click="selectedSkill = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedSkill.name }}</h3>
          <button class="close-button" @click="selectedSkill = null">&times;</button>
        </div>
        <div class="modal-body">
          <p>
            <strong>等级:</strong>
            <span :style="{ color: getSkillLevelColor(selectedSkill.等级) }">Lv. {{ selectedSkill.等级 }}</span>
          </p>
          <p><strong>类型:</strong> {{ selectedSkill.类型 }}</p>
          <div class="experience-bar">
            <div class="progress-fill" :style="{ width: `${getSkillExpPercentage(selectedSkill)}%` }"></div>
            <span class="progress-text">经验: {{ selectedSkill.经验值 }} / {{ getSkillExpCap(selectedSkill) }}</span>
          </div>
          <p><strong>介绍:</strong> {{ selectedSkill.介绍 }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { store } from '../../store';
import AttributeDisplay from '../../components/common/AttributeDisplay.vue';
import { 属性等级定义 } from '../../types';
import type { 主角, 技能, 属性等级 } from '../../types';

type Status = 主角['当前状态'][number];
type SkillWithKey = 技能 & { name: string };

const activeTab = ref('status');
const selectedStatus = ref<Status | null>(null);
const selectedSkill = ref<SkillWithKey | null>(null);

const protagonist = computed(() => {
  const char = store.worldState?.主角;
  if (typeof char === 'object' && char !== null && '名称' in char) {
    return char as 主角;
  }
  return null;
});

const attributeTranslations: Record<string, string> = {
  沟通: '沟通',
  观察: '观察',
  行动力: '行动力',
  精神力: '精神力',
  知识: '知识',
  魅力: '魅力',
};

const translateAttribute = (key: string) => {
  return attributeTranslations[key] || key;
};

const formatDuration = (duration: Status['持续到'], full = false) => {
  if (!duration) {
    return '永久';
  }
  if (full) {
    return `${duration.日期} ${duration.片段}`;
  }
  return `至 ${duration.日期}`;
};

const getSkillLevelColor = (level: 属性等级) => {
  switch (level) {
    case 'S':
    case 'SS':
    case 'SSS':
      return '#ffd700'; // Gold
    case 'A':
      return '#da70d6'; // Orchid
    case 'B':
      return '#87cefa'; // Light Sky Blue
    case 'C':
      return '#90ee90'; // Light Green
    default:
      return '#a0a0a0'; // Grey
  }
};

const getSkillExpCap = (skill: SkillWithKey) => {
  const levelInfo = 属性等级定义.find(l => l.等级 === skill.等级);
  return levelInfo ? levelInfo.升级经验 : '??';
};

const getSkillExpPercentage = (skill: SkillWithKey) => {
  const cap = getSkillExpCap(skill);
  if (typeof cap === 'number' && cap > 0) {
    return (skill.经验值 / cap) * 100;
  }
  return 0;
};
</script>

<style lang="scss" scoped>
.experience-bar {
  position: relative;
  height: 20px;
  background-color: #2a2f45;
  border-radius: 4px;
  overflow: hidden;
  margin: 10px 0;
  border: 1px solid rgba(212, 175, 55, 0.2);

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, rgba(212, 175, 55, 0.5) 0%, rgba(212, 175, 55, 0.8) 100%);
    transition: width 0.5s ease;
  }

  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 12px;
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
  }
}
.character-app-container {
  padding: 15px;
  height: 100%;
  overflow-y: auto;
  background-color: #10141d;
  color: #e0e0e0;
  position: relative;
}

.character-app {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.card {
  background-color: rgba(21, 26, 48, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 12px;
  padding: 15px;
}

.character-header {
  display: flex;
  align-items: center;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #151a30;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
  font-weight: bold;
  color: #fafad2;
  margin-right: 15px;
  flex-shrink: 0;
  border: 2px solid rgba(212, 175, 55, 0.5);
}

.character-info {
  .character-name {
    font-family: 'Noto Serif SC', serif;
    font-size: 22px;
    margin: 0;
    color: #f0f0f0;
  }
  .character-identity {
    font-size: 13px;
    margin: 4px 0 0;
    color: #a0a0a0;
  }
}

.tabs {
  display: flex;
  background-color: rgba(21, 26, 48, 0.4);
  border-radius: 10px;
  padding: 4px;
  button {
    flex: 1;
    padding: 8px;
    border: none;
    background-color: transparent;
    color: #a0a0a0;
    cursor: pointer;
    transition:
      background-color 0.3s,
      color 0.3s;
    border-radius: 8px;
    &.active {
      background-color: rgba(212, 175, 55, 0.2);
      color: #fafad2;
      font-weight: bold;
    }
  }
}

.tab-content {
  .card {
    min-height: 300px;
  }
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background-color: rgba(220, 20, 60, 0.15);
  border-left: 3px solid #dc143c;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;

  &:hover {
    background-color: rgba(220, 20, 60, 0.25);
  }

  .status-duration {
    font-size: 12px;
    color: #a0a0a0;
  }
}

.attributes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skill-item {
  padding: 12px;
  background-color: rgba(30, 35, 55, 0.5);
  border-radius: 8px;
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: rgba(45, 50, 75, 0.7);
    border-left-color: #d4af37;
  }

  .skill-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 6px;
  }
  .skill-name {
    font-weight: bold;
    color: #f0f0f0;
    font-size: 15px;
  }
  .skill-level {
    font-size: 14px;
    font-weight: bold;
  }
  .skill-description {
    font-size: 13px;
    color: #a0a0a0;
    margin: 0;
    line-height: 1.5;
  }
}

.loading-pane,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 14px;
  color: #a0a0a0;
}

.empty-state {
  height: auto;
  padding: 20px;
}
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #1c2135;
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  padding-bottom: 10px;
  margin-bottom: 15px;

  h3 {
    margin: 0;
    font-size: 18px;
    color: #fafad2;
  }

  .close-button {
    background: none;
    border: none;
    color: #a0a0a0;
    font-size: 24px;
    cursor: pointer;
  }
}

.modal-body {
  p {
    margin: 0 0 10px;
    font-size: 14px;
    line-height: 1.6;
    color: #c0c0c0;

    strong {
      color: #fafad2;
    }
  }
}
</style>
