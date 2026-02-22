import { get } from 'lodash';
import type { 游戏世界状态, 角色 } from '../types';

/**
 * 元数据接口，描述一个实体在全局索引中的信息。
 */
export interface EntityMetadata {
  id: string; // 实体的唯一ID
  name: string; // 实体的名称
  type: 'character' | 'location' | 'skill' | 'item';
  path: string; // 在 worldState 中的完整路径
  ownerId?: string; // 所属角色的ID (对于技能/物品)
}

/**
 * 全局实体索引服务 V2.0 - 适配 `综漫-春物` 世界观。
 * 在应用启动时构建一个包含所有关键实体的快速查找索引。
 */
class EntityIndexService {
  private indexByName = new Map<string, EntityMetadata[]>();
  private indexById = new Map<string, EntityMetadata>();
  private isInitialized = false;

  /**
   * 构建全局索引。
   */
  public async buildIndex(worldState: 游戏世界状态 | null): Promise<void> {
    if (this.isInitialized || !worldState) return;

    console.log('[EntityIndexService] Starting to build global entity index...');
    this.indexByName.clear();
    this.indexById.clear();

    // 1. 索引角色
    if (worldState.角色列表) {
      this.indexCharacters(worldState.角色列表);
    }

    // 2. 索引空间实体
    if (worldState.空间实体) {
      this.indexLocations(worldState.空间实体);
    }

    this.isInitialized = true;
    console.log(`[EntityIndexService] Global entity index built successfully with ${this.indexById.size} entries.`);
  }

  /**
   * 通过名称查找实体。
   */
  public findByName(name: string): EntityMetadata[] | undefined {
    return this.indexByName.get(name);
  }

  /**
   * 通过ID查找实体。
   */
  public findById(id: string): EntityMetadata | undefined {
    return this.indexById.get(id);
  }

  // --- 私有索引方法 ---

  private addEntity(entity: EntityMetadata) {
    // 按名称索引
    const existingByName = this.indexByName.get(entity.name) || [];
    this.indexByName.set(entity.name, [...existingByName, entity]);
    
    // 按ID索引
    if (!this.indexById.has(entity.id)) {
      this.indexById.set(entity.id, entity);
    }
  }

  private indexCharacters(characters: { [key: string]: 角色 | '待初始化' }) {
    for (const charId in characters) {
      const char = characters[charId];
      if (typeof char !== 'object') continue;

      // 索引角色本身
      this.addEntity({
        id: charId,
        name: char.名称,
        type: 'character',
        path: `角色列表.${charId}`,
      });

      // 索引角色的技能
      if (char.技能) {
        for (const skillId in char.技能) {
          const skill = char.技能[skillId];
          this.addEntity({
            id: `${charId}-${skillId}`,
            name: skillId, // 技能名即ID
            type: 'skill',
            path: `角色列表.${charId}.技能.${skillId}`,
            ownerId: charId,
          });
        }
      }

      // 索引角色的物品
      if (char.物品栏) {
        for (const itemId in char.物品栏) {
          this.addEntity({
            id: itemId,
            name: itemId, // 物品名即ID, 未来可扩展为从物品数据库获取
            type: 'item',
            path: `角色列表.${charId}.物品栏.${itemId}`,
            ownerId: charId,
          });
        }
      }
    }
  }

  private indexLocations(locations: { [key: string]: any }) {
    for (const locId in locations) {
      const loc = locations[locId];
      if (loc && loc.名称) {
        this.addEntity({
          id: locId,
          name: loc.名称,
          type: 'location',
          path: `空间实体.${locId}`,
        });
      }
    }
  }
}

export const entityIndexService = new EntityIndexService();