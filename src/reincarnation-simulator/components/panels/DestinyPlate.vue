<template>
  <div class="destiny-plate-container">
    <div class="destiny-plate">
      <!-- 静态装饰性星轨 -->
      <div class="static-orbit orbit-1"></div>
      <div class="static-orbit orbit-2"></div>
      <div class="static-orbit orbit-3"></div>
      <div class="static-orbit orbit-4"></div>

      <!-- 中央核心区域 -->
      <div class="plate-center">
        <div class="plate-core">
          <span class="core-title">{{ centerTitle }}</span>
          <div class="core-description">{{ centerDescription }}</div>
        </div>
      </div>

      <!-- 内环: 核心本质 -->
      <div class="inner-ring">
        <div
          v-for="(node, index) in innerRingNodes"
          :key="node.id"
          class="node inner-node"
          :style="{ '--angle': (index / innerRingNodes.length) * 360 + 'deg' }"
          @mouseenter="setCenterContent(node)"
          @mouseleave="resetCenterContent"
        >
          <span class="node-name">{{ node.name }}</span>
          <span class="node-value">{{ node.value }}</span>
        </div>
      </div>

      <!-- 中环: 战斗参数 -->
      <div class="middle-ring">
        <div
          v-for="(param, index) in combatParams"
          :key="param.id"
          class="node param-node"
          :style="{ '--angle': (index / combatParams.length) * 360 + 18 + 'deg' }"
          @mouseenter="setCenterContent(param)"
          @mouseleave="resetCenterContent"
        >
          <span class="node-name">{{ param.name }}</span>
          <span class="node-value">{{ param.value }}</span>
        </div>
      </div>

      <!-- 外环: 世界专属属性 -->
      <div class="outer-ring">
        <template v-for="(attr, index) in orbitalNodes" :key="attr.id">
          <!-- 类型为 'orbit' 的星轨 -->
          <div
            v-if="attr.type === 'orbit'"
            class="orbit-track"
            :style="{ '--angle': (index / orbitalNodes.length) * 360 + 'deg' }"
          >
            <svg class="orbit-svg" viewBox="0 0 100 100">
              <circle class="track" cx="50" cy="50" r="45" />
              <circle
                class="progress"
                cx="50"
                cy="50"
                r="45"
                :style="{ 'stroke-dashoffset': 283 * (1 - (typeof attr.value === 'number' && typeof attr.max === 'number' && attr.max > 0 ? attr.value / attr.max : 0)) }"
              />
            </svg>
            <div class="orbit-label" @mouseenter="setCenterContent(attr)" @mouseleave="resetCenterContent">
              {{ attr.name }}
            </div>
          </div>
          <!-- 类型为 'node' 的普通节点 -->
          <div
            v-else
            class="node world-node"
            :style="{ '--angle': (index / orbitalNodes.length) * 360 + 'deg' }"
            @mouseenter="setCenterContent(attr)"
            @mouseleave="resetCenterContent"
          >
            <span class="node-name">{{ attr.name }}</span>
            <span v-if="attr.value !== null" class="node-value">{{ attr.value }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType, ref } from 'vue';
import { store } from '../../store';
import type { Character } from '../../types';

const props = defineProps({
  character: {
    type: Object as PropType<Character | null>,
    default: null,
  },
});

const defaultTitle = '命盘';
const defaultDescription = '窥见命运的轨迹';

const centerTitle = ref(defaultTitle);
const centerDescription = ref(defaultDescription);

const getDisplayValue = (value: any, defaultValue: any = 0) => {
  if (value === null || value === undefined) return defaultValue;
  return value;
};

const formatComplexValue = (value: any): string | number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object' && !Array.isArray(value)) {
    const keys = Object.keys(value).filter(k => k !== '$meta' && k !== 'description');
    if (keys.includes('value')) return getDisplayValue(value.value);
    if (keys.length > 0 && keys.every(k => typeof value[k] === 'object' && value[k]?.名称)) {
      return value[keys[0]].名称; // 只显示第一个作为代表
    }
    if (keys.length === 1) return formatComplexValue(value[keys[0]]);
    return '...';
  }
  return value;
};

// 统一数据源，优先使用 prop，回退到 store
const characterData = computed(() => props.character || store.character);

// 内环数据
const innerRingNodes = computed(() => {
  const char = characterData.value;
  return [
    { id: 'name', name: '真名', value: getDisplayValue(char?.真名, '无'), description: '于此世的真正名讳' },
    { id: 'soul', name: '本源', value: getDisplayValue(char?.灵魂本源, 0), description: '穿梭诸天的核心能量' },
    { id: 'dao', name: '道心', value: getDisplayValue(char?.道心, 0), description: '对抗侵蚀的意志壁垒' },
    {
      id: 'jing',
      name: '精',
      value: getDisplayValue(char?.基础潜力?.精),
      description: '灵魂对物理存在的干涉与塑造潜力',
    },
    { id: 'qi', name: '气', value: getDisplayValue(char?.基础潜力?.气), description: '灵魂与外界能量的交互潜力' },
    { id: 'shen', name: '神', value: getDisplayValue(char?.基础潜力?.神), description: '灵魂的感知、计算与意志潜力' },
    { id: 'yun', name: '运', value: getDisplayValue(char?.基础潜力?.运), description: '灵魂与命运、因果的神秘联系' },
  ];
});

// 中环数据
const combatParams = computed(() => {
  const char = characterData.value;
  return [
    {
      id: 'quanneng',
      name: '权能',
      value: getDisplayValue(char?.战斗参数?.权能),
      description: '角色对外界现实施加影响、改变事物的综合能力',
    },
    {
      id: 'genji',
      name: '根基',
      value: getDisplayValue(char?.战斗参数?.根基),
      description: '角色维持自身存在、抵抗外界侵蚀的综合能力',
    },
    {
      id: 'jibian',
      name: '机变',
      value: getDisplayValue(char?.战斗参数?.机变),
      description: '角色在冲突中把握时机、创造变数的能力',
    },
    {
      id: 'pofa',
      name: '破法',
      value: getDisplayValue(char?.战斗参数?.破法),
      description: '角色无视、穿透、或破解对方防御规则的能力',
    },
    {
      id: 'yufa',
      name: '御法',
      value: getDisplayValue(char?.战斗参数?.御法),
      description: '角色运用规则来强化自身防御的能力',
    },
  ];
});

// 外环数据
const orbitalNodes = computed(() => {
  const attrs = characterData.value?.世界专属属性 || {};
  const specialKeys = ['修为信息', '命途契合度'];

  return Object.entries(attrs)
    .filter(([key]) => key !== '$meta')
    .map(([key, attrValue]) => {
      const isSpecial = specialKeys.includes(key);
      let description = `世界属性: ${key}`;
      let value: string | number | null = null;
      let type: 'node' | 'orbit' = 'node';
      let max: number | string = 'MAX';

      if (typeof attrValue === 'object' && attrValue !== null) {
        description = (attrValue as any).description || description;
        const valueKeys = Object.keys(attrValue).filter(k => k !== '$meta' && k !== 'description');

        if (('current' in attrValue || '当前' in attrValue) && ('max' in attrValue || '上限' in attrValue)) {
          type = 'orbit';
          value = getDisplayValue((attrValue as any).当前 ?? (attrValue as any).current, 0);
          max = getDisplayValue((attrValue as any).上限 ?? (attrValue as any).max, 100);
          description = `${key}: ${value} / ${max}`;
        } else if ('value' in attrValue) {
          value = getDisplayValue((attrValue as any).value, '-');
        } else if (valueKeys.length > 0 && valueKeys.every(k => typeof (attrValue as any)[k] === 'object' && (attrValue as any)[k]?.名称)) {
          value = valueKeys.map(k => (attrValue as any)[k].名称).join('、');
        } else if (valueKeys.length > 0) {
          value = '...';
          description = valueKeys.map(k => `${k}: ${getDisplayValue((attrValue as any)[k])}`).join(' | ');
        }
      } else {
        value = getDisplayValue(attrValue, '-');
      }

      return { id: key, name: key, value, max, type, description, isSpecial };
    });
});

const setCenterContent = (item: { name: string; description?: string }) => {
  centerTitle.value = item.name;
  centerDescription.value = item.description || '';
};

const resetCenterContent = () => {
  centerTitle.value = defaultTitle;
  centerDescription.value = defaultDescription;
};
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.destiny-plate-container {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  container-type: size; // Enable container queries for both width and height
}

.destiny-plate {
  position: relative;
  // Size the plate to fit the smaller of the container's width or height
  width: min(98cqw, 98cqh); // Use 98% to leave a small margin
  height: min(98cqw, 98cqh);

  // The font-size that drives all `em` units should be based on the container's width.
  // Let's make it 2% of the container's width, with min/max guards.
  font-size: clamp(5px, 2cqw, 14px);

  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(25, 28, 40, 0.9) 0%, rgba(10, 12, 23, 0.95) 70%);
}

.static-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 1px solid rgba($color-white-moon, 0.05);
  transform: translate(-50%, -50%);
  &.orbit-1 {
    width: 20em;
    height: 20em;
  }
  &.orbit-2 {
    width: 32em;
    height: 32em;
  }
  &.orbit-3 {
    width: 44em;
    height: 44em;
  }
  &.orbit-4 {
    width: 56em;
    height: 56em;
  }
}

.plate-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12em;
  height: 12em;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(100, 110, 130, 0.1) 0%, rgba(50, 55, 70, 0.05) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  z-index: 20;
  transition: all 0.3s ease;
  border: 1px solid rgba($color-gold-liu, 0.2);
  box-shadow: 0 0 1em rgba($color-gold-pale, 0.1);

  .core-title {
    font-size: 1.8em;
    font-family: $font-family-title;
    color: $color-gold-pale;
  }
  .core-description {
    font-size: 1.1em;
    color: $color-grey-stone;
    line-height: 1.3;
    margin-top: 0.5em;
  }
}

.node {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  cursor: pointer;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border-color 0.3s ease;

  transform: rotate(var(--angle)) translateX(var(--radius)) rotate(calc(-1 * var(--angle)));

  &:hover {
    transform: rotate(var(--angle)) translateX(var(--radius)) rotate(calc(-1 * var(--angle))) scale(1.15);
    z-index: 30;
  }

  .node-name {
    color: $color-white-moon;
  }
  .node-value {
    color: $color-cyan-tian;
  }
}

.inner-node {
  --radius: 10em;
  width: 6em;
  height: 6em;
  margin: -3em;
  background-color: rgba($color-indigo-deep, 0.6);
  border: 1px solid rgba($color-cyan-tian, 0.3);
  .node-name {
    font-size: 1.6em;
  }
  .node-value {
    font-size: 1.4em;
  }
}

.param-node {
  --radius: 16em;
  width: 5.6em;
  height: 5.6em;
  margin: -2.8em;
  background-color: rgba($color-black-void, 0.7);
  border: 1px solid rgba($color-gold-liu, 0.4);
  .node-name {
    font-size: 1.4em;
    color: $color-gold-pale;
  }
  .node-value {
    font-size: 1.2em;
  }
}

.world-node {
  --radius: 22em;
  width: 5em;
  height: 5em;
  margin: -2.5em;
  background-color: rgba(43, 44, 66, 0.7);
  border: 1px solid rgba($color-cyan-tian, 0.3);

  .node-name {
    font-size: 1.2em;
    color: $color-gold-pale;
  }
  .node-value {
    font-size: 1.1em;
  }

  &.is-special {
    background-color: rgba(80, 30, 30, 0.8);
    border: 1px solid rgba($color-red-chi, 0.5);
    box-shadow: 0 0 0.8em rgba($color-red-chi, 0.3);
  }
}

.orbit-track {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8em;
  height: 8em;
  margin: -4em;
  transform: rotate(var(--angle)) translateX(22em) rotate(calc(-1 * var(--angle)));
  z-index: 5;

  .orbit-svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
    .track {
      fill: none;
      stroke: rgba($color-white-moon, 0.1);
      stroke-width: 4;
    }
    .progress {
      fill: none;
      stroke: $color-cyan-tian;
      stroke-width: 4;
      stroke-dasharray: 283;
      transition: stroke-dashoffset 0.5s ease;
    }
  }

  .orbit-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: $color-white-moon;
    font-size: 1em;
    cursor: pointer;
    width: 100%;
    text-align: center;
  }
}
</style>
