<template>
  <div class="loading-overlay">
    <div class="loading-content">
      <div v-if="error" class="error-container">
        <h3 class="error-title">天机紊乱</h3>
        <p class="error-message">{{ error }}</p>
        <p class="error-tip">请检查网络连接或稍后再试。</p>
      </div>
      <div v-else>
        <p class="tip">{{ randomTip }}</p>
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="progress-text"><span class="highlight">轮回</span>回应中... {{ Math.floor(progress) }}%</span>
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
  '开局不利？尝试在不同的世界寻找机缘，或许能固化改变命运的烙印。',
  '灵魂本源是宝贵的资源，用它来继承天赋或装备，能让你在下一次轮回中走得更远。',
  '高能级的世界往往伴随着高风险，但其产出的轮回烙印也更为强大。',
  '如何重新演化天机？在“轮回”面板中，点击“重演天机”，即可发现新的世界。',
  '与NPC建立良好的关系，可能会在不经意间触发隐藏的命运节点。',
  '诸天万界，每一个选择都可能引发蝴蝶效应，谨慎行事。',
  '有时候，放弃也是一种智慧。当世的终结，或许是下一世更好的开端。',
  '留意世界日志中的摘要，那里面隐藏着后台世界的风起云涌。',
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

watch(
  () => props.error,
  newError => {
    if (newError) {
      stopProgress();
    }
  },
);

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
    font-size: $font-size-large;
    color: $color-gold-pale;
    line-height: 1.6;
    text-shadow: 0 0 5px $color-gold-pale;
  }

  .progress-bar-container {
    width: 100%;
    height: 12px;
    background-color: rgba($color-black-void, 0.5);
    border-radius: 6px;
    border: 1px solid rgba($color-gold-liu, 0.4);
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, $color-cyan-tian, $color-gold-liu);
    transition: width 0.2s linear;
    border-radius: 6px;
  }

  .progress-text {
    font-family: $font-family-title;
    font-size: $font-size-base;
    color: $color-grey-stone;

    .highlight {
      color: $color-gold-pale;
      font-weight: bold;
      text-shadow: 0 0 5px rgba($color-gold-liu, 0.7);
    }
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
