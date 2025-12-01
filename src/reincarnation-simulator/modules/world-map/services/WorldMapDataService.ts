import type { SpatialEntity, WorldDefinition, Epoch } from '../../../types/world';
import type { MapHierarchy, MapNode } from '../types';

/**
 * @file WorldMapDataService.ts
 * @description V8.0 - 负责解析世界书数据（纪元中心化），并构建用于地图可视化的层级结构。
 *
 * @职责:
 * 1. 从指定纪元的 `内容` 模块中提取 `空间实体`。
 * 2. 将扁平的实体列表，根据 `所属` 关系，构建成一个以 "WORLD_ORIGIN" 为根的树状结构 (`MapHierarchy`)。
 * 3. 在构建过程中，为每个节点计算其子节点的数量 (`childCount`)。
 * 4. 提供一个单例方法，缓存并返回这个构建好的层级树，供其他服务（如布局服务、UI组件）使用。
 */
class WorldMapDataService {
  private hierarchyCache: MapHierarchy | null = null;

  /**
   * 获取或构建指定纪元的地图层级结构。
   * @param worldData - 从 lorebook 解析出的原始世界定义。
   * @param epochId - 要为其构建地图的纪元ID。
   * @returns - 以 "WORLD_ORIGIN" 为根节点的完整层级树。
   */
  public getMapHierarchy(epoch: Epoch | null): MapHierarchy | null {
    if (!epoch) return null;

    const cacheKey = epoch.纪元ID;
    if (this.hierarchyCache && (this.hierarchyCache as any).cacheKey === cacheKey) {
      return this.hierarchyCache;
    }

    const spatialEntities = epoch.内容?.空间实体;

    if (!spatialEntities || Object.keys(spatialEntities).length === 0) {
      console.warn(`WorldMapDataService: 在纪元 "${epoch.纪元名称}" 中没有找到 "空间实体" 数据。`);
      return null;
    }

    const hierarchy = this.buildHierarchy(Object.values(spatialEntities));
    (hierarchy as any).cacheKey = cacheKey; // Attach cache key
    this.hierarchyCache = hierarchy;
    return this.hierarchyCache;
  }

  /**
   * 清除缓存，以便下次可以重新构建层级。
   */
  public clearCache(): void {
    this.hierarchyCache = null;
  }

  /**
   * 将扁平的实体列表构建成树状结构。
   * @param entities - 空间实体数组。
   * @returns - 根节点。
   */
  private buildHierarchy(entities: SpatialEntity[]): MapHierarchy {
    const nodeMap = new Map<string, MapNode>();
    const rootNodes: MapNode[] = [];

    // 1. 创建所有节点的映射
    entities.forEach(entity => {
      nodeMap.set(entity.ID, {
        id: entity.ID,
        name: entity.名称,
        type: entity.层级类型,
        parentId: entity.所属?.ID,
        children: [],
        childCount: 0, // 将在下一步计算
        radius: 10,
        data: entity,
      });
    });

    // 2. 构建层级关系并识别根节点
    for (const node of nodeMap.values()) {
      const parent = node.parentId ? nodeMap.get(node.parentId) : null;
      if (parent) {
        parent.children.push(node);
      } else {
        // 如果没有父节点，或者父节点是 'WORLD_ORIGIN'，则其为顶级节点
        rootNodes.push(node);
      }
    }

    // 3. 计算每个节点的直接子节点数量
    for (const node of nodeMap.values()) {
      node.childCount = node.children.length;
    }

    // 4. 创建虚拟的世界原点并附加所有顶级节点
    const worldOrigin: MapNode = {
      id: 'WORLD_ORIGIN',
      name: '世界',
      type: 'Origin',
      parentId: null,
      children: rootNodes,
      childCount: rootNodes.length,
      radius: 0,
      data: {} as any,
    };

    return worldOrigin;
  }
}

export const worldMapDataService = new WorldMapDataService();
