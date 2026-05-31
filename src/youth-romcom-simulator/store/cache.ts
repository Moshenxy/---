import type { AppState } from './state';

const CACHE_KEY = 'tianhua_character_state';

/**
 * 将应用状态的关键部分保存到 localStorage。
 * @param state 要保存的应用状态。
 */
export function saveStateToCache(state: AppState) {
  try {
    const stateToSave = {
      pendingActions: state.pendingActions,
      // 可以根据需要添加更多需要缓存的状态
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('[Cache] 保存状态到缓存失败:', error);
  }
}

/**
 * 从 localStorage 加载缓存的应用状态。
 * @returns 返回一个包含缓存状态的部分 AppState 对象，如果无缓存则返回空对象。
 */
export function loadStateFromCache(): Partial<AppState> {
  try {
    const cachedState = localStorage.getItem(CACHE_KEY);
    if (cachedState) {
      return JSON.parse(cachedState) as Partial<AppState>;
    }
  } catch (error) {
    console.error('[Cache] 从缓存加载状态失败:', error);
    // 如果解析失败，最好清除损坏的缓存
    localStorage.removeItem(CACHE_KEY);
  }
  return {};
}

/**
 * 清除所有与天华校园相关的缓存。
 */
export function clearAllCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('[Cache] 所有天华校园相关缓存已清除。');
  } catch (error) {
    console.error('[Cache] 清除缓存时出错:', error);
  }
}
