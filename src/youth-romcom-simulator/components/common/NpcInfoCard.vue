<template>
  <div class="npc-info-card">
    <div class="info-grid">
      <div class="info-item">
        <strong>生日</strong>
        <span>{{ npc.出生日期 ? `${npc.出生日期.年}年${npc.出生日期.月}月${npc.出生日期.日}日` : '未知' }}</span>
      </div>
      <div class="info-item">
        <strong>性别</strong>
        <span>{{ npc.性别 ? npc.性别 : '未知' }}</span>
      </div>
      <div class="info-item">
        <strong>年龄</strong>
        <span>{{ age }}</span>
      </div>
      <div class="info-item">
        <strong>心情</strong>
        <span>{{ mood }}</span>
      </div>
      <div class="info-item full-width">
        <strong>身份</strong>
        <span>{{ identities }}</span>
      </div>
      <div class="info-item full-width">
        <strong>相貌</strong>
        <span>{{ npc.相貌 ? npc.相貌 : '无详细描述。' }}</span>
      </div>
      <div class="info-item full-width">
        <strong>着装</strong>
        <span>{{ npc.着装 ? npc.着装 : '无详细描述。' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, computed } from 'vue';
import { store } from '../../store';
import { Character } from '../../types';
import { calculateAge } from '../../store/getters';

const props = defineProps({
  npc: {
    type: Object as PropType<Character>,
    required: true,
  },
});

const identities = computed(() => {
  if (!props.npc.身份) return '无';
  return Object.values(props.npc.身份)
    .filter(val => typeof val === 'string')
    .join('，');
});

const age = computed(() => {
  if (!props.npc.所属世界) return '未知';
  const world = store.worldState?.世界?.[props.npc.所属世界];
  if (!world) return '未知';

  const calculated = calculateAge(props.npc, world as any);
  return calculated === null ? '未知' : calculated;
});

const getMoodDescription = (emotions: { 心绪: number; 怒意: number; 胆识: number; 仪态: number }): string => {
  if (!emotions) return '未知';

  type EmotionKey = '心绪' | '怒意' | '胆识' | '仪态';

  const emotionMapping: { [key in EmotionKey]: { [range: number]: string } } = {
    心绪: {
      100: '极乐',
      90: '心花怒放',
      80: '狂喜',
      70: '振奋',
      60: '兴奋',
      50: '愉悦',
      40: '欣喜',
      30: '高兴',
      20: '愉快',
      10: '开心',
      0: '平静',
      '-10': '低落',
      '-20': '郁闷',
      '-30': '失落',
      '-40': '沮丧',
      '-50': '悲伤',
      '-60': '痛苦',
      '-70': '心碎',
      '-80': '悲痛欲绝',
      '-90': '万念俱灰',
      '-100': '绝望',
    },
    怒意: {
      100: '憎恨',
      90: '雷霆之怒',
      80: '暴怒',
      70: '大怒',
      60: '怒火中烧',
      50: '愤怒',
      40: '烦躁',
      30: '恼火',
      20: '不满',
      10: '微愠',
      0: '中立',
      '-10': '平静',
      '-20': '耐心',
      '-30': '淡然',
      '-40': '平和',
      '-50': '镇定',
      '-60': '冷静',
      '-70': '沉着',
      '-80': '波澜不惊',
      '-90': '心如止水',
      '-100': '绝对理智',
    },
    胆识: {
      100: '英勇无双',
      90: '悍不畏死',
      80: '奋勇',
      70: '果敢',
      60: '无畏',
      50: '勇敢',
      40: '从容',
      30: '沉着',
      20: '安定',
      10: '镇定',
      0: '平静',
      '-10': '警惕',
      '-20': '紧张',
      '-30': '担忧',
      '-40': '不安',
      '-50': '畏惧',
      '-60': '害怕',
      '-70': '恐惧',
      '-80': '惊恐万状',
      '-90': '魂飞魄散',
      '-100': '崩溃',
    },
    仪态: {
      100: '傲视群雄',
      90: '意气风发',
      80: '神采飞扬',
      70: '挥洒自如',
      60: '自信',
      50: '从容',
      40: '大方',
      30: '放松',
      20: '自在',
      10: '自然',
      0: '平静',
      '-10': '拘谨',
      '-20': '不自在',
      '-30': '局促',
      '-40': '腼腆',
      '-50': '害羞',
      '-60': '难为情',
      '-70': '窘迫',
      '-80': '羞愧难当',
      '-90': '极度羞耻',
      '-100': '无地自容',
    },
  };

  const getDesc = (key: EmotionKey, value: number) => {
    const map = emotionMapping[key];
    const sortedKeys = Object.keys(map)
      .map(Number)
      .sort((a, b) => a - b);

    if (value >= 0) {
      // For positive values, find the largest key that is less than or equal to the value
      const foundKey = sortedKeys.reverse().find(k => k >= 0 && value >= k);
      return map[foundKey ?? 0];
    } else {
      // For negative values, find the smallest key that is greater than or equal to the value
      const foundKey = sortedKeys.find(k => k < 0 && value <= k);
      return map[foundKey ?? 0];
    }
  };

  const sortedEmotions = (Object.keys(emotions) as EmotionKey[])
    .map(key => ({ name: key, value: Number(Array.isArray(emotions[key]) ? emotions[key][0] : emotions[key]) }))
    .filter(e => e.value !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  if (sortedEmotions.length === 0) return '平静';

  const primary = sortedEmotions[0];
  const primaryDesc = getDesc(primary.name, primary.value);

  if (sortedEmotions.length === 1 || Math.abs(sortedEmotions[1].value) < 25) {
    return primaryDesc;
  }

  const secondary = sortedEmotions[1];
  const secondaryDesc = getDesc(secondary.name, secondary.value).toLowerCase();

  return `${primaryDesc}，并感到${secondaryDesc}`;
};

const mood = computed(() => {
  const emotions = props.npc.心流?.情绪状态;
  if (!emotions) return '未知';
  return getMoodDescription(emotions as any);
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.npc-info-card {
  padding: $spacing-md;
  min-width: 350px;

  h4 {
    color: $color-gold-pale;
    font-family: $font-family-title;
    font-size: $font-size-h2;
    text-align: center;
    margin-top: 0;
    margin-bottom: $spacing-lg;
    padding-bottom: $spacing-md;
    border-bottom: 1px solid rgba($color-gold-liu, 0.2);
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-lg;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;

    strong {
      font-family: $font-family-main;
      color: $color-gold-pale;
      font-size: 12px; // Use direct value instead of variable
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.7;
    }

    span {
      font-size: 14px; // Use direct value instead of variable
      color: $color-white-moon;
      line-height: 1.6;
    }

    &.full-width {
      grid-column: 1 / -1;
    }
  }
}
</style>
