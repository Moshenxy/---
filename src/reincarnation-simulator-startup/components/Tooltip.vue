<template>
  <div class="tooltip-wrapper" @mouseenter="showTooltip" @mouseleave="hideTooltip">
    <slot></slot>
    <div v-if="visible" class="tooltip-content" :style="{ top: tooltipTop, left: tooltipLeft }">
      {{ content }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
});

const visible = ref(false);
const tooltipTop = ref('0px');
const tooltipLeft = ref('0px');

const showTooltip = (event) => {
  const rect = event.target.getBoundingClientRect();
  tooltipTop.value = `${rect.bottom + 8}px`; // 增加一点距离
  tooltipLeft.value = `${rect.left}px`;
  visible.value = true;
};

const hideTooltip = () => {
  visible.value = false;
};
</script>

<style scoped>
.tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.tooltip-content {
  position: fixed;
  background-color: rgba(10, 15, 30, 0.95); /* 更深的背景 */
  backdrop-filter: blur(8px); /* 毛玻璃效果 */
  color: #e0e0e0; /* 柔和的白色字体 */
  padding: 14px 20px; /* 更大的内边距 */
  border-radius: 8px; /* 更圆润的边角 */
  border: 1px solid rgba(212, 175, 55, 0.5); /* 金色边框 */
  font-size: 0.95em;
  line-height: 1.7;
  font-family: var(--font-family-main);
  z-index: 1000;
  max-width: 380px;
  white-space: pre-wrap; /* 保持换行 */
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7); /* 更深的阴影 */
  pointer-events: none;
  opacity: 1; /* 默认可见，由v-if控制 */
  transition: opacity 0.2s ease-in-out;
}
</style>
