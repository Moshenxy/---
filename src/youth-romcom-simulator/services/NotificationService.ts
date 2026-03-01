import { reactive } from 'vue';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
}

const state = reactive({
  notifications: [] as Notification[],
});

let nextId = 0;

const actions = {
  show(title: string, message: string, type: NotificationType = 'info', duration: number = 4000) {
    const id = nextId++;
    state.notifications.push({ id, title, message, type });

    if (duration > 0) {
      setTimeout(() => {
        this.hide(id);
      }, duration);
    }
  },

  hide(id: number) {
    const index = state.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      state.notifications.splice(index, 1);
    }
  },

  success(title: string, message: string, duration: number = 4000) {
    this.show(title, message, 'success', duration);
  },

  info(title: string, message: string, duration: number = 4000) {
    this.show(title, message, 'info', duration);
  },

  warn(title: string, message: string, duration: number = 5000) {
    this.show(title, message, 'warning', duration);
  },

  error(title: string, message: string, duration: number = 7000) {
    this.show(title, message, 'error', duration);
  },
};

export const notificationState = state;
export const notificationService = actions;