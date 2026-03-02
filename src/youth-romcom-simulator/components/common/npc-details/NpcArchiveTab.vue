<template>
  <div class="detail-tab-content grid-layout">
    <div class="detail-item">
      <strong class="detail-key">姓名:</strong>
      <div class="detail-value"><p>{{ npc.名称 }}</p></div>
    </div>
    <div class="detail-item">
      <strong class="detail-key">生日:</strong>
      <div class="detail-value"><p>{{ formattedBirthDate }} ({{ age }})</p></div>
    </div>
    <div class="detail-item">
      <strong class="detail-key">身份:</strong>
      <div class="detail-value">
        <span v-for="item in npc.身份" class="tag">{{ item.组织 }} - {{ item.职位 }}</span>
      </div>
    </div>
    <div class="detail-item">
      <strong class="detail-key">相貌:</strong>
      <div class="detail-value"><p>{{ npc.个人信息.容貌 }}</p></div>
    </div>
    <div class="detail-item">
      <strong class="detail-key">着装:</strong>
      <div class="detail-value">
        <ul v-if="currentOutfit.length" class="outfit-list">
          <li v-for="item in currentOutfit" :key="item.part">
            <span class="outfit-part">{{ item.part }}:</span> {{ item.name }}
          </li>
        </ul>
        <p v-else>无信息</p>
      </div>
    </div>
     <div class="detail-item">
      <strong class="detail-key">心理状态:</strong>
      <div class="detail-value"><p>{{ npc.内在世界.心理状态 }} ({{ npc.内在世界.心理健康 }})</p></div>
    </div>
    <div class="detail-item evolution-level">
     <strong class="detail-key">演化等级:</strong>
     <div class="evolution-tracks">
       <div class="track">
         <span class="track-label">身体</span>
         <span class="track-level">{{ npc.内在世界.NSFW?.phys ?? 0 }}</span>
         <span class="track-status">{{ physicalLevelStatus }}</span>
       </div>
       <div class="track">
         <span class="track-label">精神</span>
         <span class="track-level">{{ npc.内在世界.NSFW?.mind ?? 0 }}</span>
         <span class="track-status">{{ mentalLevelStatus }}</span>
       </div>
     </div>
   </div>
    <div class="detail-item full-width">
      <strong class="detail-key">核心动机:</strong>
       <div class="detail-value">
        <AttributeGrid :attributes="npc.内在世界.核心动机" />
      </div>
    </div>
    <div class="detail-item full-width">
      <strong class="detail-key">恐惧创伤:</strong>
      <div class="detail-value">
        <ul class="history-list">
          <li v-for="(trauma, index) in npc.内在世界.恐惧创伤" :key="index">
            <strong>触发源: {{ trauma.触发源 }}</strong>
            <p class="influence-text">应激反应: {{ trauma.应激反应 }}</p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Npc } from '../../../types';
import { store } from '../../../store';
import AttributeGrid from '../AttributeGrid.vue';

const props = defineProps<{ npc: Npc }>();

const physicalLevels = [
  { lv: 0, status: '纯洁/紧致' },
  { lv: 1, status: '适应/记忆' },
  { lv: 2, status: '开发/柔软' },
  { lv: 3, status: '敏感/淫乱' },
  { lv: 4, status: '吸吮/名器' },
  { lv: 5, status: '肉便器/松弛' },
  { lv: 6, status: '自律/随心' },
];

const mentalLevels = [
  { lv: 0, status: '抵抗/纯洁' },
  { lv: 1, status: '好奇/动摇' },
  { lv: 2, status: '屈服/认知' },
  { lv: 3, status: '沉沦/享乐' },
  { lv: 4, status: 'M属性觉醒' },
  { lv: 5, status: '堕落(雌堕)' },
];

const physicalLevelStatus = computed(() => {
  const level = props.npc.内在世界.NSFW?.phys ?? 0;
  return physicalLevels.find(p => p.lv === level)?.status || '未知';
});

const mentalLevelStatus = computed(() => {
  const level = props.npc.内在世界.NSFW?.mind ?? 0;
  return mentalLevels.find(m => m.lv === level)?.status || '未知';
});

const outfitPartMapping = {
  外套: '外套',
  上衣: '上衣',
  下装: '下装',
  连衣裙: '连衣裙',
  袜子: '袜子',
  鞋子: '鞋子',
  内衣: '内衣',
  饰品: '饰品',
};

const currentOutfit = computed(() => {
  const outfit: { part: string; name: string }[] = [];
  const clothing = props.npc.当前衣着;
  const itemDb = store.worldState?.物品数据库;

  if (!clothing || !itemDb) return [];

  Object.keys(clothing).forEach(part => {
    const key = part as keyof typeof clothing;
    if (key === '饰品' && Array.isArray(clothing.饰品)) {
      const accessoryNames = clothing.饰品.map(id => itemDb[id]?.名称).filter(Boolean);
      if (accessoryNames.length > 0) {
        outfit.push({ part: '饰品', name: accessoryNames.join('、 ') });
      }
    } else if (key !== '饰品') {
      const itemId = clothing[key];
      if (typeof itemId === 'string' && itemDb[itemId]) {
        outfit.push({ part: outfitPartMapping[key] || key, name: itemDb[itemId].名称 });
      }
    }
  });

  return outfit;
});


const age = computed(() => {
  if (!props.npc.个人信息?.出生日期) return '未知';
  const birthDate = new Date(props.npc.个人信息.出生日期);
  const worldDate = new Date(store.worldState?.世界状态.时间.日期 || Date.now());
  let age = worldDate.getFullYear() - birthDate.getFullYear();
  const m = worldDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && worldDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

const formattedBirthDate = computed(() => {
  const bd = props.npc.个人信息.出生日期;
  if (!bd) return '未知';
  const date = new Date(bd);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
});

</script>

<style lang="scss" scoped>
@use '../../../styles/theme/variables' as *;
@use '../../../styles/theme/mixins' as *;

.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: $spacing-lg;
}

.detail-item {
  .detail-key {
    color: $color-gold-pale;
    font-family: $font-family-title;
    font-size: $font-size-large;
    display: block;
    margin-bottom: $spacing-md;
  }
  .detail-value {
    color: $color-white-moon;
    font-size: $font-size-base;
    line-height: 1.7;
    p {
      margin: 0;
      white-space: pre-wrap;
    }
    .tag {
      display: inline-block;
      background-color: rgba($color-cyan-tian, 0.15);
      color: $color-cyan-tian;
      padding: 4px 8px;
      border-radius: $border-radius-sm;
      margin-right: $spacing-sm;
      margin-bottom: $spacing-sm;
    }
  }
}

.history-list {
  list-style: none;
  padding: 0;
  li {
    margin-bottom: $spacing-md;
    strong {
      color: $color-gold-pale;
    }
    p {
      color: $color-grey-stone;
      font-size: $font-size-small;
    }
  }
}
.influence-text {
  color: $color-cyan-tian;
  font-style: italic;
  font-size: $font-size-small;
  margin-top: $spacing-sm;
  &::before {
    content: '影响：';
    font-weight: bold;
  }
}

.evolution-level {
  .evolution-tracks {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }
  .track {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    .track-label {
      font-weight: bold;
      color: $color-grey-stone;
      width: 40px;
    }
    .track-level {
      font-size: $font-size-large;
      font-weight: bold;
      color: $color-gold-pale;
      width: 20px;
      text-align: center;
    }
    .track-status {
      color: $color-white-moon;
    }
  }
}

.outfit-list {
  list-style: none;
  padding: 0;
  margin: 0;
  li {
    margin-bottom: $spacing-sm;
    .outfit-part {
      font-weight: bold;
      color: $color-grey-stone;
      display: inline-block;
      width: 60px;
    }
  }
}
</style>
