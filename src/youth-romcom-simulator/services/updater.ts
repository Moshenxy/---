class SilentUpdater {
  private timerId: number | null = null;
  private isRunning: boolean = false;
  private isUpdating: boolean = false;
  private updateCallback: (() => Promise<void>) | null = null;

  /**
   * Starts the silent update polling.
   * @param updateFn The function to call to fetch data.
   * @param interval The interval in milliseconds. Defaults to 5 seconds for faster feedback.
   */
  public start(updateFn: () => Promise<void>, interval: number = 5000) {
    if (this.isRunning) {
      console.log('[SilentUpdater] Updater is already running.');
      return;
    }
    this.updateCallback = updateFn;
    this.timerId = window.setInterval(() => this.runUpdate(), interval);
    this.isRunning = true;
    console.log(`[SilentUpdater] Started with an interval of ${interval / 1000} seconds.`);
  }

  /**
   * Stops the silent update polling.
   */
  public stop() {
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
    this.updateCallback = null;
    console.log('[SilentUpdater] Stopped.');
  }

  /**
   * Resets the polling timer.
   */
  public reset() {
    if (!this.isRunning || !this.updateCallback) return;
    if (this.timerId) {
      window.clearInterval(this.timerId);
    }
    const interval = this.timerId ? (this.timerId as any).__interval : 5000;
    this.timerId = window.setInterval(() => this.runUpdate(), interval);
  }

  /**
   * Runs a single update cycle.
   */
  private async runUpdate() {
    if (this.isUpdating || !this.updateCallback) {
      console.log('[SilentUpdater] Update in progress or callback not set. Skipping.');
      return;
    }

    this.isUpdating = true;
    try {
      await this.updateCallback();
      console.debug('[SilentUpdater] Silent update check completed.');
    } catch (error) {
      console.error('[SilentUpdater] Error during silent update:', error);
    } finally {
      this.isUpdating = false;
    }
  }
}

export const silentUpdater = new SilentUpdater();
