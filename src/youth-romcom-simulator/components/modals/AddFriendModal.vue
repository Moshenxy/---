<template>
  <Modal :show="show" @close="$emit('close')" title="添加好友">
    <div class="add-friend-modal-content">
      <div class="add-friend-search-bar">
        <input type="text" v-model="searchTerm" placeholder="输入姓名搜索全校学生..." @keypress.enter="search" />
        <button @click="search" class="interaction-btn">搜索</button>
      </div>
      <div class="search-results-list">
        <div v-if="!searched" class="search-prompt">请输入要搜索的姓名。</div>
        <div v-else-if="searchResults.length === 0" class="search-prompt">未找到符合条件的学生。</div>
        <div v-else v-for="char in searchResults" :key="char.id" class="search-result-item">
          <span class="result-name">{{ char.name }}</span>
          <span class="result-class">{{ char.班级[0] }}</span>
          <button class="interaction-btn btn-small btn-add-friend" @click="addFriend(char)">添加</button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { get } from 'lodash';
import Modal from './Modal.vue';
import { store, actions, getters } from '../../store';

const props = defineProps({
  show: Boolean,
});
const emit = defineEmits(['close']);

const searchTerm = ref('');
const searchResults = ref<any[]>([]);
const searched = ref(false);

function parseRoster(rosterText: string): any {
  const characters: { [id: string]: any } = {};
  if (!rosterText) return characters;
  const lines = rosterText.split('\n');
  let currentClass = '';

  for (const line of lines) {
    const classMatch = line.match(/(\d年[A-E]班)/);
    if (classMatch) {
      currentClass = classMatch[1];
      continue;
    }

    const charMatch = line.match(/\d+\.\s*(.+?)\s*([♂♀])/);
    if (charMatch && currentClass) {
      const fullName = charMatch[1].trim();
      const lastName = fullName.length > 2 ? fullName.substring(0, 2) : fullName.substring(0, 1);
      const firstName = fullName.length > 2 ? fullName.substring(2) : fullName.substring(1);
      const id = `${lastName}_${firstName}`.toLowerCase();

      characters[id] = {
        id,
        姓: [lastName],
        名: [firstName],
        班级: [currentClass],
      };
    }
  }
  return characters;
}

async function search() {
  searched.value = true;
  const term = searchTerm.value.toLowerCase().trim();
  if (!term) {
    searchResults.value = [];
    return;
  }

  let allCharacters = get(store.worldState, '角色', {});
  try {
    const allEntries = await TavernHelper.getLorebookEntries('天华校园');
    const rosterEntry = allEntries.find((entry: any) => entry.comment === '[世界观]全校名册');
    if (rosterEntry && rosterEntry.content) {
      const parsedRoster = parseRoster(rosterEntry.content);
      // 合并数据，优先使用 `角色` 对象中的数据
      allCharacters = { ...parsedRoster, ...allCharacters };
    }
  } catch (e) {
    console.error('无法加载或解析全校名册:', e);
  }

  const userId = store.userId;

  searchResults.value = Object.values(allCharacters)
    .filter((char: any) => {
      if (!char.名 || char.id === userId || char.id === '$meta' || char.id === 'template') return false;
      const name = `${get(char, '姓[0]', '')}${get(char, '名[0]', '')}`.toLowerCase();
      const isFriend = get(char, '聊天状态[0]') === '好友';
      return name.includes(term) && !isFriend;
    })
    .map((char: any) => ({
      id: char.id,
      name: `${get(char, '姓[0]', '')}${get(char, '名[0]', '')}`,
      班级: get(char, '班级', ['未知']),
    }));
}

function addFriend(character: any) {
  const message = prompt(
    `请输入对 ${character.name} 的好友请求消息（20字以内）：`,
    `你好，我是${getters.userFullName.value}，可以加个好友吗？`,
  );
  if (message === null) return; // User cancelled

  if (message.length > 20) {
    alert('消息过长，请不要超过20个字。');
    return;
  }

  actions.addActionToQueue({
    action: 'addFriend',
    characterId: character.id,
    characterName: character.name,
    message: message || '你好，可以加个好友吗？',
  });

  // For now, we can just close the modal. A better UX would be to show a success message.
  emit('close');
}
</script>

<style lang="scss" scoped>
.add-friend-search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;

  input {
    flex-grow: 1;
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 6px;
  }
}

.search-results-list {
  min-height: 200px;
  max-height: 40vh;
  overflow-y: auto;
}

.search-prompt {
  color: #6c757d;
  text-align: center;
  padding-top: 20px;
}

.search-result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 5px;
  border-bottom: 1px solid #f0f0f0;
}
</style>
