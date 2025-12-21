import { get } from 'lodash';
import { computed, reactive } from 'vue';
import { store } from '../store';
import type { Character } from '../types';
import { parseSimpleYaml } from '../utils/yamlParser';
import { lorebookService } from './LorebookService';

// 全局缓存地点ID到名称的映射
const locationCache = reactive(new Map<string, { name: string; parentId: string | null }>());

/**
 * 从全局状态中过滤出非玩家、非化身的角色作为NPC
 */
const allNpcs = computed(() => {
  const worldState = store.worldState;
  if (!worldState?.世界) return [];

  const avatarId = get(worldState, '玩家.模拟器.模拟.当前化身ID');
  const excludeIds = ['本体', avatarId].filter(Boolean);

  const allNpcs: Character[] = [];
  for (const worldId in worldState.世界) {
    const world = (worldState.世界 as Record<string, any>)[worldId];
    if (!world || !world.角色) continue;

    for (const charId in world.角色) {
      // 排除元数据、玩家本体和当前化身
      if (charId === '$meta' || excludeIds.includes(charId)) {
        continue;
      }
      // 确保我们不会将玩家本体对象本身错误地加入NPC列表
      // Additional check to prevent player character from being listed as NPC
      if (charId === '本体' || (worldState.玩家 && worldState.玩家.本体 && (world.角色 as Record<string, any>)[charId] === worldState.玩家.本体)) {
        continue;
      }
      allNpcs.push(world.角色[charId]);
    }
  }
  return allNpcs;
});

/**
 * 根据指定的世界ID获取该世界的所有NPC
 */
function getNpcsByWorld(worldId: string): Character[] {
  if (!worldId) return [];
  return allNpcs.value.filter((npc: Character) => {
    // 适配 Described<string> 类型
    return npc.所属世界 === worldId;
  });
}

/**
 * 获取所有世界的信息，并缓存所有地点的名称
 */
async function initializeWorldAndLocationData(): Promise<{ id: string; name: string }[]> {
  const worlds = store.worldState?.世界;
  if (!worlds) {
    console.warn('[NpcService] worldState.世界 is not available for initialization.');
    return [];
  }

  const worldInfoList: { id: string; name: string }[] = [];

  for (const worldId in worlds) {
    if (worldId === '$meta') continue;

    const world = (worlds as Record<string, any>)[worldId];
    const worldName = get(world, '名称');
    
    if (worldId && worldName) {
      worldInfoList.push({ id: worldId, name: worldName });
    }

    // 缓存该世界所有纪元下的地点信息
    const historicalEpochs = get(world, '定义.历史纪元', {});
    for (const epochId in historicalEpochs) {
      if (epochId === '$meta') continue;
      const epoch = (historicalEpochs as Record<string, any>)[epochId];
      const spatialEntities = get(epoch, '内容.空间实体');
      // 注意：[InitVar].txt 中空间实体是一个对象，而不是数组
      if (typeof spatialEntities === 'object' && spatialEntities !== null) {
        for (const entityId in spatialEntities) {
          if (entityId === '$meta') continue;
          const entity = (spatialEntities as Record<string, any>)[entityId];
          if (entity && entity.名称) {
            locationCache.set(entityId, { name: entity.名称, parentId: entity.所属?.ID || null });
          }
        }
      }
    }
  }
  
  console.log('[NpcService] Initialized worlds and locations from worldState.', worldInfoList);
  return worldInfoList;
}

function getLocationName(id: string): string {
  return locationCache.get(id)?.name || id;
}

function getParentLocationName(id: string): string {
  const parentId = locationCache.get(id)?.parentId;
  if (!parentId) return '未知';
  if (parentId === 'WORLD_ORIGIN') return '世界本身';
  return locationCache.get(parentId)?.name || '未知';
}

function getNpcNameById(id: string): string {
  if (id === '本体') {
    return store.worldState?.玩家?.本体?.真名 || '本体';
  }
  const worlds = store.worldState?.世界;
  if (!worlds) return id;

  for (const worldId in worlds) {
    const world = (worlds as Record<string, any>)[worldId];
    const character = get(world, `角色.${id}`);
    if (character && character.姓名) {
      return character.姓名;
    }
  }
  return id;
}

function getNpcId(npc: Character): string | null {
  const worldState = store.worldState;
  if (!worldState?.世界) return null;

  for (const worldId in worldState.世界) {
    const world = (worldState.世界 as Record<string, any>)[worldId];
    const characters = get(world, '角色');
    if (characters) {
      for (const id in characters) {
        if ((characters as Record<string, any>)[id] === npc) {
          return id;
        }
      }
    }
  }
  return null;
}

function cacheLocationData(spatialEntities: any[]) {
  if (Array.isArray(spatialEntities)) {
    for (const entity of spatialEntities) {
      if (entity.ID && entity.名称) {
        locationCache.set(entity.ID, { name: entity.名称, parentId: entity.所属?.ID || null });
      }
    }
  }
}

export const npcService = {
  getNpcsByWorld,
  allNpcs,
  initializeWorldAndLocationData,
  getLocationName,
  getNpcNameById,
  getNpcId,
  locationCache,
  getParentLocationName,
  cacheLocationData,
};
