import { get } from 'lodash';
import { 游戏世界状态, 角色 } from '../types';

/**
 * 元数据接口，描述一个实体在全局索引中的信息。
 */
export interface EntityMetadata {
  id: string;
  name: string;
  type: 'character' | 'location' | 'dbItem' | 'skill' | 'artifice' | 'talent';
  // 简化了 worldId, epochId 等字段
  category?: string; 
  path?: string;
}

/**
 * 全局实体索引服务 (适配“综漫-春物”世界观)。
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

    console.log('[EntityIndexService] Starting to build entity index for Oregairu-verse...');
    this.indexByName.clear();
    this.indexById.clear();

    // 1. 索引角色列表
    const characters = worldState.角色列表;
    for (const charId in characters) {
      const char = characters[charId];
      if (char && typeof char !== 'string' && char.名称) {
        this.addEntity({
          id: charId,
          name: char.名称,
          type: 'character',
        });
      }
    }
    
    // TODO: 索引地点、数据库物品等。
    // 目前这些数据源的结构尚不明确，暂时留空。

    this.isInitialized = true;
    console.log(`[EntityIndexService] Entity index built successfully with ${this.indexById.size} entries.`);
  }

  public findByName(name: string): EntityMetadata[] | undefined {
    return this.indexByName.get(name);
  }

  public findById(id: string): EntityMetadata | undefined {
    return this.indexById.get(id);
  }

  private addEntity(entity: EntityMetadata) {
    const existingByName = this.indexByName.get(entity.name) || [];
    this.indexByName.set(entity.name, [...existingByName, entity]);

    if (!this.indexById.has(entity.id)) {
      this.indexById.set(entity.id, entity);
    }
  }
}

export const entityIndexService = new EntityIndexService();