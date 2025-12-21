import { get } from 'lodash';
import { computed, ComputedRef } from 'vue';
import { lorebookService } from '../services/LorebookService';
import { Character } from '../types';
import { store } from './state';

// --- Core Getters ---

/**
 * 获取玩家本体的角色数据
 */
export const playerCharacter: ComputedRef<Character | null> = computed(() => {
  if (!store.worldState) return null;
  return get(store.worldState, '玩家.本体', null);
});

/**
 * 获取当前模拟中的化身角色数据
 */
export const currentAvatar: ComputedRef<Character | null> = computed(() => {
  if (!store.worldState?.玩家?.模拟器 || !store.worldState?.世界) return null;

  // 1. 从模拟器获取当前化身的ID
  const avatarId = get(store.worldState.玩家.模拟器, '模拟.当前化身ID');

  // 2. 如果没有ID，则没有化身
  if (!avatarId) {
    return null;
  }

  // 3. 遍历所有世界找到化身
  for (const worldId in store.worldState.世界) {
    const character = get(store.worldState.世界[worldId], `角色.${avatarId}`);
    if (character) {
      return character;
    }
  }
  return null;
});

/**
 * 获取模拟器状态
 */
export const simulator: ComputedRef<any> = computed(() => {
  return store.worldState?.玩家.模拟器;
});

/**
 * 获取主世界叙事文本
 */
export const mainWorldNarrative = computed(() => store.mainWorldNarrative);

/**
 * 获取化身世界叙事文本
 */
export const avatarWorldNarrative = computed(() => store.avatarWorldNarrative);

/**
 * 通用变量获取函数
 * @param path - lodash get-style path to the variable
 */
export const getVariable = (path: string, defaultValue: any = null) => {
  return computed(() => get(store.worldState, path, defaultValue));
};

// --- Player Character Getters ---

export const soulEssence = computed(() => {
  if (!playerCharacter.value) return 0;
  return get(playerCharacter.value, '灵魂本源', 0);
});

export const daoHeart = computed(() => {
  if (!playerCharacter.value) return 0;
  return get(playerCharacter.value, '道心', 0);
});

export const reincarnationImprints = computed(() => {
  const character = playerCharacter.value;
  const world = mainWorld.value;
  const database = world?.数据库;

  if (!character || !database?.烙印) {
    return [];
  }

  const unlockedImprints = get(character, '已解锁烙印', {}) as Record<string, boolean>;
  const imprints = [];

  for (const imprintId in unlockedImprints) {
    if (unlockedImprints[imprintId] && database.烙印[imprintId]) {
      imprints.push({
        ...(database.烙印 as any)[imprintId],
        ID: imprintId,
      });
    }
  }
  return imprints;
});

export const playerSkills = computed(() => {
  const character = playerCharacter.value;
  const world = mainWorld.value;
  const database = world?.数据库 as any;

  if (!character || !database?.技艺) {
    return [];
  }

  const playerArts = get(character, '技艺', {}) as Record<string, { 等级: number; 经验值: number }>;
  const skills = [];

  for (const artId in playerArts) {
    const artData = playerArts[artId];
    const artTemplate = (database.技艺 as any)[artId];

    if (artTemplate && artTemplate.等级体系) {
      // Convert 等级体系 object to array, filtering out metadata
      const levelSystem = Object.values(artTemplate.等级体系).filter(
        (l: any) => typeof l === 'object' && l !== null && '等级' in l,
      );

      const currentLevelInfo = levelSystem.find((l: any) => l.等级 === artData.等级) as
        | { 升级所需经验: number; 称号: string }
        | undefined;
      const nextLevelInfo = levelSystem.find((l: any) => l.等级 === artData.等级 + 1) as
        | { 升级所需经验: number }
        | undefined;

      // Find associated active skills
      const associatedSkills = [];
      if (database.技能) {
        for (const skillId in database.技能) {
          const skillTemplate = (database.技能 as any)[skillId];
          if (skillTemplate.关联技艺 === artId) {
            associatedSkills.push(skillTemplate);
          }
        }
      }

      skills.push({
        id: artId,
        name: artTemplate.名称,
        description: artTemplate.描述,
        level: artData.等级,
        exp: artData.经验值,
        expToNextLevel: nextLevelInfo ? nextLevelInfo.升级所需经验 : currentLevelInfo?.升级所需经验 || 'MAX',
        title: currentLevelInfo ? currentLevelInfo.称号 : '',
        associatedSkills,
      });
    }
  }

  return skills;
});

// --- 新的统一背包 Getter ---

const createInventoryGetter = (characterRef: ComputedRef<Character | null>) => {
  return computed(() => {
    const character = characterRef.value;
    const world = store.activeView === 'mainWorld' ? mainWorld.value : avatarWorld.value;
    const database = world?.数据库 as any;

    if (!character || !database) {
      return [];
    }

    const backpack = get(character, '背包', {});
    const items = [];

    for (const itemId in backpack) {
      const quantity = (backpack as any)[itemId];
      if (quantity <= 0) continue;

      // 在数据库的所有分类中查找物品
      let itemDetails = null;
      for (const category in database) {
        const categoryStore = (database as any)[category];
        if (categoryStore && categoryStore[itemId]) {
          itemDetails = categoryStore[itemId];
          break;
        }
      }

      if (itemDetails) {
        items.push({
          ...itemDetails,
          ID: itemId, // 确保ID存在
          数量: quantity,
        });
      }
    }
    return items;
  });
};

export const playerInventory = createInventoryGetter(playerCharacter);
export const avatarInventory = createInventoryGetter(currentAvatar);

export const basePotentials = computed(() => {
  if (!playerCharacter.value) return {};
  return get(playerCharacter.value, '基础潜力', {});
});

export const playerWorldAttributes = computed(() => {
  const character = playerCharacter.value;
  if (!character || !character.世界专属属性 || !character.所属世界) {
    return [];
  }

  const world = store.worldState?.世界?.[character.所属世界];
  const currentEpochId = world?.定义?.元规则?.当前纪元ID;
  if (!world || !currentEpochId) {
    // 如果没有世界或纪元信息，直接返回原始ID
    return Object.entries(character.世界专属属性)
      .filter(([key]) => key !== '$meta')
      .map(([key, value]) => ({ key, value, description: null }));
  }

  const currentEpoch = (world.定义.历史纪元 as Record<string, any>)?.[currentEpochId];
  const attributeTemplates = currentEpoch?.力量体系?.属性模板 as Record<string, any> | undefined;

  const result: { key: string; value: any; description: string | null }[] = [];
  const attributesData = character.世界专属属性;

  for (const key in attributesData) {
    if (key === '$meta') continue;

    const value = (attributesData as any)[key];
    const template = attributeTemplates ? attributeTemplates[key] : null;

    result.push({
      key: template?.名称 || key,
      value: value,
      description: template?.描述 || null,
    });
  }

  return result;
});

// --- Simulator Getters ---

export const isSimulationRunning = computed(() => {
  if (!simulator.value) return false;

  // 尝试直接获取布尔值或数组
  const isRunningValue = get(simulator.value, '模拟.进行中', false);

  // 检查获取到的值是否为数组，如果是，则取第一个元素
  return !!isRunningValue;
});

export const simulatorCooldown = computed(() => {
  if (!simulator.value) return { status: '未知', remainingTime: 'N/A' };
  const prep = get(simulator.value, '准备', {});
  const status = get(prep, '状态', '未知');
  const time = get(prep, '冷却时间', 'N/A');

  return { status, remainingTime: time };
});

export const simulatorStatus = computed(() => {
  const sim = simulator.value;
  if (!sim) return 'unknown';

  if (get(sim, '结算.待处理')) {
    return 'settlement';
  }
  if (get(sim, '模拟.进行中')) {
    return 'simulating';
  }
  if (get(sim, '准备.已选世界ID') && !get(sim, '模拟.进行中')) {
    return 'avatar-selection';
  }
  if (get(sim, '准备.状态') === '冷却中') {
    return 'cooldown';
  }
  if (get(sim, '准备.状态') === '就绪') {
    return 'world-selection';
  }
  return 'unknown';
});

/**
 * 获取主世界对象
 */
export const mainWorld = computed(() => {
  if (!store.worldState?.世界) return null;
  const worlds = store.worldState.世界;
  for (const worldId in worlds) {
    if (worldId === '$meta' || worldId.includes('template')) continue;
    if (get(worlds[worldId], '定义.元规则.定位') === '主世界') {
      return worlds[worldId];
    }
  }
  return null;
});

/**
 * 获取当前化身所在的世界对象
 */
export const avatarWorld = computed(() => {
  if (!store.worldState?.世界) return null;
  const worlds = store.worldState.世界;
  for (const worldId in worlds) {
    if (worldId === '$meta' || worldId.includes('template')) continue;
    if (get(worlds[worldId], '定义.元规则.定位') === '当前化身世界') {
      return worlds[worldId];
    }
  }
  return null;
});

/**
 * 获取当前激活的纪元对象
 */
export const activeEpoch = computed(() => {
  const world = avatarWorld.value || mainWorld.value;
  if (!world) return null;

  const currentEpochId = get(world, '定义.元规则.当前纪元ID');
  if (!currentEpochId) return null;

  return get(world, `定义.历史纪元.${currentEpochId}`, null);
});

/**
 * 内部辅助函数：格式化时间对象
 */
const formatTime = (time: any, defaultString: string): string => {
  if (!time) return defaultString;

  const era = get(time, '纪元名称', '');
  const year = get(time, '年', '----');
  const month = String(get(time, '月', '--')).padStart(2, '0');
  const day = String(get(time, '日', '--')).padStart(2, '0');
  const hour = String(get(time, '时', '--')).padStart(2, '0');
  const minuteValue = get(time, '分');
  // 增加健壮性：处理浮点数和null值
  const minute =
    minuteValue !== null && minuteValue !== undefined && !isNaN(parseInt(String(minuteValue), 10))
      ? String(parseInt(String(minuteValue), 10)).padStart(2, '0')
      : '--';

  return `${era} ${year}年${month}月${day}日 ${hour}:${minute}`;
};

/**
 * 获取主世界的时间字符串
 */
export const mainWorldTimeStr = computed(() => {
  const world = mainWorld.value;
  if (!world) return '轮回空间';
  const epochId = get(world, '定义.元规则.当前纪元ID');
  if (!epochId) return '未知纪元';
  const epoch = get(world, `定义.历史纪元.${epochId}`);
  return formatTime(get(epoch, '当前时间'), '轮回空间');
});

/**
 * 获取当前化身世界的时间字符串
 */
export const timeStr = computed(() => {
  const world = avatarWorld.value;
  if (!world) return '未知时间';
  const epochId = get(world, '定义.元规则.当前纪元ID');
  if (!epochId) return '未知纪元';
  const epoch = get(world, `定义.历史纪元.${epochId}`);
  return formatTime(get(epoch, '当前时间'), '未知时间');
});

/**
 * 通用年龄计算辅助函数
 */
export const calculateAge = (character: Character | null, world: any | null): number | null => {
  if (!character || !world) return null;

  const birthDate = get(character, '出生日期');
  const epochId = get(world, '定义.元规则.当前纪元ID');
  const epoch = get(world, `定义.历史纪元.${epochId}`);
  const currentTime = get(epoch, '当前时间');

  if (!birthDate || !currentTime || birthDate.纪元ID !== epochId) {
    // 纪元不同，无法直接计算
    return null;
  }

  let age = currentTime.年 - birthDate.年;
  if (currentTime.月 < birthDate.月 || (currentTime.月 === birthDate.月 && currentTime.日 < birthDate.日)) {
    age--;
  }
  return age >= 0 ? age : null;
};

/**
 * 计算玩家年龄
 */
export const playerAge = computed(() => {
  return calculateAge(playerCharacter.value, mainWorld.value);
});

/**
 * 组合主世界和化身世界的叙事，用于统一显示
 */
export const combinedNarrative = computed(() => {
  // 根据 activeView 决定显示哪个世界的叙事
  if (store.activeView === 'mainWorld') {
    const narrative = store.mainWorldNarrative || '等待主世界故事的展开...';
    // 返回带样式的 HTML
    return `<div class="narrative-block main-world-narrative">${narrative}</div>`;
  }

  if (store.activeView === 'avatarWorld') {
    if (isSimulationRunning.value) {
      const narrative = store.avatarWorldNarrative || '化身世界暂无动静...';
      // 返回带样式的 HTML
      return `<div class="narrative-block avatar-world-narrative">${narrative}</div>`;
    }
    return '<div class="narrative-block narrative-placeholder">模拟未在进行中。</div>';
  }

  // 默认或错误状态下的显示
  return '<div class="narrative-block narrative-placeholder">未知的视图...</div>';
});

// --- Entity Getters for Tooltips ---

/**
 * Finds an item across all known item lists by its name.
 * @param name The name of the item to find.
 */
export const getItemByName = (name: string): any | null => {
  const world = store.activeView === 'mainWorld' ? mainWorld.value : avatarWorld.value;
  const database = world?.数据库;
  if (!database) return null;

  for (const category in database) {
    const categoryStore = (database as any)[category];
    if (categoryStore) {
      for (const itemId in categoryStore) {
        const item = categoryStore[itemId];
        if (item.名称 === name) {
          return item;
        }
      }
    }
  }
  return null;
};

/**
 * Finds an NPC from the world state by their name.
 * @param name The name of the NPC to find.
 */
export const getNpcByName = (name: string): Character | null => {
  const worlds = store.worldState?.世界;
  if (!worlds) return null;

  for (const worldId in worlds) {
    const characters = get(worlds[worldId], '角色');
    if (characters) {
      for (const charId in characters) {
        if (charId === '$meta') continue;

        const character = characters[charId];
        if (character && character.姓名 && character.姓名 === name) {
          return character;
        }
      }
    }
  }
  return null;
};

export const worldSandboxData = computed(() => {
  const nodes: any[] = [];
  const edges: any[] = [];
  const worldState = store.worldState;

  if (!worldState) {
    return { nodes, edges };
  }

  // Add worlds as nodes
  if (worldState.世界) {
    for (const worldId in worldState.世界) {
      // 过滤掉元数据和模板ID
      if (worldId === '$meta' || worldId.includes('template')) continue;
      const world = worldState.世界[worldId];
      // 确保world对象不是一个空的模板
      const epochId = get(world, '定义.元规则.当前纪元ID');
      if (!epochId) continue;

      const activeEpoch = get(world, `定义.历史纪元.${epochId}`);
      if (!activeEpoch || !activeEpoch.规则) continue;

      const loreEntry = lorebookService.findEntryByComment(worldId);
      const worldName = loreEntry?.comment || get(world, '定义.元规则.定位') || worldId;

      const title = `
        能级: ${activeEpoch.规则?.世界能级 || '未知'}<br>
        时间流速: ${activeEpoch.规则?.时间流速 || '未知'}x<br>
        空间稳定性: ${activeEpoch.规则?.空间稳定性 || '未知'}
      `.trim();

      nodes.push({
        id: worldId,
        label: worldName,
        group: 'world',
        title: title,
      });
    }
  }

  // Add characters as nodes
  const player = playerCharacter.value;
  if (player) {
    const potentials = player.基础潜力;
    const potentialText = potentials
      ? `精: ${potentials.精} | 气: ${potentials.气} | 神: ${potentials.神} | 运: ${potentials.运}`
      : '';
    const identities = player.身份
      ? Object.values(player.身份)
          .filter(item => typeof item === 'string')
          .join(', ')
      : '';
    const title = `
        ${identities}<br>
        ${potentialText}
      `.trim();

    nodes.push({
      id: store.userId,
      label: player.真名 || store.userId,
      group: 'player',
      title: title,
    });
  }

  if (worldState.世界) {
    for (const worldId in worldState.世界) {
      const world = worldState.世界[worldId];
      if (!world.角色) continue;
      for (const charId in world.角色) {
        if (charId === '$meta' || charId.includes('sample')) continue;
        const character = world.角色[charId];
        if (!character.姓名) continue;

        const potentials = character.基础潜力;
        const potentialText = potentials
          ? `精: ${potentials.精} | 气: ${potentials.气} | 神: ${potentials.神} | 运: ${potentials.运}`
          : '';
        const identities = character.身份
          ? Object.values(character.身份)
              .filter(item => typeof item === 'string')
              .join(', ')
          : '';
        const title = `
          ${identities}<br>
          ${potentialText}
        `.trim();

        nodes.push({
          id: charId,
          label: character.姓名 || charId,
          group: 'npc',
          title: title,
        });

        if (character.所属世界 && worldState.世界?.[character.所属世界]) {
          edges.push({
            from: charId,
            to: character.所属世界,
            arrows: 'to',
          });
        }
      }
    }
  }

  // Add edges for relationships from 因果之网
  if (worldState.世界) {
    for (const worldId in worldState.世界) {
      const world = worldState.世界[worldId];
      if (!world.因果之网) continue;
      for (const subjectId in world.因果之网) {
        if (!get(world, `角色.${subjectId}`) && subjectId !== store.userId) continue;

        const subjectRelations = world.因果之网[subjectId];
        for (const objectId in subjectRelations) {
          if (!get(world, `角色.${objectId}`) && objectId !== store.userId) continue;

          const relationship = subjectRelations[objectId];
          const totalFavor =
            (get(relationship, '情感层.亲近感', 0) || 0) + (get(relationship, '情感层.仰慕度', 0) || 0);
          const conflict = get(relationship, '利益层.利益冲突', 0) || 0;

          edges.push({
            from: subjectId,
            to: objectId,
            label: get(relationship, '印象标签.综合标签', ''),
            color: totalFavor > 50 ? '#4caf50' : totalFavor < -50 ? '#f44336' : '#9e9e9e',
            dashes: conflict > 50, // Dashed line for high conflict
            arrows: 'to',
          });
        }
      }
    }
  }

  return { nodes, edges };
});

export const ripples = computed(() => {
  if (!store.worldState?.玩家?.模拟器?.结算) return null;
  return store.worldState.玩家.模拟器.结算;
});
