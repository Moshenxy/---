<template>
  <div class="generation-progress-container">
    <div class="schematic-box">
      <SchematicDisplay />
    </div>
    <div class="progress-bar-container">
      <div class="progress-bar" :style="{ width: progress + '%' }"></div>
    </div>
    <p class="progress-text">正在为您推演诸天万界... {{ progress }}%</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import SchematicDisplay from './SchematicDisplay.vue';

const progress = ref(0);

onMounted(() => {
  const interval = setInterval(() => {
    if (progress.value < 99) {
      progress.value += 1;
    } else {
      clearInterval(interval);
    }
  }, 1212); // 2 minutes / 99 steps
});
</script>

<style scoped>
.generation-progress-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.schematic-box {
  width: 300px;
  height: 300px;
  margin-bottom: 2rem;
}
.progress-bar-container {
  width: 80%;
  max-width: 500px;
  height: 20px;
  background-color: var(--color-indigo-deep);
  border: 1px solid var(--color-gold-liu);
  border-radius: 10px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background-color: var(--color-gold-liu);
  transition: width 0.5s ease-out;
}
.progress-text {
  margin-top: 1rem;
  font-size: 1.2rem;
  color: var(--color-gold-pale);
}
</style>
