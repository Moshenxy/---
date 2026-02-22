import { get } from 'lodash';
import { computed, ComputedRef } from 'vue';
import { lorebookService } from '../services/LorebookService';
import { 角色 as Character, 游戏世界状态 } from '../types';
import { store, USER_ID } from './state';

// --- 核心 Getters (已适配综漫-春物世界观) ---

/**
 * 获取玩家的角色数据
 */
export const playerCharacter: ComputedRef<Character | null> = computed(() => {
  if (!store.worldState) return null;
  const character = get(store.worldState, `角色列表.${USER_ID}`);
  // 如果角色数据是 '待初始化' 或不存在，则返回 null
  if (typeof character === 'string' || !character) {
    return null;
  }
  return character as Character;
});

/**
 * 获取主叙事文本
 */
export const mainWorldNarrative = computed(() => store.mainWorldNarrative);

/**
 * 通用变量获取函数
 * @param path - lodash get-style path to the variable
 */
export const getVariable = (path: string, defaultValue: any = null) => {
  return computed(() => get(store.worldState, path, defaultValue));
};

// --- 角色属性 Getters ---

export const playerAttributes = computed(() => {
  if (!playerCharacter.value) return [];
  return get(playerCharacter.value, '属性', {});
});

export const playerSkills = computed(() => {
  if (!playerCharacter.value) return [];
  return get(playerCharacter.value, '技能', {});
});

export const playerInventory = computed(() => {
  if (!playerCharacter.value) return [];
  return get(playerCharacter.value, '物品栏', {});
});

// --- 世界状态 Getters ---

/**
 * 获取当前世界时间字符串
 */
export const worldTimeStr = computed(() => {
  if (!store.worldState?.世界状态?.时间) {
    return '未知时间';
  }
  return new Date(store.worldState.世界状态.时间).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
});

/**
 * 统一的叙事文本输出
 */
export const combinedNarrative = computed(() => {
  const narrative = store.mainWorldNarrative || '等待故事的展开...';
  return `<div class="narrative-block main-world-narrative">${narrative}</div>`;
});

// --- 实体查找 Getters ---

/**
 * Finds an NPC from the world state by their name.
 * @param name The name of the NPC to find.
 */
export const getNpcByName = (name: string): Character | null => {
  const characters = store.worldState?.角色列表;
  if (!characters) return null;

  for (const charId in characters) {
    const character = characters[charId];
    if (typeof character !== 'string' && character && character.名称 === name) {
      return character as Character;
    }
  }
  return null;
};
