<template>
  <div class="loading-overlay">
    <div class="loading-content">
      <div v-if="error" class="error-container">
        <h3 class="error-title">次元紊乱</h3>
        <p class="error-message">{{ error }}</p>
        <p class="error-tip">请检查网络连接或稍后再试。</p>
      </div>
      <div v-else>
        <p class="tip">{{ randomTip }}</p>
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="progress-text">思考中...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps<{
  error: string | null;
}>();

const tips = [
  '正在确认二次元通道的链接稳定性...',
  '雪之下雪乃正在暗中观察一只流浪猫。',
  '由比滨结衣正在尝试制作某种形状不可名状的曲奇。',
  '一色彩羽正在寻找可以帮忙搬运学生会杂物的“老好人学长”。',
  '平冢静老师的相亲似乎又失败了，正在拉面店独自喝着闷酒。',
  '比企谷八幡正在自动贩卖机前犹豫，今天要不要再来一罐MAX咖啡。',
  '户塚彩加正在网球部被过度友好的男同学们包围着。',
  '霞之丘诗羽学姐正在取材，请注意不要成为她下一本小说里的反派。',
  '英梨梨的截稿日似乎又要到了，美术室里传来了悲鸣。',
  '一个粉色头发的社恐吉他手正躲在楼梯拐角的纸箱里。',
  '学生会长白银御行因睡眠不足，眼神变得更加凶恶了。',
  '藤原书记又发明了新的桌游，学生会室充满了混沌的气息。',
];

const randomTip = ref('');
const progress = ref(0);
let progressInterval: number | null = null;

onMounted(() => {
  if (!props.error) {
    startProgress();
  }
});

onUnmounted(() => {
  stopProgress();
});

watch(() => props.error, (newError) => {
  if (newError) {
    stopProgress();
  }
});

function startProgress() {
  // 随机选择一条提示
  randomTip.value = tips[Math.floor(Math.random() * tips.length)];
  
  // 启动进度条
  progress.value = 0;
  progressInterval = window.setInterval(() => {
    if (progress.value < 99) {
      progress.value += 1;
    } else {
      stopProgress();
    }
  }, 90000 / 99); // 90 seconds for 99%
}

function stopProgress() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}
</script>

<style lang="scss" scoped>
@use '../styles/theme/variables' as *;
@use '../styles/theme/mixins' as *;

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  @include frosted-glass(rgba($color-black-void, 0.8), 10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  background-color: $color-indigo-deep;
  border: 1px solid rgba($color-gold-liu, 0.5);
  border-radius: $border-radius-md;
  padding: $spacing-xl;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-lg;
  width: 80%;
  max-width: 500px;
  text-align: center;

  .tip {
    font-family: $font-family-main;
    font-size: 15px;
    color: #a9a9a9;
    line-height: 1.7;
    font-style: italic;
  }

  .progress-bar-container {
    width: 100%;
    height: 4px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    margin-top: 5px;
  }

  .progress-bar {
    height: 100%;
    background-color: #a9a9a9;
    transition: width 0.2s linear;
    border-radius: 2px;
  }

  .progress-text {
    font-family: $font-family-main;
    font-size: 13px;
    color: #6c757d;
    margin-top: 10px;
      }
    
      .error-container {
        .error-title {
          color: $color-red-chi;
          font-family: $font-family-title;
          font-size: $font-size-h1;
          margin-bottom: $spacing-md;
          text-shadow: 0 0 8px rgba($color-red-chi, 0.6);
        }
        .error-message {
          color: $color-white-moon;
          font-size: $font-size-base;
          margin-bottom: $spacing-lg;
        }
        .error-tip {
          color: $color-grey-stone;
          font-size: $font-size-small;
        }
      }
    }
    </style>
