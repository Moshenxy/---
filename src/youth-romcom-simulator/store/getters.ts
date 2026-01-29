import { computed, ComputedRef } from 'vue';
import { get } from 'lodash';
import { store, USER_ID } from './state';
import type { 角色 } from '../types';

/**
 * @file Getters - 综漫-春物篇
 * @description 经过重构，以适配新的扁平化“春物”数据结构。
 */

// --- 核心 Getters ---

/**
 * 获取玩家角色数据
 */
export const playerCharacter: ComputedRef<角色 | null> = computed(() => {
  if (!store.worldState) return null;
  const player = get(store.worldState.角色列表, USER_ID);
  if (player && typeof player !== 'string') {
    return player;
  }
  return null;
});

/**
 * 获取当前章节信息
 */
export const chapterInfo = computed(() => {
  const chapter = get(store, 'worldState.世界状态.章节');
  if (!chapter) return { title: '未知作品', details: '未知章节' };
  return {
    title: chapter.所属作品,
    details: `第${chapter.册}册 第${chapter.章}章: ${chapter.标题}`,
  };
});

/**
 * 获取格式化的世界时间字符串
 */
export const worldTimeStr = computed(() => {
  const time = get(store, 'worldState.世界状态.时间');
  if (!time) return '未知时间';
  try {
    const date = new Date(time);
    return date
      .toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      .replace(/\//g, '-');
  } catch (e) {
    return '无效时间格式';
  }
});

/**
 * 主叙事文本的 Getter
 */
export const combinedNarrative = computed(() => {
  const narrative = store.mainWorldNarrative || '等待故事的展开...';
  return `<div class="narrative-block">${narrative}</div>`;
});

/**
 * 通用变量获取函数
 * @param path - lodash get-style path to the variable in worldState
 */
export const getVariable = (path: string, defaultValue: any = null) => {
  return computed(() => get(store.worldState, path, defaultValue));
};
