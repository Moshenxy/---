import { reactive, markRaw, readonly } from 'vue';
import type { Component } from 'vue';

interface DetailModalState {
  isVisible: boolean;
  component: Component | null;
  props: Record<string, any>;
  title: string;
}

const state = reactive<DetailModalState>({
  isVisible: false,
  component: null,
  props: {},
  title: '',
});

export const detailModalService = {
  /**
   * The reactive state of the detail modal.
   */
  state: readonly(state),

  /**
   * Shows a modal with a specified component and props.
   * @param title The title to display in the modal header.
   * @param component The Vue component to render inside the modal.
   * @param props The props to pass to the component.
   */
  show(title: string, component: Component, props: Record<string, any> = {}) {
    state.title = title;
    state.component = markRaw(component);
    state.props = props;
    state.isVisible = true;
  },

  /**
   * Hides the currently visible modal.
   */
  hide() {
    state.isVisible = false;
    // Delay clearing to allow for fade-out animations
    setTimeout(() => {
      state.component = null;
      state.props = {};
      state.title = '';
    }, 300);
  },
};
