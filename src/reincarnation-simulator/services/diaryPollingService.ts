import { watch } from 'vue';
import { store, actions } from '../store';

class DiaryPollingService {
  private static instance: DiaryPollingService;
  private intervalId: number | null = null;
  private readonly POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.watchAutoUpdateFlag();
  }

  public static getInstance(): DiaryPollingService {
    if (!DiaryPollingService.instance) {
      DiaryPollingService.instance = new DiaryPollingService();
    }
    return DiaryPollingService.instance;
  }

  private watchAutoUpdateFlag() {
    watch(() => store.diary.isAutoUpdateEnabled, (newValue) => {
      if (newValue) {
        this.start();
      } else {
        this.stop();
      }
    }, { immediate: true });
  }

  private start() {
    if (this.intervalId !== null) {
      console.log('[DiaryPolling] Polling is already active.');
      return;
    }
    console.log('[DiaryPolling] Starting polling for diary updates...');
    this.runUpdate(); // Run immediately on start
    this.intervalId = window.setInterval(() => {
      this.runUpdate();
    }, this.POLLING_INTERVAL);
  }

  private stop() {
    if (this.intervalId !== null) {
      console.log('[DiaryPolling] Stopping polling.');
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async runUpdate() {
    console.log('[DiaryPolling] Running scheduled diary update...');
    try {
      await actions.generateDiarySummary('small');
      await actions.generateDiarySummary('large');
      await actions.saveDiarySummaries();
      console.log('[DiaryPolling] Scheduled diary update completed.');
    } catch (error) {
      console.error('[DiaryPolling] Error during scheduled diary update:', error);
    }
  }
}

export const diaryPollingService = DiaryPollingService.getInstance();