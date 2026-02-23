import { reactive } from 'vue';

const MAX_RECENT_HISTORY = 5;
const MAX_SAVED_HISTORY = 5;
const STORAGE_KEY_RECENT = 'reincarnation_input_history_recent';
const STORAGE_KEY_SAVED = 'reincarnation_input_history_saved';

class InputHistoryService {
  public state = reactive({
    recent: [] as string[],
    saved: [] as string[],
  });

  constructor() {
    this.loadHistory();
  }

  private loadHistory() {
    const recentData = localStorage.getItem(STORAGE_KEY_RECENT);
    const savedData = localStorage.getItem(STORAGE_KEY_SAVED);
    if (recentData) {
      this.state.recent = JSON.parse(recentData);
    }
    if (savedData) {
      this.state.saved = JSON.parse(savedData);
    }
  }

  private saveHistory() {
    localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(this.state.recent));
    localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(this.state.saved));
  }

  add(input: string) {
    if (!input || input.trim() === '') {
      return;
    }
    // Avoid duplicates
    const existingIndex = this.state.recent.indexOf(input);
    if (existingIndex > -1) {
      this.state.recent.splice(existingIndex, 1);
    }

    this.state.recent.unshift(input);
    if (this.state.recent.length > MAX_RECENT_HISTORY) {
      this.state.recent.pop();
    }
    this.saveHistory();
  }

  save(entry: string) {
    if (this.state.saved.includes(entry)) {
      return;
    }

    this.state.saved.unshift(entry);
    if (this.state.saved.length > MAX_SAVED_HISTORY) {
      this.state.saved.pop();
    }
    this.saveHistory();
  }

  deleteRecent(index: number) {
    this.state.recent.splice(index, 1);
    this.saveHistory();
  }

  deleteSaved(index: number) {
    this.state.saved.splice(index, 1);
    this.saveHistory();
  }

  clearAll() {
    this.state.recent = [];
    this.state.saved = [];
    this.saveHistory();
  }
}

export const inputHistoryService = new InputHistoryService();
