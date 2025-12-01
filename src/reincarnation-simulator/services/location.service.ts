import { getAllLocationsMap, Location } from './location-parser';

/**
 * 缓存地点层级关系，避免重复计算
 */
let locationTreeCache: Map<string, string[]> | null = null;

/**
 * 构建并缓存所有地点的父级链
 * @returns 返回一个Map，键为地点ID，值为其所有父级地点的ID数组
 */
async function buildLocationTree(): Promise<Map<string, string[]>> {
  if (locationTreeCache) {
    return locationTreeCache;
  }

  const allLocations = await getAllLocationsMap();
  const tree = new Map<string, string[]>();

  for (const location of allLocations.values()) {
    const parentChain: string[] = [];
    let current = location;
    while (current.parentId) {
      const parent = allLocations.get(current.parentId);
      if (parent) {
        parentChain.push(parent.id);
        current = parent;
      } else {
        break; // 如果父级不存在，则停止回溯
      }
    }
    tree.set(location.id, parentChain);
  }

  locationTreeCache = tree;
  return tree;
}

/**
 * 根据地点ID获取其所有的父级地点ID
 * @param locationId 地点ID
 * @returns 父级地点ID数组
 */
export async function getParentLocations(locationId: string): Promise<string[]> {
  const tree = await buildLocationTree();
  return tree.get(locationId) || [];
}

/**
 * 获取所有角色及其所在地点，并包含所有父级地点
 * @param characterLocations 角色当前地点ID的映射
 * @returns 角色及其所有相关地点的映射
 */
export async function getCharacterLocationHierarchy(
  characterLocations: Record<string, string>,
): Promise<Record<string, string[]>> {
  const hierarchy: Record<string, string[]> = {};
  const tree = await buildLocationTree();

  for (const charId in characterLocations) {
    const locationId = characterLocations[charId];
    if (locationId) {
      const parents = tree.get(locationId) || [];
      hierarchy[charId] = [locationId, ...parents];
    }
  }
  return hierarchy;
}