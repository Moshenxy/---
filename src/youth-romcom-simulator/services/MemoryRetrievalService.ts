import type { DiaryFragment, 游戏世界状态, 角色, Npc } from '../types';
import dayjs from 'dayjs';

// 定义评分后带有分数的日志条目类型
interface ScoredLogEntry extends DiaryFragment {
  relevanceScore: number;
}

// 定义服务配置项
interface MemoryRetrievalConfig {
  topN: number; // 返回最相关的N条记忆
  recencyWeight: number; // 新近度权重
  entityMatchWeight: number; // 实体匹配权重
  locationMatchWeight: number; // 地点匹配权重
  socialGraphWeight: number; // 社交图谱权重
  coreTraitWeight: number; // 核心特质共鸣权重
  causalLinkWeight: number; // 因果链权重
}

/**
 * 实体关联度记忆系统
 * @description 根据当前情境，从完整的历史中检索出最相关的记忆片段。
 */
class MemoryRetrievalService {
  private cachedLogs: DiaryFragment[] = [];
  private entityIdToNameMap: Map<string, string> = new Map(); // ID -> 名称 的映射
  private lastLogCount = -1;

  private config: MemoryRetrievalConfig = {
    topN: 5,
    recencyWeight: 1.5,
    entityMatchWeight: 5.0,
    locationMatchWeight: 3.0, // This is currently not used, but kept for future.
    socialGraphWeight: 4.0,
    coreTraitWeight: 2.5,
    causalLinkWeight: 10.0,
  };

  /**
   * 主入口方法：获取相关记忆
   */
  public getRelevantMemories(
    combinedInput: string,
    worldState: 游戏世界状态,
    diaryFragments: DiaryFragment[],
    userId: string,
    dateFilter?: (date: string) => boolean,
  ): DiaryFragment[] {
    this.ensureCacheIsReady(diaryFragments, worldState, userId);

    let candidateLogs = this.cachedLogs;

    // 步骤 1: 如果有日期过滤器，首先进行日期初筛
    if (dateFilter) {
      candidateLogs = this.cachedLogs.filter(log => log.日期 && dateFilter(log.日期));
    }

    // 步骤 2: 在候选集上进行相关性评分
    const queryEntities = this.extractQueryEntities(combinedInput, worldState, userId);
    const scoredLogs = candidateLogs.map(log => {
      const score = this.calculateRelevanceScore(log, queryEntities, worldState, userId);
      return { ...log, relevanceScore: score };
    });

    const highlyRelevantLogs = scoredLogs.filter(log => log.relevanceScore > 0);

    // 步骤 3: 根据递进逻辑返回结果
    if (highlyRelevantLogs.length > 0) {
      return highlyRelevantLogs.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, this.config.topN);
    } else if (dateFilter && candidateLogs.length > 0) {
      return candidateLogs;
    } else if (!dateFilter) {
       return scoredLogs.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, this.config.topN);
    }
    
    return [];
  }

  /**
   * 计算单条日志的关联度分数
   */
  private calculateRelevanceScore(
    log: DiaryFragment,
    queryEntities: Set<string>,
    worldState: 游戏世界状态,
    userId: string,
  ): number {
    let score = 0;
    const totalLogs = this.cachedLogs.length > 0 ? Math.max(...this.cachedLogs.map(l => l.序号)) : 1;
    const logText = `${log.标题} ${log.事件概要 || ''} ${log.我的抉择 || ''} ${log.关系变动 || ''}`;
    const logEntities = new Set<string>();

    for (const [entityId, entityName] of this.entityIdToNameMap.entries()) {
      if (entityName && logText.includes(entityName)) {
        logEntities.add(entityId);
      }
    }

    const intersection = new Set([...queryEntities].filter(x => logEntities.has(x)));
    score += intersection.size * this.config.entityMatchWeight;
    score += (log.序号 / totalLogs) * this.config.recencyWeight;
    score += this.getSocialGraphScore(logEntities, queryEntities, worldState);
    score += this.getCoreTraitScore(logText, logEntities, worldState, userId);
    score += this.getCausalLinkScore(log, queryEntities);

    return score;
  }

  /**
   * 确保日志缓存和实体索引是最新的
   */
  private ensureCacheIsReady(diaryFragments: DiaryFragment[], worldState: 游戏世界状态, userId: string) {
    if (diaryFragments.length !== this.lastLogCount) {
      this.cachedLogs = [...diaryFragments];
      this.lastLogCount = diaryFragments.length;
      this.buildEntityIdToNameMap(worldState, userId);
      console.log(
        `[MemoryRetrievalService] Cache updated. Entity index rebuilt with ${this.entityIdToNameMap.size} entries.`,
      );
    }
  }

  /**
   * 构建实体ID到名称的映射索引
   */
  private buildEntityIdToNameMap(worldState: 游戏世界状态, userId: string) {
    this.entityIdToNameMap.clear();
    const { 角色列表, 地点, 主角 } = worldState;

    if (角色列表) {
      for (const id in 角色列表) {
        const char = 角色列表[id];
        if (typeof char === 'object' && char.名称) {
          this.entityIdToNameMap.set(id, char.名称);
        }
      }
    }

    if (地点) {
      for (const id in 地点) {
        const loc = 地点[id];
        if (loc.名称) {
          this.entityIdToNameMap.set(id, loc.名称);
        }
      }
    }

    if (主角 && typeof 主角 === 'object' && 主角.名称) {
      this.entityIdToNameMap.set(userId, 主角.名称);
    }
  }

  /**
   * 从用户输入和当前场景中提取查询实体
   */
  private extractQueryEntities(combinedInput: string, worldState: 游戏世界状态, userId: string): Set<string> {
    const entities = new Set<string>();
    entities.add(userId);

    for (const [entityId, entityName] of this.entityIdToNameMap.entries()) {
      if (entityName && combinedInput.includes(entityName)) {
        entities.add(entityId);
      }
    }

    const protagonist = worldState.主角;
    if (protagonist && typeof protagonist === 'object') {
      const protagonistLocation = protagonist.位置;
      if (protagonistLocation && worldState.角色列表) {
        for (const charId in worldState.角色列表) {
          const char = worldState.角色列表[charId];
          if (typeof char === 'object' && char.位置 === protagonistLocation) {
            entities.add(charId);
          }
        }
      }
      if (protagonistLocation) {
        entities.add(protagonistLocation);
      }
    }
    return entities;
  }

  /**
   * 计算社交图谱加权分数
   */
  private getSocialGraphScore(logEntities: Set<string>, queryEntities: Set<string>, worldState: 游戏世界状态): number {
    let score = 0;
    if (!worldState.关系) return 0;

    for (const logEntityId of logEntities) {
      if (!this.entityIdToNameMap.has(logEntityId)) continue;

      for (const queryEntityId of queryEntities) {
        if (logEntityId === queryEntityId || !this.entityIdToNameMap.has(queryEntityId)) continue;

        const subjectRelations = worldState.关系[logEntityId];
        if (subjectRelations && typeof subjectRelations === 'object') {
          const relationship = subjectRelations[queryEntityId];
          if (relationship && typeof relationship === 'object' && relationship.数值) {
            const affinityScore = Math.abs(relationship.数值.亲密度);
            const dominanceScore = Math.abs(relationship.数值.支配度);

            if (affinityScore > 80) score += this.config.socialGraphWeight;
            if (dominanceScore > 100) score += this.config.socialGraphWeight;
          }
        }
      }
    }
    return score;
  }

  /**
   * 计算核心特质共鸣分数
   */
  private getCoreTraitScore(logText: string, logEntities: Set<string>, worldState: 游戏世界状态, userId: string): number {
    let score = 0;
    for (const entityId of logEntities) {
      let character: 角色 | '待初始化' | undefined;
      if (entityId === userId) {
        character = worldState.主角;
      } else {
        character = worldState.角色列表[entityId];
      }

      if (character && typeof character === 'object' && '人格内核' in character) {
        const npcCharacter = character as Npc;
        if (npcCharacter.人格内核?.标识符 && logText.includes(npcCharacter.人格内核.标识符)) {
          score += this.config.coreTraitWeight;
        }
      }
    }
    return score;
  }

  /**
   * 计算因果链分数
   */
  private getCausalLinkScore(log: DiaryFragment, queryEntities: Set<string>): number {
    return 0;
  }
}

export const memoryRetrievalService = new MemoryRetrievalService();