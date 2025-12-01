<template>
  <div class="cover-page-container">
    <h1 class="main-title">轮回·诸天万界</h1>
    <h2 class="subtitle">创世向导</h2>
    <p class="description">
      汝将执掌创世之权柄，于混沌中开辟一方大千世界，自时光长河中唤醒一缕神魂，赋予其姓名、过往与天命。此间种种，皆由汝定。
    </p>
    <button class="start-btn" @click="startCreation">开启创世</button>
  </div>
</template>

<script setup>
import { navigate } from '../store';

const startCreation = () => {
  navigate(1); // 前往下一页
};
</script>

<style scoped>
.cover-page-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  animation: fadeIn 1.5s ease-in-out;
}

.main-title {
  font-family: var(--font-family-title);
  font-size: 4.5rem;
  color: var(--color-gold-pale);
  text-shadow: 0 0 15px rgba(212, 175, 55, 0.6);
  margin-bottom: 0.5rem;
}

.subtitle {
  font-family: var(--font-family-main);
  font-size: 1.8rem;
  color: var(--color-cyan-tian);
  letter-spacing: 4px;
  margin-top: 0;
  margin-bottom: 4rem;
}

.description {
  font-size: 1.2rem;
  max-width: 600px;
  line-height: 2.2;
  color: var(--color-white-moon);
  margin-bottom: 5rem;
}

.start-btn {
  padding: 1rem 2.5rem;
  font-family: var(--font-family-title);
  font-size: 1.5rem;
  color: var(--color-black-void);
  background-color: var(--color-gold-liu);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.7);
}

.start-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 25px rgba(212, 175, 55, 0.9);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
