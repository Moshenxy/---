import { reactive } from 'vue';

interface ConfirmationState {
  isVisible: boolean;
  title: string;
  message: string;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
  hideCancel: boolean;
}

const state = reactive<ConfirmationState>({
  isVisible: false,
  title: '',
  message: '',
  onConfirm: null,
  onCancel: null,
  hideCancel: false,
});

export const confirmationService = {
  get state() {
    return state;
  },

  show(title: string, message: string, onConfirm: () => void, hideCancel = false) {
    return new Promise<boolean>(resolve => {
      state.title = title;
      state.message = message;
      state.onConfirm = () => {
        onConfirm();
        resolve(true);
      };
      state.onCancel = () => {
        this.hide();
        resolve(false);
      };
      state.hideCancel = hideCancel;
      state.isVisible = true;
    });
  },

  hide() {
    state.isVisible = false;
    state.title = '';
    state.message = '';
    state.onConfirm = null;
    state.onCancel = null;
    state.hideCancel = false;
  },

  confirm() {
    if (state.onConfirm) {
      state.onConfirm(); // This will now also resolve the promise
    }
    // Hiding is handled within onConfirm/onCancel now
  },
  cancel() {
    if (state.onCancel) {
      state.onCancel();
    }
  },
};
