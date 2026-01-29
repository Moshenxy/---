import { get } from 'lodash';
import { AppState, Character, World, WorldEpoch, WorldState } from '../types';
import { InformationRipple } from '../types/evolution';
import { entityIndexService } from './EntityIndexService';

export interface UserIntent {
  actionType: 'combat' | 'social' | 'exploration' | 'inventory' | 'creation' | 'default';
  crossContextQuery?: { worldId: string; epochId?: string; items?: string[]; locations?: string[] };
  explicitEntities: {
    characters: string[];
    locations: string[];
    dbItems: string[];
  };
  triggeredRipples: InformationRipple[]; // 新增：被叙事引力捕获的涟漪
  loadFullPlayerData?: (keyof WorldState['玩家']['本体'])[];
}

/**
 * 负责在与AI交互前，根据当前情景智能地构建一个最小化的、临时的上下文对象。
 */
class ContextService {
  public analyzeUserIntent(
    userInput: string,
    worldState: AppState['worldState'],
    availableRipples: InformationRipple[],
  ): UserIntent {
    const intent: UserIntent = {
      actionType: 'default',
      explicitEntities: {
        characters: [],
        locations: [],
        dbItems: [],
      },
      triggeredRipples: [],
    };

    if (!worldState) return intent;

    // 1. 主动场景分析：预加载核心场景实体
    const activeWorld = Object.values(worldState.世界 || {}).find(w =>
      ['主世界', '当前化身世界'].includes(get(w, '定义.元规则.定位', '')),
    );
    const avatarId = get(worldState, '玩家.模拟器.模拟.当前化身ID');
    const currentPlayer = avatarId ? get(activeWorld, `角色.${avatarId}`) : get(worldState, '玩家.本体');

    if (currentPlayer && activeWorld) {
      const currentLocationId = currentPlayer.当前位置;
      if (currentLocationId) {
        intent.explicitEntities.locations.push(currentLocationId);

        // 自动添加父级地点
        let parentId = entityIndexService.findById(currentLocationId)?.parentId;
        while (parentId && parentId !== 'WORLD_ORIGIN') {
          intent.explicitEntities.locations.push(parentId);
          parentId = entityIndexService.findById(parentId)?.parentId;
        }

        // 自动添加同地点NPC
        const worldChars = get(activeWorld, '角色', {});
        for (const charId in worldChars) {
          if (get(worldChars, `${charId}.当前位置`) === currentLocationId) {
            intent.explicitEntities.characters.push(charId);
          }
        }
      }
    }

    // 2. 意图分析 (Action Type) - 抽象化权重匹配
    const intentScores: Record<UserIntent['actionType'], number> = {
      combat: 0,
      inventory: 0,
      social: 0,
      exploration: 0,
      creation: 0,
      default: 1, // 基础分
    };

    const patterns: { type: UserIntent['actionType']; regex: RegExp; weight: number }[] = [
      { type: 'combat', regex: /(攻击|战斗|防御|躲闪|释放|技能|杀|击败|对决|戒备|危险|威胁)/, weight: 3 },
      { type: 'inventory', regex: /(背包|物品|整理|装备|使用|查看|烙印|道具|储物|空间)/, weight: 2 },
      { type: 'social', regex: /(对话|交谈|说服|询问|关系|告诉|回答|问|交流|打听|请求|命令)/, weight: 2 },
      { type: 'social', regex: /["“].*["”]/, weight: 1.5 }, // 引号通常意味着对话
      { type: 'exploration', regex: /(探索|前往|调查|寻找|去|观察|看|感知|探查|追踪|周围|环境)/, weight: 2 },
      { type: 'creation', regex: /(创造|合成|炼制|打造|制作|修复|附魔)/, weight: 3 },
    ];

    patterns.forEach(({ type, regex, weight }) => {
      if (regex.test(userInput)) {
        intentScores[type] += weight;
      }
    });

    // 找出得分最高的意图
    let maxScore = 0;
    let bestIntent: UserIntent['actionType'] = 'default';

    for (const [type, score] of Object.entries(intentScores)) {
      if (score > maxScore) {
        maxScore = score;
        bestIntent = type as UserIntent['actionType'];
      }
    }
    intent.actionType = bestIntent;

    // 2. 实体提取与全局索引查询
    // A simple regex to find potential entities (could be improved)
    const potentialNames = userInput.match(/[\u4e00-\u9fa5a-zA-Z]+/g) || [];

    for (const name of potentialNames) {
      const results = entityIndexService.findByName(name);
      if (results) {
        for (const meta of results) {
          switch (meta.type) {
            case 'character':
              intent.explicitEntities.characters.push(meta.id);
              break;
            case 'location':
              intent.explicitEntities.locations.push(meta.id);
              break;
            case 'dbItem':
            case 'skill':
            case 'artifice':
            case 'talent':
              intent.explicitEntities.dbItems.push(meta.id);
              break;
            case 'imprint':
              if (meta.source === 'player') {
                if (!intent.loadFullPlayerData) intent.loadFullPlayerData = [];
                intent.loadFullPlayerData.push('已解锁烙印');
              }
              break;
          }

          // 自动跨世界/纪元查询检测
          const activeWorldId = Object.keys(worldState.世界).find(wId =>
            ['主世界', '当前化身世界'].includes(get(worldState, `世界.${wId}.定义.元规则.定位`) || ''),
          );
          if (meta.worldId !== activeWorldId && meta.worldId !== '_player') {
            if (!intent.crossContextQuery) {
              intent.crossContextQuery = { worldId: meta.worldId, items: [], locations: [] };
            }
            if (meta.type === 'location') {
              intent.crossContextQuery.locations?.push(meta.id);
            } else {
              intent.crossContextQuery.items?.push(meta.id);
            }
          }
        }
      }
    }

    // 3. 叙事引力牵引
    if (currentPlayer) {
      for (const ripple of availableRipples) {
        const influence = ripple.sphereOfInfluence;
        let isTriggered = false;
        // 检查位置重叠
        if (currentPlayer.当前位置 && influence.locationIds.includes(currentPlayer.当前位置)) {
          isTriggered = true;
        }
        // TODO: 检查势力、任务等其他重叠因素

        if (isTriggered) {
          console.log(`[EvoSys-Gravity] Ripple ${ripple.id} was triggered by narrative gravity.`, ripple);
          intent.triggeredRipples.push(ripple);
          // 将涟漪内容中可能提及的实体也加入上下文
          const rippleEntities = this.extractEntitiesFromText(ripple.content, worldState);
          intent.explicitEntities.characters.push(...rippleEntities.characters);
          intent.explicitEntities.locations.push(...rippleEntities.locations);
          intent.explicitEntities.dbItems.push(...rippleEntities.dbItems);
        }
      }
    }

    // 4. 玩家数据策略
    if (intent.actionType === 'inventory') {
      if (!intent.loadFullPlayerData) intent.loadFullPlayerData = [];
      intent.loadFullPlayerData.push('背包', '已解锁烙印');
    }

    console.log('[ContextService] User Intent Analyzed:', intent);
    return intent;
  }

  private extractEntitiesFromText(text: string, worldState: AppState['worldState']): UserIntent['explicitEntities'] {
    const entities: UserIntent['explicitEntities'] = { characters: [], locations: [], dbItems: [] };
    if (!worldState) return entities;

    const potentialNames = text.match(/[\u4e00-\u9fa5a-zA-Z]+/g) || [];
    for (const name of potentialNames) {
      const results = entityIndexService.findByName(name);
      if (results) {
        for (const meta of results) {
          switch (meta.type) {
            case 'character':
              entities.characters.push(meta.id);
              break;
            case 'location':
              entities.locations.push(meta.id);
              break;
            case 'dbItem':
              entities.dbItems.push(meta.id);
              break;
          }
        }
      }
    }
    return entities;
  }

  /**
   * 从当前场景和玩家输入中，解析出最关键的实体ID。
   */
  public identifyCoreEntities(
    userInput: string,
    currentCharacterId: string,
    worldState: AppState['worldState'],
  ): string[] {
    const entities = new Set<string>([currentCharacterId]);
    if (!worldState || !worldState.世界) return Array.from(entities);

    const activeWorld = Object.values(worldState.世界).find(
      w => get(w, '定义.元规则.定位') === '主世界' || get(w, '定义.元规则.定位') === '当前化身世界',
    );
    if (!activeWorld) return Array.from(entities);

    const allCharacters = get(activeWorld, '角色', {}) as { [id: string]: Character };
    const currentUser = get(allCharacters, currentCharacterId) || get(worldState, '玩家.本体');
    if (!currentUser) return Array.from(entities);

    const currentLocationId = currentUser.当前位置;

    // 1. 自动包含当前地点的所有NPC
    for (const charId in allCharacters) {
      if (allCharacters[charId].当前位置 === currentLocationId) {
        entities.add(charId);
      }
    }

    // 2. 自动包含与主角关系最密切和最敌对的NPC
    const causalNet = get(activeWorld, '因果之网', {});
    const playerRelations = get(causalNet, currentCharacterId, {});

    const sortedRelations = Object.entries(playerRelations)
      .map(([id, rel]: [string, any]) => ({
        id,
        intimacy: get(rel, '情感层.亲近感', 0),
        conflict: get(rel, '利益层.利益冲突', 0),
      }))
      .sort((a, b) => b.intimacy - a.intimacy);

    if (sortedRelations.length > 0) {
      entities.add(sortedRelations[0].id); // 最高亲近感
      const mostHostile = sortedRelations.sort((a, b) => b.conflict - a.conflict)[0];
      if (mostHostile) entities.add(mostHostile.id); // 最高冲突
    }

    // 3. 根据用户输入中的名称进行匹配
    for (const id in allCharacters) {
      const character = allCharacters[id];
      if (character && character.姓名 && userInput.includes(character.姓名)) {
        entities.add(id);
      }
    }

    return Array.from(entities);
  }

  /**
   * 构建一个只包含核心信息的精简上下文对象。
   * @param intent - 分析出的用户意图。
   * @param worldState - 完整的世界状态。
   * @param userId - 玩家本体ID。
   * @returns 精简后的上下文对象。
   */
  public buildLeanContext(
    intent: UserIntent,
    userInput: string, //  <-- 添加 userInput 参数
    worldState: AppState['worldState'],
    userId: string,
  ): { stat_data: Partial<AppState['worldState']> } {
    if (!worldState) return { stat_data: {} };

    const leanState: any = {
      玩家: {
        本体: {},
        模拟器: get(worldState, '玩家.模拟器'),
        往世道标: get(worldState, '玩家.往世道标'),
      },
      世界: {},
    };

    // 1. 玩家数据加载 (基于意图)
    const playerFullData = get(worldState, '玩家.本体', {}) as Character;
    // 基础信息始终加载
    const playerLeanData: any = { ...playerFullData };
    // 默认精简庞大的列表
    if (playerFullData.背包) {
      playerLeanData.背包 = this.simplifyIdMap(playerFullData.背包);
    }
    if (playerFullData.已解锁烙印) {
      playerLeanData.已解锁烙印 = this.simplifyIdMap(playerFullData.已解锁烙印);
    }

    // 按需完整加载
    if (intent.loadFullPlayerData) {
      intent.loadFullPlayerData.forEach((key: any) => {
        if (playerFullData[key]) {
          playerLeanData[key] = playerFullData[key];
        }
      });
    }
    leanState.玩家.本体 = playerLeanData;

    // 2. 识别核心角色列表
    const coreEntities = Array.from(new Set([userId, ...intent.explicitEntities.characters]));

    // 3. 处理焦点世界数据
    const activeWorldEntry = Object.entries(get(worldState, '世界', {}) as { [id: string]: World }).find(
      ([, w]) => get(w, '定义.元规则.定位') === '主世界' || get(w, '定义.元规则.定位') === '当前化身世界',
    );

    if (activeWorldEntry) {
      const [worldId, activeWorld] = activeWorldEntry;
      const epochId = get(activeWorld, '定义.元规则.当前纪元ID');

      // 3.1 加载世界规则 (去除庞大内容)
      if (epochId) {
        const activeEpoch = get(activeWorld, ['定义', '历史纪元', epochId]) as WorldEpoch;
        if (activeEpoch) {
          const leanEpoch = { ...activeEpoch };
          // 默认移除庞大的内容模块，后续按需注入
          delete (leanEpoch as any).内容;
          leanEpoch.世界大事 = get(activeEpoch, '世界大事', {});

          // 按需注入空间实体 (Location Injection)
          // 根据 intent.explicitEntities.locations 中的ID，从原 activeEpoch.内容.空间实体 中查找
          const allLocations = get(activeEpoch, '内容.空间实体', {});
          const leanLocations: Record<string, any> = {};

          if (intent.explicitEntities.locations.length > 0) {
            for (const locId of intent.explicitEntities.locations) {
              const loc = (allLocations as Record<string, any>)[locId];
              if (loc) {
                leanLocations[locId] = loc;
                // 自动包含父级实体 (向上递归查找)
                let parentId = get(loc, '所属.ID');
                while (parentId && parentId !== 'WORLD_ORIGIN') {
                  const parent = (allLocations as Record<string, any>)[parentId];
                  if (parent) {
                    // 避免重复添加
                    if (!leanLocations[parentId]) {
                      leanLocations[parentId] = parent;
                    }
                    parentId = get(parent, '所属.ID');
                  } else {
                    break;
                  }
                }
              }
            }
          }

          // 如果有提取到地点，注入到 leanEpoch
          if (Object.keys(leanLocations).length > 0) {
            (leanEpoch as any).内容 = { 空间实体: leanLocations };
          }

          if (!leanState.世界[worldId]) leanState.世界[worldId] = {};
          leanState.世界[worldId].定义 = {
            元规则: get(activeWorld, '定义.元规则'),
            历史纪元: { [epochId]: leanEpoch },
          };
        }
      }

      // 3.2 加载角色数据 (基于意图的粒度控制)
      const worldChars = get(worldState.世界[worldId], '角色', {}) as { [id: string]: Character };
      const leanChars: any = {};

      // 自动识别同地点角色
      const avatarId = get(worldState, '玩家.模拟器.模拟.当前化身ID');
      const currentPlayer = (avatarId ? get(worldChars, avatarId) : playerFullData) as Character;

      // 自动识别并加载与场景相关的核心实体
      const sceneEntities = this.identifyCoreEntities(userInput, userId, worldState);
      coreEntities.push(...sceneEntities);

      const allActiveCharIds = Array.from(new Set(coreEntities));

      for (const charId of allActiveCharIds) {
        const char = get(worldChars, charId) || (charId === userId ? playerFullData : null);
        if (char) {
          // 根据意图决定加载粒度
          if (
            intent.actionType === 'combat' ||
            intent.actionType === 'inventory' ||
            char.当前位置 === currentPlayer?.当前位置
          ) {
            leanChars[charId] = char; // 全量加载
          } else {
            leanChars[charId] = {
              // 精简加载
              姓名: char.姓名,
              身份: char.身份,
              当前位置: char.当前位置,
              相貌: char.相貌,
              心流: char.心流,
              当前状态: char.当前状态,
            };
          }
        }
      }
      leanState.世界[worldId].角色 = leanChars;

      // 3.3 加载因果之网 (仅限核心角色之间)
      const fullCausalNet = get(activeWorld, '因果之网', {});
      leanState.世界[worldId].因果之网 = {};
      const activeCharIds = Object.keys(leanChars);
      if (!activeCharIds.includes(userId)) {
        activeCharIds.push(userId); // 确保玩家本体始终在关系网内
      }

      for (const subjectId of activeCharIds) {
        const relations = get(fullCausalNet, subjectId);
        if (relations) {
          if (!leanState.世界[worldId].因果之网) leanState.世界[worldId].因果之网 = {};
          leanState.世界[worldId].因果之网[subjectId] = {};
          for (const objectId in relations) {
            if (activeCharIds.includes(objectId)) {
              leanState.世界[worldId].因果之网[subjectId][objectId] = relations[objectId];
            }
          }
        }
      }

      // 3.4 数据库按需加载 (包含 intent 中明确提及的物品)
      const referencedDbIds = new Set<string>([...intent.explicitEntities.dbItems]);
      const fullDatabase = get(activeWorld, '数据库', {});
      // 遍历 leanChars 和 playerLeanData 收集引用 (简化版)
      [playerLeanData, ...Object.values(leanChars)].forEach((char: any) => {
        if (char.背包) Object.keys(char.背包).forEach(id => referencedDbIds.add(id));
        if (char.已装备烙印) char.已装备烙印.forEach((id: string) => id && referencedDbIds.add(id));
      });

      if (referencedDbIds.size > 0 && fullDatabase) {
        if (!leanState.世界[worldId].数据库) leanState.世界[worldId].数据库 = {};
        for (const category in fullDatabase) {
          if (category === '$meta') continue;
          const categoryStore = get(fullDatabase, category, {});
          for (const itemId of referencedDbIds) {
            if (get(categoryStore, itemId)) {
              if (!leanState.世界[worldId].数据库[category]) leanState.世界[worldId].数据库[category] = {};
              leanState.世界[worldId].数据库[category][itemId] = get(categoryStore, itemId);
            }
          }
        }
      }
    }

    // 4. 跨上下文查询 (Cross Context Query)
    if (intent.crossContextQuery) {
      const { worldId, items, locations } = intent.crossContextQuery;
      const targetWorld = get(worldState.世界, worldId);
      if (targetWorld) {
        if (!leanState.世界[worldId]) leanState.世界[worldId] = {};

        // 注入跨世界物品
        if (items && items.length > 0) {
          const targetDb = get(targetWorld, '数据库', {});
          if (!leanState.世界[worldId].数据库) leanState.世界[worldId].数据库 = {};
          for (const category in targetDb) {
            if (category === '$meta') continue;
            const store = targetDb[category as keyof typeof targetDb] as any;
            items.forEach(itemId => {
              if (store[itemId]) {
                if (!leanState.世界[worldId].数据库[category]) leanState.世界[worldId].数据库[category] = {};
                leanState.世界[worldId].数据库[category][itemId] = store[itemId];
              }
            });
          }
        }
      }
    }

    console.log('[ContextService] Built Lean Context V4:', { stat_data: leanState });
    return { stat_data: leanState };
  }

  private simplifyIdMap(map: any) {
    if (!map) return {};
    const simple: any = {};
    for (const key in map) {
      if (key === '$meta') continue;
      // 只保留键名，或者保留数量 (如果是背包)
      simple[key] = typeof map[key] === 'number' ? map[key] : true;
    }
    return simple;
  }
}

export const contextService = new ContextService();
