import { get } from 'lodash';
import { computed, reactive } from 'vue';
import { store, USER_ID } from '../store';
import type { 角色 } from '../types';

const locationCache = reactive(new Map<string, { name: string; parentId: string | null }>());

/**
 * 从全局状态中过滤出非玩家的角色作为NPC
 */
const allNpcs = computed(() => {
  const worldState = store.worldState;
  if (!worldState?.角色列表) return [];

  const npcs: 角色[] = [];
  for (const charId in worldState.角色列表) {
    if (charId === USER_ID) continue;

    const char = worldState.角色列表[charId];
    if (char && typeof char !== 'string') {
      npcs.push(char);
    }
  }
  return npcs;
});

/**
 * 异步初始化NPC服务所需的数据
 */
async function initializeWorldAndLocationData(): Promise<void> {
  const worldState = store.worldState;
  if (!worldState) {
    console.warn('[NpcService] worldState is not available for initialization.');
    return;
  }
  locationCache.clear();
  console.log('[NpcService] Location cache cleared for Oregairu-verse.');
}

function getLocationName(id: string): string {
  return locationCache.get(id)?.name || id;
}

function getParentLocationName(id: string): string {
  const parentId = locationCache.get(id)?.parentId;
  if (!parentId) return '未知';
  return locationCache.get(parentId)?.name || '未知';
}

function getNpcNameById(id: string): string {
  const char = get(store, `worldState.角色列表.${id}`);
  if (char && typeof char !== 'string') {
    return char.名称;
  }
  return id === USER_ID ? '你' : id;
}

function getNpcId(npc: 角色): string | null {
  const worldState = store.worldState;
  if (!worldState?.角色列表) return null;

  for (const id in worldState.角色列表) {
    if (worldState.角色列表[id] === npc) {
      return id;
    }
  }
  return null;
}

export const npcService = {
  allNpcs,
  initializeWorldAndLocationData,
  getLocationName,
  getNpcNameById,
  getNpcId,
  locationCache,
  getParentLocationName,
};
