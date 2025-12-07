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
  if (!worldState?.角色) return [];

  const userAndAvatarIds = [worldState.角色[store.userId]?.真名?.[0], worldState.模拟器?.模拟.当前化身ID?.[0]].filter(
    Boolean,
  );

  const characters = Object.values(worldState.角色) as Character[];
  return characters.filter((char: Character) => {
    const charName = char.姓名?.[0];
    // 过滤掉没有姓名、是玩家本体或当前化身的条目
    return charName && !userAndAvatarIds.includes(charName);
  });
});

/**
 * 根据指定的世界ID获取该世界的所有NPC
 */
function getNpcsByWorld(worldId: string): Character[] {
  if (!worldId) return [];
  return allNpcs.value.filter((npc: Character) => {
    // 适配 Described<string> 类型
    const npcWorldId = Array.isArray(npc.所属世界) ? npc.所属世界[0] : npc.所属世界;
    return npcWorldId === worldId;
  });
}

/**
 * 获取所有世界的信息，并缓存所有地点的名称
 */
async function initializeWorldAndLocationData(): Promise<{ id: string; name: string }[]> {
  const entries = await lorebookService.getEntries();
  if (!entries) return [];

  const worldInfoPromises = entries.map(async (entry: any) => {
    try {
      if (entry.content) {
        const parsed = parseSimpleYaml(entry.content);
        const id = parsed?.基础信息?.ID;
        const name = parsed?.基础信息?.名称;

        // 缓存地点信息 - V8.0 纪元中心化适配
        if (parsed?.历史纪元) {
          for (const epochId in parsed.历史纪元) {
            const epoch = parsed.历史纪元[epochId];
            const spatialEntities = epoch?.内容?.空间实体;
            if (Array.isArray(spatialEntities)) {
              for (const entity of spatialEntities) {
                if (entity.ID && entity.名称) {
                  locationCache.set(entity.ID, { name: entity.名称, parentId: entity.所属?.ID || null });
                }
              }
            }
          }
        }

        if (id && name) {
          return { id, name };
        }
      }
    } catch (e) {
      console.error(`Error parsing lorebook entry ${entry.name}:`, e);
    }
    return null;
  });

  const results = await Promise.all(worldInfoPromises);
  const uniqueWorlds = new Map<string, { id: string; name: string }>();
  (results.filter(Boolean) as { id: string; name: string }[]).forEach(world => {
    if (!uniqueWorlds.has(world.id)) {
      uniqueWorlds.set(world.id, world);
    }
  });

  return Array.from(uniqueWorlds.values());
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
  const character = store.worldState?.角色?.[id];
  if (character && character.姓名 && Array.isArray(character.姓名)) {
    return character.姓名[0] || id;
  }
  return id;
}

function getNpcId(npc: Character): string | null {
  const worldState = store.worldState;
  if (!worldState?.角色) return null;

  for (const id in worldState.角色) {
    if (worldState.角色[id] === npc) {
      return id;
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
