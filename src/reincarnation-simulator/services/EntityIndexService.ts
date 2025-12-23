import { get } from 'lodash';
import { AppState, Character, World, WorldState, WorldbookEntry } from '../types';
// @ts-ignore
import { parse } from 'yaml';

// 确保全局API在编译时可用
declare const TavernHelper: any;

/**
 * 元数据接口，描述一个实体在全局索引中的信息。
 */
export interface EntityMetadata {
  id: string; // 实体的唯一ID
  name: string; // 实体的名称
  type: 'character' | 'location' | 'dbItem' | 'imprint' | 'skill' | 'artifice' | 'talent' | 'resource' | 'faction';
  worldId: string; // 所属世界ID
  epochId?: string; // 所属纪元ID (如果适用)
  // 特定于类型的额外信息
  entryId?: string; // 世界书条目ID (如果是从世界书解析的)
  category?: string; // 数据库分类
  source?: 'player' | 'world'; // 来源
  parentId?: string | null; // 父级ID，主要用于地点
  path?: string; // 变量路径 (如果是从变量中索引的)
}

/**
 * 全局实体索引服务。
 * 在应用启动时构建一个包含所有世界、所有纪元中所有关键实体的快速查找索引。
 */
class EntityIndexService {
  private indexByName = new Map<string, EntityMetadata[]>();
  private indexById = new Map<string, EntityMetadata>();
  private isInitialized = false;

  /**
   * 构建全局索引。此函数应在应用加载初始数据后调用。
   */
  public async buildIndex(worldState: AppState['worldState']): Promise<void> {
    if (this.isInitialized || !worldState) return;

    console.log('[EntityIndexService] Starting to build global entity index...');
    this.indexByName.clear();
    this.indexById.clear();

    // 1. 索引玩家本体数据 ([InitVar].txt)
    this.indexPlayerData(worldState.玩家);

    // 2. 索引所有世界中的变量数据 ([InitVar].txt)
    for (const worldId in worldState.世界) {
      const world = worldState.世界[worldId];
      if (world) {
        this.indexWorldData(world, worldId);
      }
    }

    // 3. 索引所有世界书条目中的静态数据 (地点等)

    this.isInitialized = true;
    console.log(`[EntityIndexService] Global entity index built successfully with ${this.indexById.size} entries.`);
  }

  /**
   * 通过名称查找实体。一个名称可能对应多个实体（例如，不同纪元的同名地点）。
   */
  public findByName(name: string): EntityMetadata[] | undefined {
    return this.indexByName.get(name);
  }

  /**
   * 通过ID查找实体，ID是唯一的。
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

  private indexPlayerData(playerState: WorldState['玩家']) {
    if (!playerState) return;
    // 索引已解锁烙印等...
    const imprints = get(playerState, '本体.已解锁烙印', {}) as { [id: string]: { 名称?: string } };
    for (const id in imprints) {
      if (id === '$meta') continue;
      const imprint = imprints[id];
      if (imprint && imprint.名称) {
        this.addEntity({
          id,
          name: imprint.名称,
          type: 'imprint',
          worldId: '_player', // 特殊标识
          source: 'player',
        });
      }
    }
  }

  private indexWorldData(world: World, worldId: string) {
    // 索引世界中的角色
    const characters = get(world, '角色', {}) as { [id: string]: Character };
    for (const id in characters) {
      if (id === '$meta' || id.startsWith('sample_')) continue;
      const char = characters[id];
      if (char && char.姓名) {
        this.addEntity({
          id,
          name: char.姓名,
          type: 'character',
          worldId,
          source: 'world',
        });
      }
    }

    // 索引世界数据库
    const database = get(world, '数据库', {});
    for (const category in database) {
      if (category === '$meta') continue;
      const items = database[category as keyof typeof database] as { [id: string]: { 名称?: string } };
      if (!items) continue;
      for (const id in items) {
        if (id === '$meta') continue;
        const item = items[id];
        if (item && item.名称) {
          this.addEntity({
            id,
            name: item.名称,
            type: 'dbItem',
            worldId,
            category,
            source: 'world',
          });
        }
      }
    }

    // 索引世界定义中的内容 (V8.0 结构)
    const definition = get(world, '定义', {});
    const epochs = get(definition, '历史纪元', {}) as { [key: string]: any };
    for (const epochId in epochs) {
      if (epochId === '$meta') continue;
      const epoch = epochs[epochId];
      const content = get(epoch, '内容', {});

      // 索引空间实体
      const locations = get(content, '空间实体', {});
      for (const id in locations) {
        if (id === '$meta') continue;
        const loc = (locations as Record<string, any>)[id];
        if (loc && loc.名称) {
          this.addEntity({
            id: id,
            name: loc.名称,
            type: 'location',
            worldId,
            epochId,
            source: 'world',
            path: `定义.历史纪元.${epochId}.内容.空间实体`,
            parentId: loc.所属?.ID || null,
          });
        }
      }

      // 索引资源
      const resources = get(content, '资源', {});
      for (const id in resources) {
        if (id === '$meta') continue;
        const res = (resources as Record<string, any>)[id];
        if (res && res.名称) {
          this.addEntity({
            id: id,
            name: res.名称,
            type: 'resource',
            worldId,
            epochId,
            source: 'world',
            path: `定义.历史纪元.${epochId}.内容.资源`,
          });
        }
      }

      // 索引势力
      const factions = get(content, '文明.势力', {});
      for (const id in factions) {
        if (id === '$meta') continue;
        const fac = (factions as Record<string, any>)[id];
        if (fac && fac.名称) {
          this.addEntity({
            id: id,
            name: fac.名称,
            type: 'faction',
            worldId,
            epochId,
            source: 'world',
            path: `定义.历史纪元.${epochId}.内容.文明.势力`,
          });
        }
      }
    }
  }
}

export const entityIndexService = new EntityIndexService();
