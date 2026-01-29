import { Location } from '../services/location-parser';

/**
 * 递归获取一个地点及其所有子地点的ID列表。
 * @param locationId - 起始地点ID。
 * @param allLocations - 所有地点的数组。
 * @returns 返回包含起始地点及其所有子孙地点ID的Set。
 */
function getLocationAndChildrenIds(locationId: string, allLocations: Location[]): Set<string> {
  const result = new Set<string>([locationId]);
  const children = allLocations.filter(loc => loc.parentId === locationId);
  for (const child of children) {
    const childAndDescendants = getLocationAndChildrenIds(child.id, allLocations);
    childAndDescendants.forEach(id => result.add(id));
  }
  return result;
}

/**
 * 获取在一个地点及其所有子地点中的所有角色。
 * @param locationId - 要检查的父地点ID。
 * @param allLocations - 所有地点的数组。
 * @param characterLocations - 一个映射，键为角色ID，值为地点ID。
 * @returns 返回一个包含角色ID的数组。
 */
export function getCharactersInLocationAndChildren(
  locationId: string,
  allLocations: Location[],
  characterLocations: { [key: string]: string },
): string[] {
  const locationIds = getLocationAndChildrenIds(locationId, allLocations);
  const characters: string[] = [];
  for (const charId in characterLocations) {
    if (locationIds.has(characterLocations[charId])) {
      characters.push(charId);
    }
  }
  return characters;
}