import { reactive, readonly } from 'vue';
import { store } from '../store';

interface InputModalState {
  isVisible: boolean;
  inputValue: string;
  lastSubmittedValue: string;
}

const STORAGE_KEY = 'reincarnation-simulator-input-value';
const LAST_SUBMITTED_STORAGE_KEY = 'reincarnation-simulator-last-submitted';

const state = reactive<InputModalState>({
  isVisible: false,
  inputValue: localStorage.getItem(STORAGE_KEY) || '',
  lastSubmittedValue: localStorage.getItem(LAST_SUBMITTED_STORAGE_KEY) || '',
});

const actions = {
  show(): void {
    if (store.generationError) {
      // 如果存在生成错误，则恢复上次提交的内容
      state.inputValue = state.lastSubmittedValue;
    }
    state.isVisible = true;
  },

  hide(): void {
    state.isVisible = false;
  },

  setValue(value: string): void {
    state.inputValue = value;
    localStorage.setItem(STORAGE_KEY, value);
  },

  setLastSubmittedValue(value: string): void {
    state.lastSubmittedValue = value;
    localStorage.setItem(LAST_SUBMITTED_STORAGE_KEY, value);
  },

  clearValue(): void {
    state.inputValue = '';
    localStorage.removeItem(STORAGE_KEY);
  },
};

export const inputModalState = readonly(state);
export const inputModalActions = actions;