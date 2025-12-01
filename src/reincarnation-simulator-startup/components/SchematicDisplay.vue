<template>
  <div class="schematic-display">
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="grad-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:rgba(212, 175, 55, 0.3)" />
          <stop offset="100%" style="stop-color:rgba(212, 175, 55, 0)" />
        </radialGradient>
        <radialGradient :id="relicsGradientId" cx="50%" cy="50%" r="50%">
          <stop v-for="(color, index) in relicsGradient.colors" :key="index" :offset="`${relicsGradient.offsets[index]}%`" :style="`stop-color:${color}`" />
        </radialGradient>
      </defs>
      
      <!-- Base Glow -->
      <circle cx="100" cy="100" r="90" fill="url(#grad-glow)" :stroke-width="glowStrokeWidth" stroke="rgba(212, 175, 55, 0.2)" />

      <!-- Dynamic Schematics -->
      <g :key="store.selections.blueprint">
        <g v-if="store.selections.blueprint === 'bp-standard'">
          <circle cx="100" cy="100" r="2" :fill="`url(#${relicsGradientId})`" />
          <circle cx="100" cy="100" r="30" :stroke="toneColor" stroke-width="0.5" fill="none" stroke-dasharray="2 2"/>
          <circle cx="100" cy="100" r="60" :stroke="toneColor" stroke-width="0.5" fill="none" stroke-dasharray="4 4"/>
        </g>
        <g v-if="store.selections.blueprint === 'bp-crystal-wall'">
            <circle cx="100" cy="100" r="70" :stroke="toneColor" stroke-width="1" :fill="`url(#${relicsGradientId})`" fill-opacity="0.1"/>
            <circle cx="100" cy="100" r="5" :fill="`url(#${relicsGradientId})`"/>
        </g>
        <g v-if="store.selections.blueprint === 'bp-multiverse'">
            <path v-for="i in 5" :key="i" :d="`M ${30 + i*25} 50 A 50 50 0 1 1 ${30 + i*25} 150`" :stroke="toneColor" stroke-width="0.5" fill="none" opacity="0.6"/>
        </g>
        <g v-if="store.selections.blueprint === 'bp-planar'">
            <rect x="30" y="99" width="140" height="2" :fill="`url(#${relicsGradientId})`"/>
            <rect x="50" y="70" width="100" height="1" :fill="toneColor" opacity="0.5"/>
            <rect x="50" y="130" width="100" height="1" :fill="toneColor" opacity="0.5"/>
        </g>
        <g v-if="store.selections.blueprint === 'bp-myriad'">
            <circle v-for="i in 15" :key="i" :cx="Math.random()*140+30" :cy="Math.random()*140+30" :r="Math.random()*5+2" :fill="toneColor" opacity="0.7"/>
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { store, GAME_DATA } from '../store';

const toneColor = computed(() => {
  const tone = GAME_DATA.tones.find(t => t.id === store.selections.tone);
  return tone ? tone.color : 'var(--color-cyan-tian)';
});

const glowStrokeWidth = computed(() => {
  return 0.5 + (store.selections.tags.length * 0.5);
});

const relicsGradientId = computed(() => `relics-grad-${store.selections.relics.join('-')}`);
const relicsGradient = computed(() => {
  const selectedRelics = GAME_DATA.relics.filter(r => store.selections.relics.includes(r.id));
  if (selectedRelics.length === 0) {
    return { colors: ['var(--color-gold-liu)'], offsets: [100] };
  }
  const colors = selectedRelics.map(r => r.color);
  const offsets = colors.map((_, i) => (i / (colors.length -1 || 1)) * 100);
  return { colors, offsets };
});
</script>

<style scoped>
.schematic-display {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  box-sizing: border-box;
}
svg {
  width: 100%;
  max-width: 300px;
  animation: slow-rotate 60s linear infinite;
}
@keyframes slow-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
g {
  animation: fadeIn 0.8s ease-in-out;
}
</style>