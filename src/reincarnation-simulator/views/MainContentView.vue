<template>
  <div class="main-content-view">
    <div
      class="narrative-container"
      v-html="processedNarrative"
      @mouseover="handleMouseOver"
      @mouseout="handleMouseOut"
    ></div>
    <EnhancedInputBox placeholder="请输入行动..." @submit-action="handleSubmit" />
    <!-- Tooltip -->
    <div v-if="tooltip.visible" class="narrative-tooltip" :style="tooltip.style" v-html="tooltip.content"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import EnhancedInputBox from '../components/common/EnhancedInputBox.vue';
import { combinedNarrative, getItemByName, getNpcByName } from '../store/getters';

const emit = defineEmits(['submit-action']);

const tooltip = reactive({
  visible: false,
  content: '',
  style: {
    top: '0px',
    left: '0px',
  },
});

const processedNarrative = computed(() => {
  let text = combinedNarrative.value;
  // Regex to find <item name="...">...</item> and <npc name="...">...</npc>
  const itemRegex = /<item name="([^"]+)">(.+?)<\/item>/g;
  const npcRegex = /<npc name="([^"]+)">(.+?)<\/npc>/g;

  text = text.replace(itemRegex, (match, name, content) => {
    return `<span class="highlighted-item" data-type="item" data-name="${name}">${content}</span>`;
  });
  text = text.replace(npcRegex, (match, name, content) => {
    return `<span class="highlighted-npc" data-type="npc" data-name="${name}">${content}</span>`;
  });

  return text;
});

const handleMouseOver = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const dataType = target.dataset.type;
  const dataName = target.dataset.name;

  if (!dataType || !dataName) return;

  let entity;
  if (dataType === 'item') {
    entity = getItemByName(dataName);
  } else if (dataType === 'npc') {
    entity = getNpcByName(dataName);
  }

  if (entity) {
    tooltip.content = formatTooltipContent(entity, dataType);
    tooltip.style.top = `${event.clientY + 15}px`;
    tooltip.style.left = `${event.clientX + 15}px`;
    tooltip.visible = true;
  }
};

const handleMouseOut = () => {
  tooltip.visible = false;
};

const formatTooltipContent = (entity: any, type: string): string => {
  if (type === 'item') {
    return `
      <div class="tooltip-title">${entity.名称} [${entity.类型}]</div>
      <div class="tooltip-description">${entity.描述}</div>
      <div class="tooltip-level">能级: ${entity.能级}</div>
    `;
  }
  if (type === 'npc') {
    return `
      <div class="tooltip-title">${entity.姓名}</div>
      <div class="tooltip-description">${entity.外观描述}</div>
      <div class="tooltip-identity">身份: ${entity.身份.join(', ')}</div>
    `;
  }
  return '';
};

const handleSubmit = (action: string) => {
  emit('submit-action', action);
};
</script>

<style lang="scss" scoped>
.main-content-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%; /* Fill the container */
  box-sizing: border-box; /* Ensure padding doesn't add to the width */
  overflow: hidden;
  position: relative; // Needed for tooltip positioning
}

.narrative-container {
  flex-grow: 1;
  overflow-y: auto;
  padding: 1.5rem;
  white-space: pre-wrap;
  line-height: 1.8;
  font-size: 1rem;

  // Use :deep to style the injected span
  :deep(.highlighted-item) {
    color: #007bff;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-style: dotted;
  }

  :deep(.highlighted-npc) {
    color: #28a745;
    cursor: pointer;
    font-weight: 600;
  }
}

.narrative-tooltip {
  position: fixed; // Use fixed to position relative to viewport
  background-color: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 6px;
  padding: 0.75rem;
  z-index: 1100; // Higher than dock-spawn
  pointer-events: none; // Prevent tooltip from interfering with mouse events
  font-size: 0.9rem;
  max-width: 350px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);

  // Use :deep for styles inside v-html
  :deep(.tooltip-title) {
    font-weight: bold;
    margin-bottom: 0.5rem;
    color: #ffc107;
    border-bottom: 1px solid #555;
    padding-bottom: 0.5rem;
  }

  :deep(.tooltip-description) {
    margin-bottom: 0.5rem;
    color: #eee;
  }

  :deep(.tooltip-level),
  :deep(.tooltip-identity) {
    font-style: italic;
    color: #aaa;
    font-size: 0.8rem;
  }
}
</style>
