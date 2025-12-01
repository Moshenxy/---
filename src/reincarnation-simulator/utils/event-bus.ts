import { ref } from 'vue';

type EventListener = (...args: any[]) => void;

class EventBus {
  private events: { [key: string]: EventListener[] } = {};

  on(event: string, callback: EventListener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: EventListener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== callback);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(...args));
  }
}

export const eventBus = new EventBus();