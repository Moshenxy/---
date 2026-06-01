import { get } from 'lodash';
import { computed, reactive } from 'vue';
import { store } from '../store';
import type { Npc, 主角 } from '../types';

export const USER_ID = '{{user}}';

// 全局缓存地点ID到名称的映射
const locationCache = reactive(new Map<string, { name: string; parentId: string | null }>());

/**
 * 从全局状态中过滤出所有NPC
 */
const allNpcs = computed((): (Npc & { id: string })[] => {
  const worldState = store.worldState;
  if (!worldState?.角色列表) return [];

  const npcs: (Npc & { id: string })[] = [];
  for (const charId in worldState.角色列表) {
    const charData = worldState.角色列表[charId];
    // 确保是有效的角色对象，而不是“待初始化”等占位符
    if (typeof charData === 'object' && charData !== null) {
      npcs.push({ ...charData, id: charId });
    }
  }
  return npcs;
});

/**
 * 根据指定的世界ID获取该世界的所有NPC
 * 在当前单世界扁平化结构下，忽略 worldId，总是返回所有NPC
 */
function getNpcsByWorld(worldId: string): (Npc & { id: string })[] {
  return allNpcs.value;
}

/**
 * 获取所有世界的信息
 * 在扁平化结构下，我们从所有NPC的所属组织中动态提取世界列表
 */
async function initializeWorldAndLocationData(): Promise<{ id: string; name: string }[]> {
  const characters = store.worldState?.角色列表;
  if (!characters) {
    console.warn('[NpcService] worldState.角色列表 is not available for initialization.');
    return [];
  }

  const worldSet = new Set<string>();
  Object.values(characters).forEach((char: any) => {
    if (typeof char === 'object' && char?.身份) {
      char.身份.forEach((s: any) => {
        if (s.组织) {
          worldSet.add(s.组织);
        }
      });
    }
  });

  const worldInfoList = Array.from(worldSet).map(worldName => ({
    id: worldName,
    name: worldName,
  }));
  
  console.log('[NpcService] Initialized worlds from character data.', worldInfoList);
  return worldInfoList;
}

function getLocationName(id: string): string {
  if (!id) return '未知地点';
  const location = get(store.worldState, `地点.${id}`) as any;
  return location?.名称 || id;
}

function getLocationDetails(id: string): any {
  if (!id) return null;
  return get(store.worldState, `地点.${id}`);
}

function getParentLocationName(id: string): string {
  const parentId = locationCache.get(id)?.parentId;
  if (!parentId) return '未知';
  if (parentId === 'WORLD_ORIGIN') return '世界本身';
  return locationCache.get(parentId)?.name || '未知';
}

function getNpcNameById(id: string): string {
  if (id === USER_ID) {
      const protagonist = store.worldState?.主角;
      return typeof protagonist === 'object' ? protagonist.名称 || id : id;
  }
  const character = get(store.worldState, `角色列表.${id}`) as Npc | '待初始化' | undefined;
  if (typeof character === 'object' && character !== null) {
    return character.名称 || id;
  }
  return id;
}

function getNpcId(npc: Npc | 主角): string | null {
  const characterList = store.worldState?.角色列表;
  if (!characterList) return null;

  for (const id in characterList) {
    if ((characterList as Record<string, any>)[id] === npc) {
      return id;
    }
  }
  
  const protagonist = store.worldState?.主角;
  if(typeof protagonist === 'object' && protagonist === npc) {
      return USER_ID;
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
  getLocationDetails,
  getNpcNameById,
  getNpcId,
  locationCache,
  getParentLocationName,
  cacheLocationData,
};
