import { log } from '../utils/logger';
import { TavernService } from './tavern.service';
import { CognitionSchema } from '../types';
import type { EpisodicMemoryUnit, Cognition, Nature } from '../types';

// 定义“老化”阈值（以聊天消息数量/楼层为单位）
const MEMORY_FORGET_THRESHOLD_FLOORS = 200; // 超过200条消息的记忆将被遗忘
const COGNITION_DEGRADE_THRESHOLD_FLOORS = 500; // 超过500条消息未被强化的认知将被降级

export class LifecycleService {
  private static intervalId: number | null = null;
  private static isRunning = false;

  /**
   * 开始生命周期服务的后台轮询。
   * @param interval - 轮询间隔（毫秒）。
   */
  public static start(interval = 5 * 60 * 1000) {
    // 默认5分钟检查一次
    if (this.intervalId !== null) {
      log('[LifecycleService] Service is already running.');
      return;
    }
    log(`[LifecycleService] Starting service with ${interval}ms interval.`);
    this.intervalId = window.setInterval(this.runDecayCycle, interval);
  }

  /**
   * 停止生命周期服务。
   */
  public static stop() {
    if (this.intervalId !== null) {
      log('[LifecycleService] Stopping service.');
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 执行一次遗忘和衰减的检查周期。
   */
  private static async runDecayCycle() {
    if (this.isRunning) {
      log('[LifecycleService] Decay cycle is already in progress. Skipping.');
      return;
    }
    this.isRunning = true;
    log('[LifecycleService] Running decay and forgetting cycle...');

    try {
      const lastMessage = getChatMessages(-1)[0];
      if (!lastMessage) {
        log('[LifecycleService] No messages yet, skipping cycle.');
        return;
      }
      const currentFloor = lastMessage.message_id;

      await this.processMemoryForgetting(currentFloor);
      await this.processCognitionDegradation(currentFloor);
    } catch (error) {
      console.error('[LifecycleService] Error during decay cycle:', error);
    } finally {
      this.isRunning = false;
      log('[LifecycleService] Decay cycle finished.');
    }
  }

  /**
   * 处理情景记忆的遗忘。
   * @param currentFloor - 当前的聊天楼层。
   */
  private static async processMemoryForgetting(currentFloor: number) {
    log('[LifecycleService] Checking for old memories to forget...');
    const allMemoryEntries = await TavernService.getEpisodicEntries();
    const memoriesToForget: string[] = [];

    for (const entry of allMemoryEntries) {
      const memory = entry.extra?.memoryData as EpisodicMemoryUnit | undefined;
      if (!memory || !memory.created_at_message_id) continue;

      const age = currentFloor - memory.created_at_message_id;
      if (age > MEMORY_FORGET_THRESHOLD_FLOORS) {
        if (entry.name) memoriesToForget.push(entry.name);
      }
    }

    if (memoriesToForget.length > 0) {
      log(`[LifecycleService] Forgetting ${memoriesToForget.length} old memories...`, memoriesToForget);
      await TavernService.deleteMemoriesByNames(memoriesToForget);
      toastr.info(`${memoriesToForget.length}个旧记忆已被遗忘。`);
    } else {
      log('[LifecycleService] No old memories to forget.');
    }
  }

  /**
   * 处理认知的降级。
   * 如果一个认知的所有支撑记忆都非常旧，那么这个认知就应该被降级。
   * @param currentFloor - 当前的聊天楼层。
   */
  private static async processCognitionDegradation(currentFloor: number) {
    log('[LifecycleService] Checking for stale cognitions to degrade...');
    const worldbookName = await TavernService.getTargetWorldbookName();
    const allMemoryEntries = await TavernService.getEpisodicEntries();
    const cognitionEntries = await TavernService.getCognitionEntries();

    // 创建一个从记忆名称到其创建楼层的快速查找映射
    const memoryFloorMap = new Map<string, number>();
    for (const entry of allMemoryEntries) {
      const memory = entry.extra?.memoryData as EpisodicMemoryUnit | undefined;
      if (entry.name && memory?.created_at_message_id) {
        memoryFloorMap.set(entry.name, memory.created_at_message_id);
      }
    }

    let degradedCount = 0;
    for (const entry of cognitionEntries) {
      if (!entry.name || !entry.content) continue;

      let currentCognition: Cognition = [];
      try {
        currentCognition = CognitionSchema.parse(JSON.parse(entry.content));
      } catch {
        continue;
      }

      const originalCount = currentCognition.length;
      const youngerCognition = currentCognition.filter(statement => {
        if (statement.supporting_memories.length === 0) {
          // 没有支撑记忆的认知不会被降级
          return true;
        }
        // 检查是否所有支撑记忆都“太旧”
        const allMemoriesAreOld = statement.supporting_memories.every(memName => {
          const memoryFloor = memoryFloorMap.get(memName);
          // 如果找不到记忆或记忆没有楼层信息，我们保守地认为它不是旧的
          if (memoryFloor === undefined) return false;
          return currentFloor - memoryFloor > COGNITION_DEGRADE_THRESHOLD_FLOORS;
        });
        // 如果所有支撑记忆都太旧，那么这个认知就应该被过滤掉
        return !allMemoriesAreOld;
      });

      if (youngerCognition.length < originalCount) {
        degradedCount += originalCount - youngerCognition.length;
        // 更新世界书条目
        await updateWorldbookWith(worldbookName, entries => {
          const entryToUpdate = entries.find(e => e.name === entry.name);
          if (entryToUpdate) {
            entryToUpdate.content = JSON.stringify(youngerCognition, null, 2);
          }
          return entries;
        });
      }
    }

    if (degradedCount > 0) {
      log(`[LifecycleService] Degraded ${degradedCount} stale cognitions.`);
      toastr.info(`${degradedCount}个陈旧认知已被降级。`);
    } else {
      log('[LifecycleService] No stale cognitions to degrade.');
    }
  }
}
