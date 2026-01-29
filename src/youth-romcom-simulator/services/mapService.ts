import { memoize } from 'lodash';
import { Location, parseLocations } from './location-parser';

// 使用 memoize 确保世界书只被读取和解析一次，提升性能。
const getParsedLocations = memoize(
  async (): Promise<{
    all: Location[];
    tree: Location[];
    map: Map<string, Location>;
  }> => {
    // @ts-ignore - TavernHelper is globally available
    const locationFileContent = await TavernHelper.world.getEntryText('天华校园', '[世界观]地点列表');
    if (!locationFileContent) {
      console.error('无法加载地点列表世界书条目。');
      return { all: [], tree: [], map: new Map() };
    }

    const allLocationsMap = parseLocations(locationFileContent);
    const allLocations = Array.from(allLocationsMap.values());

    const locationMap = new Map<string, Location>();
    const locationsWithChildren = allLocations.map(loc => ({ ...loc, children: [] as Location[] }));
    locationsWithChildren.forEach(loc => locationMap.set(loc.id, loc));

    const tree: Location[] = [];
    locationsWithChildren.forEach(loc => {
      if (loc.parentId && locationMap.has(loc.parentId)) {
        const parent = locationMap.get(loc.parentId);
        parent?.children.push(loc);
      } else {
        tree.push(loc);
      }
    });

    return { all: allLocations, tree, map: locationMap };
  },
  () => 'allParsedLocations',
);

class MapService {
  private isInitialized = false;

  /**
   * 初始化服务，预热缓存
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    await getParsedLocations();
    this.isInitialized = true;
    console.log('Map service initialized and locations cached.');
  }

  /**
   * 根据父级ID获取子地点列表
   * @param parentId 父级ID，如果为null则获取顶层地点 (国家)
   */
  async getLocationsByParent(parentId: string | null): Promise<Location[]> {
    const { tree, map } = await getParsedLocations();
    if (!parentId) {
      return tree;
    }
    const parent = map.get(parentId);
    return parent?.children || [];
  }

  /**
   * 根据类型获取所有地点
   */
  async getLocationsByType(type: string): Promise<Location[]> {
    const { all } = await getParsedLocations();
    return all.filter(loc => loc.type === type);
  }

  /**
   * 根据地点ID获取该地点的完整路径（用于面包屑导航）
   * @param locationId 目标地点ID
   */
  async getLocationPath(locationId: string | null): Promise<Location[]> {
    if (!locationId) return [];
    const { map } = await getParsedLocations();
    const path: Location[] = [];
    let current = map.get(locationId);
    while (current) {
      path.unshift(current);
      current = current.parentId ? map.get(current.parentId) : undefined;
    }
    return path;
  }

  /**
   * 获取所有地点的扁平数组
   */
  async getAllLocationsFlat(): Promise<Location[]> {
    const { all } = await getParsedLocations();
    return all;
  }
}

// 导出一个单例
export const mapService = new MapService();
