<template>
  <div class="detail-tab-content grid-layout">
    <div class="detail-item">
      <strong class="detail-key">姓名:</strong>
      <div class="detail-value"><p>{{ npc.姓名 }}</p></div>
    </div>
    <div class="detail-item">
      <strong class="detail-key">生日:</strong>
      <div class="detail-value"><p>{{ formattedBirthDate }} ({{ age }})</p></div>
    </div>
    <div class="detail-item">
      <strong class="detail-key">身份:</strong>
      <div class="detail-value">
        <span v-for="item in Object.values(npc.身份 || {}).filter(v => typeof v === 'string')" class="tag">{{ item }}</span>
      </div>
    </div>
    <div class="detail-item">
      <strong class="detail-key">性别:</strong>
      <div class="detail-value"><p>{{ npc.性别 }}</p></div>
    </div>
    <div class="detail-item">
      <strong class="detail-key">相貌:</strong>
      <div class="detail-value"><p>{{ npc.相貌 }}</p></div>
    </div>
    <div class="detail-item">
      <strong class="detail-key">着装:</strong>
      <div class="detail-value"><p>{{ npc.着装 }}</p></div>
    </div>
    <div class="detail-item">
      <strong class="detail-key">核心需求:</strong>
      <div class="detail-value"><p>{{ npc.心流?.核心需求 }}</p></div>
    </div>
    <div class="detail-item">
      <strong class="detail-key">性格特质:</strong>
      <div class="detail-value">
        <span v-for="item in Object.values(npc.背景?.性格特质 || {}).filter(v => typeof v === 'string')" class="tag">{{ item }}</span>
      </div>
    </div>
    <div class="detail-item">
      <strong class="detail-key">行动倾向:</strong>
      <div class="detail-value">
        <span v-for="(value, tendencyKey) in npc.心流?.驱动力?.决策倾向" :key="tendencyKey" class="tag">
          {{ tendencyKey }}: {{ value }}
        </span>
      </div>
    </div>
    <div class="detail-item full-width">
      <strong class="detail-key">过去经历:</strong>
      <div class="detail-value">
        <ul class="history-list">
          <li v-for="(event, index) in Object.values(npc.背景?.过去经历 || {}).filter(v => typeof v === 'object')" :key="index">
            <strong>{{ event.事件 }}</strong>
            <p v-if="event.描述">{{ event.描述 }}</p>
            <p v-if="event.影响" class="influence-text">{{ event.影响 }}</p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Character } from '../../../types';
import { calculateAge, mainWorld } from '../../../store/getters';

const props = defineProps<{ npc: Character }>();

const age = computed(() => {
  const calculated = calculateAge(props.npc, mainWorld.value);
  return calculated === null ? '未知' : calculated;
});

const formattedBirthDate = computed(() => {
  const bd = props.npc.出生日期;
  if (!bd) return '未知';
  return `${bd.年}年${bd.月}月${bd.日}日`;
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
</style>
