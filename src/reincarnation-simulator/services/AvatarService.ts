import { LRUCache } from 'lru-cache';

// 使用LRU缓存来存储解析后的头像数据，避免重复解析世界书
const avatarCache = new LRUCache<string, Map<string, string>>({
  max: 1, // 只缓存最新的头像条目内容
  ttl: 1000 * 60 * 5, // 缓存5分钟
});

const LOREBOOK_NAME = '天华校园';
const AVATAR_ENTRY_COMMENT = '角色头像-主';

/**
 * 解析从世界书获取的头像数据字符串
 * @param content "yukinoshita_yukino | https://... \n yuigahama_yui | https://..."
 * @returns Map<characterId, avatarUrl>
 */
function parseAvatarContent(content: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!content) return map;

  content.split('\n').forEach(line => {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length === 2 && parts[0] && parts[1]) {
      map.set(parts[0], parts[1]);
    }
  });
  return map;
}

/**
 * 获取所有角色的头像映射
 * @returns Promise<Map<string, string>>
 */
async function getAvatarMap(): Promise<Map<string, string>> {
  const cachedData = avatarCache.get(AVATAR_ENTRY_COMMENT);
  if (cachedData) {
    return cachedData;
  }

  try {
    const entries = await TavernHelper.getLorebookEntries(LOREBOOK_NAME);
    const avatarEntry = entries.find(entry => entry.comment === AVATAR_ENTRY_COMMENT);
    const content = avatarEntry ? avatarEntry.content : '';
    const avatarMap = parseAvatarContent(content);
    avatarCache.set(AVATAR_ENTRY_COMMENT, avatarMap);
    return avatarMap;
  } catch (error) {
    console.error('Failed to fetch or parse avatar lorebook entry:', error);
    return new Map();
  }
}

/**
 * 根据角色ID获取头像URL
 * @param characterId 角色ID
 * @returns 头像URL或null
 */
async function getAvatarUrl(characterId: string): Promise<string | null> {
  if (!characterId) return null;
  const avatarMap = await getAvatarMap();
  return avatarMap.get(characterId) || null;
}

export const avatarService = {
  getAvatarUrl,
};
