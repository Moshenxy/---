import { computed, reactive } from 'vue';
import { store } from '../store';
import type { Character } from '../types';
import { parseSimpleYaml } from '../utils/yamlParser';
import { lorebookService } from './LorebookService';

// 全局缓存地点ID到名称的映射
const locationNameCache = reactive(new Map<string, string>());

/**
 * 从全局状态中过滤出非玩家、非化身的角色作为NPC
 */
const allNpcs = computed(() => {
  const worldState = store.worldState;
  if (!worldState?.角色) return [];

  const userAndAvatarIds = [
    worldState.角色[store.userId]?.真名?.[0],
    worldState.模拟器?.模拟.当前化身ID?.[0]
  ].filter(Boolean);

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
        const currentEpochId = parsed?.元规则?.当前纪元ID;
        if (currentEpochId && parsed?.历史纪元?.[currentEpochId]) {
            const activeEpoch = parsed.历史纪元[currentEpochId];
            const spatialEntities = activeEpoch?.内容?.空间实体;
            if (Array.isArray(spatialEntities)) {
                for (const entity of spatialEntities) {
                    if (entity.ID && entity.名称) {
                        locationNameCache.set(entity.ID, entity.名称);
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
  return locationNameCache.get(id) || id;
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

export const npcService = {
  getNpcsByWorld,
  allNpcs,
  initializeWorldAndLocationData,
  getLocationName,
  getNpcNameById,
  getNpcId,
};
