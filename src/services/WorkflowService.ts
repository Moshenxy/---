import { lorebookService } from './LorebookService';

// 定义工作流的可能状态
export type WorkflowState = 'NORMAL' | 'CREATION' | 'IDENTITY';

// 定义每个状态对应的CoT世界书条目名称
// 核心修正：使用截图中确切的世界书条目名称
const COT_FILES: Record<WorkflowState, string[]> = {
  NORMAL: ['【cot】必要关键cot'],
  CREATION: ['【cot】创世必要关键cot'],
  IDENTITY: ['【cot】身份必要关键cot'],
};

class WorkflowService {
  private currentState: WorkflowState = 'NORMAL';
  private narrativeCache: string | null = null; // 用于暂存 <gametxt>
  private updateScriptCache: string | null = null; // 用于暂存 <UpdateVariable>
  private preserveMode: 'none' | 'gametxt' | 'full' = 'none';

  constructor() {
    // 初始化时，确保只有一个CoT是激活的
    this.switchTo('NORMAL');
  }

  /**
   * 获取当前的工作流状态
   */
  public getCurrentState(): WorkflowState {
    return this.currentState;
  }

  /**
   * 切换工作流状态，并自动处理CoT世界书的启用/禁用
   * @param newState 要切换到的新状态
   */
  public async switchTo(newState: WorkflowState, force: boolean = false) {
    if (this.currentState === newState && !force) {
      return; // 如果状态未改变且未强制执行，则不执行任何操作
    }

    console.log(`[WorkflowService] Switching from ${this.currentState} to ${newState} (Forced: ${force})`);

    const allCots = Object.values(COT_FILES).flat();
    const cotsToEnable = COT_FILES[newState];

    // 核心修正：遍历所有已知的确切CoT条目名称，并设置其正确的启用状态
    for (const cotName of allCots) {
      const shouldBeEnabled = cotsToEnable.includes(cotName);
      await lorebookService.setEntryEnabled(cotName, shouldBeEnabled);
    }

    this.currentState = newState;
    console.log(`[WorkflowService] Switched to ${newState}. Enabled CoTs: ${cotsToEnable.join(', ')}`);
  }

  /**
   * 暂存叙事内容
   * @param narrative 要缓存的 <gametxt> 内容
   */
  public cacheNarrative(narrative: string) {
    this.narrativeCache = narrative;
    console.log('[WorkflowService] Narrative cached.');
  }

  /**
   * 取出并清空暂存的叙事内容
   * @returns 暂存的 <gametxt> 内容，如果没有则返回 null
   */
  public popNarrative(): string | null {
    const narrative = this.narrativeCache;
    this.narrativeCache = null;
    if (narrative) {
      console.log('[WorkflowService] Popped cached narrative.');
    }
    return narrative;
  }

  /**
   * 暂存变量更新脚本
   */
  public cacheUpdateScript(script: string) {
    this.updateScriptCache = script;
    console.log('[WorkflowService] Update script cached.');
  }

  /**
   * 取出并清空暂存的变量更新脚本
   */
  public popUpdateScript(): string | null {
    const script = this.updateScriptCache;
    this.updateScriptCache = null;
    if (script) {
      console.log('[WorkflowService] Popped cached update script.');
    }
    return script;
  }

  /**
   * 设置内容保存模式，用于下一次AI交互
   * @param mode 'gametxt' 只保存叙事, 'full' 保存叙事和变量脚本
   */
  public setPreserveMode(mode: 'none' | 'gametxt' | 'full') {
    this.preserveMode = mode;
    console.log(`[WorkflowService] Preserve mode set to: ${mode}`);
  }

  /**
   * 取出并清空根据保存模式暂存的内容
   * @returns 格式化后的字符串，如果没有则返回空字符串
   */
  public popPreservedContent(): string {
    let content = '';

    if (this.preserveMode === 'gametxt' || this.preserveMode === 'full') {
      if (this.narrativeCache) {
        content += `\n<gametxt>${this.narrativeCache}</gametxt>`;
        console.log('[WorkflowService] Popped cached narrative for appending.');
      }
    }

    if (this.preserveMode === 'full') {
      if (this.updateScriptCache) {
        content += `\n<UpdateVariable>${this.updateScriptCache}</UpdateVariable>`;
        console.log('[WorkflowService] Popped cached update script for appending.');
      }
    }

    // 每次取出后都重置所有缓存和模式
    this.narrativeCache = null;
    this.updateScriptCache = null;
    this.preserveMode = 'none';

    if (content) {
      console.log('[WorkflowService] Final content to append length:', content.length);
    }

    return content;
  }
}

export const workflowService = new WorkflowService();
