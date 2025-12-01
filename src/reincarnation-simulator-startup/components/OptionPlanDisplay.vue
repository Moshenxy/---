<template>
  <div class="option-plan-container">
    <h2 class="title">世界演化方案</h2>
    <p class="description">AI已根据您的构想，推演出以下开局方案。请选择其一，开启您的轮回之旅。</p>
    <div class="plan-list">
      <div v-for="plan in plans" :key="plan.planId" class="plan-card">
        <h3 class="plan-title">{{ plan.title }}</h3>
        <p class="plan-description">{{ plan.description }}</p>
        <ul class="option-list">
          <li v-for="option in plan.options" :key="option.optionId" class="option-item">
            {{ option.text }}
          </li>
        </ul>
        <div class="button-group">
          <button @click="$emit('show-details')" class="details-button">查阅新选项</button>
          <button @click="selectPlan(plan)" class="select-button">选择此方案</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

interface Option {
  optionId: string;
  text: string;
}

interface Plan {
  planId: string;
  title: string;
  description: string;
  options: Option[];
}

defineProps<{
  plans: Plan[];
}>();

const emit = defineEmits(['select', 'show-details']);

const selectPlan = (plan: Plan) => {
  emit('select', plan);
};
</script>

<style lang="scss" scoped>
.option-plan-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  width: 90%;
  max-width: 1200px;
  margin: auto;
}

.title {
  font-size: 2rem;
  color: #e0dcd1;
  margin-bottom: 1rem;
}

.description {
  font-size: 1rem;
  color: #a0998f;
  margin-bottom: 2rem;
  text-align: center;
}

.plan-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  width: 100%;
}

.plan-card {
  background-color: rgba(0, 0, 0, 0.6);
  border: 1px solid #5a5245;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.plan-title {
  font-size: 1.5rem;
  color: #c9aa71;
  margin-bottom: 1rem;
}

.plan-description {
  color: #a0998f;
  margin-bottom: 1.5rem;
  flex-grow: 1;
}

.option-list {
  list-style-type: none;
  padding: 0;
  margin-bottom: 2rem;
}

.option-item {
  color: #e0dcd1;
  margin-bottom: 0.5rem;
  padding-left: 1rem;
  position: relative;

  &::before {
    content: '◈';
    color: #c9aa71;
    position: absolute;
    left: 0;
  }
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: auto;
}

.details-button,
.select-button {
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  text-align: center;
}

.select-button {
  color: #e0dcd1;
  background-color: #5a5245;
  border: 1px solid #8b7355;
  &:hover {
    background-color: #6b6255;
  }
}

.details-button {
  color: #c9aa71;
  background-color: transparent;
  border: 1px solid #5a5245;
  &:hover {
    background-color: rgba(90, 82, 69, 0.5);
  }
}
</style>
