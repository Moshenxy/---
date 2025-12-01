<template>
  <h1>纪元之书 · 终章</h1>
  <h2>天命之卷，由此展开</h2>
  <div id="summary-page">
    <p>
      世界坐落于<span class="summary-text">{{ getSelectionName('blueprints', store.selections.blueprint) }}</span
      >之中，此世的基调为<span class="summary-text">{{ getSelectionName('tones', store.selections.tone) }}</span
      >。然而，它曾遭受<span class="summary-text">{{ getMultiSelectionNames('tags', store.selections.tags) }}</span
      >之灾，如今只余<span class="summary-text">{{ getMultiSelectionNames('relics', store.selections.relics) }}</span
      >作为文明的墓碑。
    </p>
    <p>
      你，<span class="summary-text">{{ userName }}</span
      >，一个<span class="summary-text">{{ store.selections.age }}</span
      >岁的<span class="summary-text">{{ store.selections.gender }}</span
      >性，将以<span class="summary-text">{{ getSelectionName('identities', store.selections.identity) }}</span
      >的身份，于此世应运而生。
    </p>
    <p>
      你的人生曾有过<span class="summary-text">{{
        getMultiSelectionNames('past_experiences', store.selections.past_experiences)
      }}</span
      >的经历。你掌握了<span class="summary-text">{{ getMultiSelectionNames('arts', store.selections.arts) }}</span
      >的技艺，并觉醒了<span class="summary-text">{{
        getMultiSelectionNames('talents', store.selections.talents)
      }}</span
      >的天赋。
    </p>
    <p>
      你携带了<span class="summary-text">{{ getBackpackContents() }}</span
      >，踏上未知的旅途。
    </p>
    <p>
      你的潜力被最终确定为： 精 <span class="summary-text">{{ finalPotentials['精'] }}</span
      >, 气 <span class="summary-text">{{ finalPotentials['气'] }}</span
      >, 神 <span class="summary-text">{{ finalPotentials['神'] }}</span
      >, 运 <span class="summary-text">{{ finalPotentials['运'] }}</span
      >。
    </p>
  </div>
  <p class="destiny-text">【天命判词】：{{ destinyText }}</p>
</template>

<script setup>
import { computed, defineEmits, onMounted, ref } from 'vue';
import { generateDestiny } from '../services/DestinyService';
import { GAME_DATA, store } from '../store';

const emit = defineEmits(['navigate', 'open-presets']);

const destinyText = ref('');

onMounted(() => {
  destinyText.value = generateDestiny();
});

const userName = computed(() => store.playerCharacterName || '天命之人');

const getSelectionName = (type, id) => {
  if (!id) return '未定';
  const items = GAME_DATA[type];
  const item = items.find(i => i.id === id);
  return item ? item.name : '未定';
};

const getSelectionDesc = (type, id) => {
  if (!id) return '未知';
  const items = GAME_DATA[type];
  const item = items.find(i => i.id === id);
  return item ? item.desc : '未知';
};

const getMultiSelectionNames = (type, ids) => {
  if (!ids || ids.length === 0) return '未知的';
  const items = GAME_DATA[type];
  return ids
    .map(id => {
      const item = items.find(i => i.id === id);
      return item ? `“${item.name}”` : '';
    })
    .filter(Boolean)
    .join('、');
};

const finalPotentials = computed(() => {
  const result = {};
  for (const key in GAME_DATA.potentials) {
    result[key] = GAME_DATA.potentials[key].base + (store.potentialPoints[key] || 0);
  }
  return result;
});

const getBackpackContents = () => {
  const contents = [];
  const { backpack } = store.selections;
  const allItems = [...GAME_DATA.consumables, ...GAME_DATA.artifacts, ...GAME_DATA.materials];

  for (const itemId in backpack) {
    const item = allItems.find(i => i.id === itemId);
    if (item) {
      contents.push(`${item.name} x${backpack[itemId]}`);
    }
  }

  return contents.length > 0 ? contents.join('、') : '空空如也';
};
</script>
