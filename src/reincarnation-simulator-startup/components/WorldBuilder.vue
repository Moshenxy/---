<template>
  <h1>纪元之书 · 卷一</h1>
  <h2>追溯历史，定义现在</h2>
  <div id="world-building-options">
    <div class="sentence">
      你的世界位于
      <div class="dropdown-wrapper">
        <span>{{ getSelectionName('blueprints', store.selections.blueprint) }}</span>
        <div class="custom-options">
          <div
            v-for="item in GAME_DATA.blueprints"
            :key="item.id"
            @click="handleSelect('blueprint', item.id)"
            class="custom-option-item"
          >
            <span>{{ item.name }}</span>
            <button v-if="item.custom" @click.stop.prevent="removeCustomItem('blueprints', item.id)" class="remove-btn">
              ×
            </button>
          </div>
        </div>
      </div>
      之中。
      <div class="custom-input-group">
        <input type="text" placeholder="自定义名称..." v-model="customBlueprint.name" />
        <textarea placeholder="自定义详情..." v-model="customBlueprint.desc"></textarea>
        <button type="button" @click="addCustomBlueprint">添加</button>
      </div>
    </div>

    <div class="sentence">
      这个世界的主要文明形态为
      <div class="dropdown-wrapper">
        <span>{{ getSelectionName('tones', store.selections.tone) }}</span>
        <div class="custom-options">
          <div
            v-for="item in GAME_DATA.tones"
            :key="item.id"
            @click="handleSelect('tone', item.id)"
            class="custom-option-item"
          >
            <span>{{ item.name }}</span>
            <button v-if="item.custom" @click.stop.prevent="removeCustomItem('tones', item.id)" class="remove-btn">
              ×
            </button>
          </div>
        </div>
      </div>
      。
      <div class="custom-input-group">
        <input type="text" placeholder="自定义名称..." v-model="customTone.name" />
        <textarea placeholder="自定义详情..." v-model="customTone.desc"></textarea>
        <button type="button" @click="addCustomTone">添加</button>
      </div>
    </div>

    <div class="sentence">
      但数个纪元前，它曾经历
      <div class="dropdown-wrapper">
        <span>...</span>
        <div class="custom-options">
          <div
            v-for="item in GAME_DATA.tags"
            :key="item.id"
            @click="handleSelect('tags', item.id, 3)"
            class="custom-option-item"
          >
            <span>{{ item.name }}</span>
            <button v-if="item.custom" @click.stop.prevent="removeCustomItem('tags', item.id)" class="remove-btn">
              ×
            </button>
          </div>
        </div>
      </div>
      的灾难。
      <div class="selections-container">
        <span v-for="tagId in store.selections.tags" :key="tagId" class="selected-item">
          {{ getSelectionName('tags', tagId) }}
          <span class="remove-item" @click="handleRemoveItem(tagId, 'tags')">×</span>
        </span>
      </div>
      <div class="custom-input-group">
        <input type="text" placeholder="自定义名称..." v-model="customTag.name" />
        <textarea placeholder="自定义详情..." v-model="customTag.desc"></textarea>
        <button type="button" @click="addCustomTag">添加</button>
      </div>
    </div>

    <div class="sentence">
      如今，大地上仍散落着
      <div class="dropdown-wrapper">
        <span>...</span>
        <div class="custom-options">
          <div
            v-for="item in GAME_DATA.relics"
            :key="item.id"
            @click="handleSelect('relics', item.id, 3)"
            class="custom-option-item"
          >
            <span>{{ item.name }}</span>
            <button v-if="item.custom" @click.stop.prevent="removeCustomItem('relics', item.id)" class="remove-btn">
              ×
            </button>
          </div>
        </div>
      </div>
      的遗迹。
      <div class="selections-container">
        <span v-for="relicId in store.selections.relics" :key="relicId" class="selected-item">
          {{ getSelectionName('relics', relicId) }}
          <span class="remove-item" @click="handleRemoveItem(relicId, 'relics')">×</span>
        </span>
      </div>
      <div class="custom-input-group">
        <input type="text" placeholder="自定义名称..." v-model="customRelic.name" />
        <textarea placeholder="自定义详情..." v-model="customRelic.desc"></textarea>
        <button type="button" @click="addCustomRelic">添加</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { store, GAME_DATA, addCustomItem, removeCustomItem } from '../store';

const customBlueprint = ref({ name: '', desc: '' });
const customTone = ref({ name: '', desc: '' });
const customTag = ref({ name: '', desc: '' });
const customRelic = ref({ name: '', desc: '' });

const addCustomBlueprint = () => {
  if (customBlueprint.value.name.trim() && customBlueprint.value.desc.trim()) {
    addCustomItem('blueprints', { ...customBlueprint.value, cost: 0, scale_points: 0, complexity_points: 0 });
    customBlueprint.value = { name: '', desc: '' };
  }
};

const addCustomTone = () => {
  if (customTone.value.name.trim() && customTone.value.desc.trim()) {
    addCustomItem('tones', { ...customTone.value, cost: 0, scale_points: 0, complexity_points: 0 });
    customTone.value = { name: '', desc: '' };
  }
};

const addCustomTag = () => {
  if (customTag.value.name.trim() && customTag.value.desc.trim()) {
    addCustomItem('tags', { ...customTag.value, cost: 0, scale_points: 0, complexity_points: 0 });
    customTag.value = { name: '', desc: '' };
  }
};

const addCustomRelic = () => {
  if (customRelic.value.name.trim() && customRelic.value.desc.trim()) {
    addCustomItem('relics', { ...customRelic.value, cost: 0, scale_points: 0, complexity_points: 0 });
    customRelic.value = { name: '', desc: '' };
  }
};

const getSelectionName = (type, id) => {
  if (!id) return '_______';
  const items = GAME_DATA[type];
  const item = items.find(i => i.id === id);
  return item ? item.desc : '_______';
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
</script>
