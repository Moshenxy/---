<template>
  <h1>纪元之书 · 卷二</h1>
  <h2>应运而生，天命之人</h2>
  <div id="character-creation-options">
    <div class="sentence">
      你，<span class="summary-text">{{ store.playerCharacterName }}</span
      >，是
      <div class="dropdown-wrapper">
        <span>{{ getSelectionName('identities', store.selections.identity) }}</span>
        <div class="custom-options">
          <div
            v-for="item in filteredItems('identities')"
            :key="item.id"
            @click="handleSelect('identity', item.id)"
            :class="{ 'custom-option-item': true, 'tone-exclusive': item.requiredTone }"
          >
            <span>{{ item.name }}</span>
            <button v-if="item.custom" @click.stop.prevent="removeCustomItem('identities', item.id)" class="remove-btn">
              ×
            </button>
          </div>
        </div>
      </div>
      。
      <div class="selections-container" v-if="store.selections.identity">
         <div class="selected-item-detailed">
           <p class="item-desc">{{ getItem('identities', store.selections.identity)?.desc }}</p>
         </div>
      </div>
      <div class="custom-input-group">
        <input type="text" placeholder="自定义名称..." v-model="customInputs.identities.name" />
        <textarea placeholder="自定义详情..." v-model="customInputs.identities.desc"></textarea>
        <button type="button" @click="addCustom('identities')">添加</button>
      </div>
    </div>

    <div class="sentence">
      你的性别是
      <div class="dropdown-wrapper">
        <span>{{ store.selections.gender }}</span>
        <div class="custom-options">
          <div @click="handleSelect('gender', '男')">男</div>
          <div @click="handleSelect('gender', '女')">女</div>
        </div>
      </div>
      ，年龄
      <input type="number" v-model.number="store.selections.age" min="1" max="999" class="age-input" />
      岁。
    </div>

    <div class="sentence">
      你的人生曾有过
      <div class="dropdown-wrapper">
        <span>...</span>
        <div class="custom-options">
          <div
            v-for="item in filteredItems('past_experiences')"
            :key="item.id"
            @click="handleSelect('past_experiences', item.id, 3)"
            :class="{ 'custom-option-item': true, 'tone-exclusive': item.requiredTone }"
          >
            <span>{{ item.name }}</span>
            <button
              v-if="item.custom"
              @click.stop.prevent="removeCustomItem('past_experiences', item.id)"
              class="remove-btn"
            >
              ×
            </button>
          </div>
        </div>
      </div>
      的经历。
      <div class="selections-container">
        <div v-for="expId in store.selections.past_experiences" :key="expId" class="selected-item-detailed">
          <div class="item-header">
            <span>{{ getItem( 'past_experiences', expId)?.name }}</span>
            <span class="remove-item" @click="handleRemoveItem(expId, 'past_experiences')">×</span>
          </div>
          <p class="item-desc">{{ getItem('past_experiences', expId)?.desc }}</p>
        </div>
      </div>
      <div class="custom-input-group">
        <input type="text" placeholder="自定义名称..." v-model="customInputs.past_experiences.name" />
        <textarea placeholder="自定义详情..." v-model="customInputs.past_experiences.desc"></textarea>
        <button type="button" @click="addCustom('past_experiences')">添加</button>
      </div>
    </div>


    <div class="sentence">
      你天生便拥有
      <div class="dropdown-wrapper">
        <span>...</span>
        <div class="custom-options">
          <div
            v-for="item in filteredItems('talents')"
            :key="item.id"
            @click="handleSelect('talents', item.id, 3)"
            :class="{ 'custom-option-item': true, 'tone-exclusive': item.requiredTone }"
          >
            <span>{{ item.name }}</span>
            <button v-if="item.custom" @click.stop.prevent="removeCustomItem('talents', item.id)" class="remove-btn">
              ×
            </button>
          </div>
        </div>
      </div>
      的天赋。
      <div class="selections-container">
        <div v-for="talentId in store.selections.talents" :key="talentId" class="selected-item-detailed">
          <div class="item-header">
            <span>{{ getItem('talents', talentId)?.name }}</span>
            <span class="remove-item" @click="handleRemoveItem(talentId, 'talents')">×</span>
          </div>
          <p class="item-desc">{{ getItem('talents', talentId)?.desc }}</p>
        </div>
      </div>
      <div class="custom-input-group">
        <input type="text" placeholder="自定义名称..." v-model="customInputs.talents.name" />
        <textarea placeholder="自定义详情..." v-model="customInputs.talents.desc"></textarea>
        <button type="button" @click="addCustom('talents')">添加</button>
      </div>
    </div>

    <div class="sentence">
      你掌握了
      <div class="dropdown-wrapper">
        <span>...</span>
        <div class="custom-options">
          <div
            v-for="item in filteredItems('arts')"
            :key="item.id"
            @click="handleSelect('arts', item.id, 3)"
            :class="{ 'custom-option-item': true, 'tone-exclusive': item.requiredTone }"
            :title="getArtSkillsTooltip(item.id)"
          >
            <span>{{ item.name }}</span>
            <button v-if="item.custom" @click.stop.prevent="removeCustomItem('arts', item.id)" class="remove-btn">
              ×
            </button>
          </div>
        </div>
      </div>
      的技艺。
      <div class="selections-container">
        <div v-for="artId in store.selections.arts" :key="artId" class="selected-item-detailed">
          <div class="item-header">
            <span>{{ getItem('arts', artId)?.name }}</span>
            <span class="remove-item" @click="handleRemoveItem(artId, 'arts')">×</span>
          </div>
          <p class="item-desc">{{ getItem('arts', artId)?.desc }}</p>
          <div v-if="getItem('arts', artId)?.skills?.length" class="item-skills">
            <strong>初始技能:</strong>
            <ul>
              <li v-for="skill in getItem('arts', artId).skills" :key="skill.id">{{ skill.name }}: {{ skill.desc }}</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="custom-input-group">
        <input type="text" placeholder="自定义技艺名称..." v-model="customInputs.arts.name" />
        <textarea placeholder="自定义技艺详情..." v-model="customInputs.arts.desc"></textarea>
        <div class="custom-skills-creator">
            <div v-for="(skill, index) in customInputs.arts.skills" :key="index" class="custom-skill-item">
                <span>{{ skill.name }}: {{ skill.desc }}</span>
                <button @click.stop.prevent="removeCustomSkill(index)" class="remove-btn">×</button>
            </div>
            <div class="skill-input-row">
                <input type="text" placeholder="自定义技能名称..." v-model="customSkill.name" />
                <textarea placeholder="自定义技能详情..." v-model="customSkill.desc"></textarea>
                <button type="button" @click="addCustomSkill">添加技能</button>
            </div>
        </div>
        <button type="button" @click="addCustom('arts')">添加自定义技艺</button>
      </div>
    </div>

    <BackpackManager />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { GAME_DATA, addCustomItem, removeCustomItem, store } from '../store';
import BackpackManager from './BackpackManager.vue';

const customInputs = ref({
  identities: { name: '', desc: '' },
  talents: { name: '', desc: '' },
  past_experiences: { name: '', desc: '' },
  arts: { name: '', desc: '', skills: [] },
});

const customSkill = ref({ name: '', desc: '' });

const addCustomSkill = () => {
    if (customSkill.value.name.trim() && customSkill.value.desc.trim()) {
        customInputs.value.arts.skills.push({ ...customSkill.value, cost: 2 });
        customSkill.value.name = '';
        customSkill.value.desc = '';
    }
};

const removeCustomSkill = (index) => {
    customInputs.value.arts.skills.splice(index, 1);
};

const addCustom = type => {
  if (type === 'arts') {
    const artInput = customInputs.value.arts;
    if (artInput.name.trim() && artInput.desc.trim()) {
        const newArt = {
            id: `custom-art-${Date.now()}`,
            name: artInput.name,
            desc: artInput.desc,
            cost: 5,
            skills: artInput.skills.map(skill => ({...skill, id: `custom-skill-${Date.now()}`}))
        };
      addCustomItem('arts', newArt);
      
      artInput.name = '';
      artInput.desc = '';
      artInput.skills = [];
    }
  } else {
    const input = customInputs.value[type];
    if (input.name.trim() && input.desc.trim()) {
      addCustomItem(type, { ...input });
      input.name = '';
      input.desc = '';
    }
  }
};

const getSelectionName = (type, id) => {
  if (!id) return '_______';
  const items = GAME_DATA[type];
  const item = items.find(i => i.id === id);
  return item ? item.name : '_______';
};

const getItem = (type, id) => {
  if (!id) return null;
  const items = GAME_DATA[type];
  return items.find(i => i.id === id);
};

const filteredItems = type => {
  const selectedIds = store.selections[type];
  let items = GAME_DATA[type];

  // Filter by tone
  if (type !== 'gender' && type !== 'age') {
    items = items.filter(item => !item.requiredTone || item.requiredTone === store.selections.tone);
  }

  if (Array.isArray(selectedIds)) {
    return items.filter(item => !selectedIds.includes(item.id));
  }
  return items.filter(item => item.id !== selectedIds);
};

const handleSelect = (type, id, max = 1) => {
  if (max === 1) {
    store.selections[type] = id;
  } else {
    const selection = store.selections[type];
    if (!selection.includes(id) && selection.length < max) {
      selection.push(id);
    }
  }
};

const handleRemoveItem = (id, type) => {
  const selection = store.selections[type];
  const index = selection.indexOf(id);
  if (index > -1) {
    selection.splice(index, 1);
  }
};

const getArtSkillsTooltip = (artId) => {
  const art = GAME_DATA.arts.find(a => a.id === artId);
  if (!art || !art.skills || art.skills.length === 0) {
    return '';
  }
  return `初始技能：\n- ${art.skills.map(s => s.name).join('\n- ')}`;
};
</script>

<style lang="scss" scoped>
.custom-skills-creator {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding-left: 16px;
  border-left: 2px solid rgba(255, 255, 255, 0.1);
}

.custom-skill-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
}

.custom-input-group {
    align-items: flex-start;
}

.custom-input-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto auto;
  gap: 8px 16px;
  align-items: end;
  grid-template-areas:
    "artName skillName"
    "artDesc skillDesc"
    "artSkills skillButton"
    "addArtButton addArtButton";
}

.custom-input-group > input[placeholder*="技艺名称"] { grid-area: artName; }
.custom-input-group > textarea[placeholder*="技艺详情"] { grid-area: artDesc; }
.custom-input-group > .custom-skills-creator { grid-area: artSkills; }
.custom-input-group > button[type="button"] { grid-area: addArtButton; }

.skill-input-row {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: 8px;
    grid-template-areas:
        "skillNameInput"
        "skillDescInput"
        "skillAddButton";
}
.skill-input-row input { grid-area: skillNameInput; }
.skill-input-row textarea { grid-area: skillDescInput; }
.skill-input-row button { grid-area: skillAddButton; }

.selected-item-detailed {
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 8px 12px;
  margin-top: 8px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.item-desc {
  font-size: 0.9em;
  color: #a0998f;
  margin-top: 4px;
  white-space: pre-wrap;
}

.item-skills {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.85em;
}

.item-skills strong {
  color: #c8aa7a;
}

.item-skills ul {
  list-style-type: none;
  padding-left: 10px;
  margin-top: 4px;
}

</style>
