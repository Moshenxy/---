<template>
  <svg viewBox="-20 -20 40 40" class="faction-icon">
    <g :transform="`rotate(${rotation})`">
      <path :d="shapePath" :fill="fillColor" :stroke="strokeColor" stroke-width="2" />
      <circle v-if="hasCore" cx="0" cy="0" :r="coreRadius" :fill="coreColor" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { themeColors } from '../../styles/theme/theme';

const props = defineProps<{
  type: string;
  seed: string;
}>();

// Simple seeded PRNG
function mulberry32(a: number) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

const seededRandom = mulberry32(hashCode(props.seed));

// --- Procedural Generation Logic ---

const rotation = computed(() => seededRandom() * 360);
const hasCore = computed(() => seededRandom() > 0.3);
const coreRadius = computed(() => 5 + seededRandom() * 3);

const fillColor = computed(() => {
  const colors = [themeColors.indigoDeep, 'none', themeColors.charcoalGlass];
  return colors[Math.floor(seededRandom() * colors.length)];
});

const strokeColor = computed(() => {
  if (props.type === '修行宗门') {
    return themeColors.cyanTian;
  }
  if (props.type === '科技组织') {
    return themeColors.goldLiu;
  }
  return themeColors.greyStone;
});

const coreColor = computed(() => {
    return seededRandom() > 0.5 ? themeColors.goldPale : themeColors.redChi;
});

const shapePath = computed(() => {
  const points = 3 + Math.floor(seededRandom() * 5); // 3 to 7 points
  const radius1 = 10 + seededRandom() * 8;
  const radius2 = props.type === '科技组织' ? radius1 : 5 + seededRandom() * 5;

  let path = '';
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const r = i % 2 === 0 ? radius1 : radius2;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    path += `${i === 0 ? 'M' : 'L'}${x},${y} `;
  }
  return path + 'Z';
});

</script>

<style scoped>
.faction-icon {
  width: 24px;
  height: 24px;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
}
.faction-icon:hover {
  transform: scale(1.5);
}
</style>