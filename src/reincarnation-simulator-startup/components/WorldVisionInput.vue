<template>
  <div class="world-vision-container">
    <h2 class="title">世界构想</h2>
    <p class="description">请在此输入您对本次轮回世界的初步构想与期望，AI将根据您的描述，为您量身推演出数个独特的开局演化方案。</p>
    <textarea
      v-model="visionText"
      class="vision-textarea"
      placeholder="例如：我希望这是一个末日废土风格的世界，科技与神秘并存，人类在废墟之上建立了新的秩序..."
    ></textarea>
    <button @click="submitVision" class="submit-button" :disabled="isLoading">
      {{ isLoading ? '生成中...' : '生成演化方案' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { store } from '../store';

const visionText = ref(store.worldVisionInput || '');
const isLoading = ref(false);

const emit = defineEmits(['submit']);

const submitVision = () => {
  if (visionText.value.trim() === '') {
    alert('请输入您的世界构想！');
    return;
  }
  isLoading.value = true;
  emit('submit', visionText.value);
};
</script>

<style lang="scss" scoped>
.world-vision-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  width: 80%;
  max-width: 800px;
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
  line-height: 1.6;
}

.vision-textarea {
  width: 100%;
  height: 200px;
  background-color: rgba(0, 0, 0, 0.7);
  border: 1px solid #5a5245;
  border-radius: 4px;
  color: #e0dcd1;
  font-size: 1rem;
  padding: 1rem;
  resize: vertical;
  margin-bottom: 2rem;

  &::placeholder {
    color: #7a7265;
  }
}

.submit-button {
  padding: 0.8rem 2rem;
  font-size: 1.2rem;
  color: #e0dcd1;
  background-color: #5a5245;
  border: 1px solid #8b7355;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #6b6255;
  }

  &:disabled {
    background-color: #3a3225;
    cursor: not-allowed;
  }
}
</style>