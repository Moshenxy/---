<template>
  <h1>纪元之书 · 卷三</h1>
  <h2>塑造潜力，奠定道基</h2>
  <div id="potential-allocation" class="potential-grid">
    <div v-for="(potential, key) in GAME_DATA.potentials" :key="key" class="potential-item">
      <h4>{{ potential.name }}</h4>
      <div class="potential-controls">
        <button type="button" @click="handlePotentialClick(key, -1)">-</button>
        <span>{{ potential.base + (store.potentialPoints[key] || 0) }}</span>
        <button type="button" @click="handlePotentialClick(key, 1)">+</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { store, GAME_DATA } from '../store';

const handlePotentialClick = (potential: keyof typeof GAME_DATA.potentials, amount: number) => {
  const change = amount;
  const cost = GAME_DATA.potentials[potential]?.cost || 0;
  const currentPoints = store.potentialPoints[potential] || 0;

  if (change > 0) {
    if (store.remainingPoints >= cost) {
      store.potentialPoints[potential] = currentPoints + change;
    } else {
      console.warn('创世点数不足！');
    }
  } else if (change < 0) {
    const finalPoints = currentPoints + change;
    if (finalPoints >= 0) {
      store.potentialPoints[potential] = finalPoints;
    }
  }
};
</script>