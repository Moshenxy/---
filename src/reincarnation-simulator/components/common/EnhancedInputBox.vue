<template>
  <div class="enhanced-input-box-container">
    <div class="input-wrapper">
      <button class="action-button activator" @click="$emit('toggle-action-panel')">∇</button>
      <textarea
        :value="inputValue"
        @input="onInput"
        :placeholder="placeholder"
        @keypress.enter.exact.prevent="submitAction"
      ></textarea>
      <button class="action-button primary" @click="submitAction">执行</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { commandService } from '../../services/CommandService';
import { inputHistoryService } from '../../services/InputHistoryService';
import { inputModalActions, inputModalState } from '../../services/InputModalService';
import { workflowService } from '../../services/WorkflowService';

defineProps({
  placeholder: {
    type: String,
    default: '请输入行动...',
  },
});

const emit = defineEmits(['submit-action', 'toggle-action-panel']);

const inputValue = computed(() => inputModalState.inputValue);
const commands = computed(() => commandService.getCommands());

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  inputModalActions.setValue(target.value);
};

const submitAction = () => {
  const trimmedInput = inputValue.value.trim();
  const hasCommands = commands.value.length > 0;

  if (!trimmedInput && !hasCommands) {
    return;
  }

  if (trimmedInput) {
    inputHistoryService.add(trimmedInput);
  }

  let combinedContent = '';

  if (hasCommands) {
    combinedContent += '[本轮行动指令]\n' + commands.value.map(cmd => `- ${cmd}`).join('\n');
  }

  if (trimmedInput) {
    if (hasCommands) {
      combinedContent += '\n';
    }
    combinedContent += `<行动选择>\n${trimmedInput}\n</行动选择>`;
  }

  workflowService.switchTo('NORMAL', true);
  emit('submit-action', combinedContent);

  commandService.clearCommands();
};
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.input-wrapper {
  display: flex;
  align-items: center;
  padding: $spacing-sm;
  gap: $spacing-sm;
}

textarea {
  flex-grow: 1;
  // ... existing textarea styles if any, or define them
}

.action-button {
  height: 40px;
  min-width: 40px; // 设置一个最小宽度
  padding: 0 10px; // 减小左右内边距
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba($color-gold-liu, 0.5);
  color: $color-gold-pale;
  border-radius: $border-radius-sm;
  font-family: $font-family-main;
  font-size: $font-size-base;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  white-space: nowrap;

  &.activator {
    width: 40px;
    height: 40px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: $font-family-main; // Use main font
    font-size: $font-size-base; // Use base font size
    height: 40px; // 明确设置高度
    background-color: rgba($color-gold-liu, 0.8);
    border-color: $color-gold-pale;
    color: $color-black-void;
    font-weight: bold;
    &:hover {
      background-color: $color-gold-pale;
      box-shadow: 0 0 12px rgba($color-gold-pale, 0.7);
    }
  }

  &:hover {
    background-color: rgba($color-gold-liu, 0.2);
    border-color: $color-gold-liu;
    color: $color-white-moon;
    box-shadow: 0 0 8px rgba($color-gold-liu, 0.5);
  }

  &.primary {
    background-color: rgba($color-gold-liu, 0.8);
    border-color: $color-gold-pale;
    color: $color-black-void;
    font-weight: bold;

    &:hover {
      background-color: $color-gold-pale;
      box-shadow: 0 0 12px rgba($color-gold-pale, 0.7);
    }
  }
}
</style>
