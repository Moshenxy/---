import { get } from 'lodash';
import { AppState, World, SpatialEntity } from '../types';
import {
  EvolutionaryPressure,
  InformationPropagationRule,
  InformationRipple,
  StressReactionEvent,
} from '../types/evolution';
import { entityIndexService } from './EntityIndexService';

/**
 * 核心服务，作为独立于玩家的“世界引擎”。
 * 负责在后台模拟世界的内在演化，包括：
 * 1. 识别并施加“演化压力”。
 * 2. 根据压力生成“应激反应”（远方事件）。
 * 3. 模拟事件“涟漪”的“时空延迟传播”。
 */
class WorldEvolutionService {
  /**
   * 全局的信息延迟队列，存储着所有正在传播但尚未抵达的“信息涟漪”。
   */
  private informationDelayQueue: InformationRipple[] = [];

  /**
   * 扫描全局状态，识别出最紧迫的“演化压力源”。
   * @param worldState - 当前的完整世界状态。
   * @returns 一个演化压力对象的数组。
   */
  public applyPressure(worldState: AppState['worldState']): EvolutionaryPressure[] {
    const pressures: EvolutionaryPressure[] = [];
    if (!worldState?.世界) return pressures;

    for (const world of Object.values(worldState.世界)) {
      // 1. 欲望压力: 遍历主线NPC，检查其长期目标与现状的差距
      const characters = get(world, '角色', {}) as { [id: string]: Character };
      for (const charId in characters) {
        if (charId.startsWith('sample_')) continue; // 修正：过滤掉模板NPC
        const char = characters[charId] as Character;
        if (!char || !('姓名' in char)) continue;

        const desire = get(char, '心流.驱动力.长期目标');
        const powerLevel = get(char, '战斗参数.权能', 0);
        const spirit = get(char, '基础潜力.神', 0);

        // 条件1：有强烈欲望（野心家）
        const isAmbitious = desire && Object.values(desire).some((g: any) => g.状态 === '进行中');

        // 条件2：自身力量过强（潜在威胁）
        const isPowerful = powerLevel > 100 || spirit > 8; // 阈值可调整

        if (isAmbitious || isPowerful) {
          const firstGoal = isAmbitious
            ? (Object.values(desire)[0] as any)
            : { 名称: '维持自身存在', 动机: '其强大的力量无时无刻不在影响周围。' };
          let intensity = spirit * 5 + get(char, '心流.情绪状态.怒意', 0);
          if (isPowerful && !isAmbitious) {
            intensity = powerLevel / 10; // 纯粹的力量压力
          }

          pressures.push({
            type: isAmbitious ? 'desire' : 'authority', // 力量本身是一种权柄压力
            source: { type: 'npc', id: charId },
            intensity,
            description: `[${char.姓名}] 的存在或意志正在形成压力。`,
            intent: firstGoal.动机 || '未知',
          });
        }
      }
    }

    console.log(`[EvoSys-Pressure] Identified ${pressures.length} evolutionary pressures.`, pressures);
    return pressures;
  }

  /**
   * 根据压力，生成具体的“应激反应”（远方事件）。
   * @param pressures - 当前世界承受的演化压力。
   * @param worldState - 当前的完整世界状态。
   * @returns 一个新发生的应激反应事件对象的数组。
   */
  public simulateReactions(
    pressures: EvolutionaryPressure[],
    worldState: AppState['worldState'],
  ): StressReactionEvent[] {
    const reactions: StressReactionEvent[] = [];
    if (!worldState) return reactions;

    console.log(`[EvoSys-Reaction] Simulating reactions for ${pressures.length} pressures...`);
    for (const pressure of pressures) {
      if (pressure.intensity > 50) {
        // 仅当压力足够大时才触发
        const sourceChar = get(
          worldState,
          `世界.${entityIndexService.findById(pressure.source.id)?.worldId}.角色.${pressure.source.id}`,
        );
        if (sourceChar) {
          const newEvent: StressReactionEvent = {
            id: `event_${pressure.source.id}_${Date.now()}`,
            timestamp: Date.now(), // 实际应使用游戏内时间
            locationId: sourceChar.当前位置,
            type: 'personal',
            description: `${sourceChar.姓名} 在其执念的驱使下，开始采取行动：${pressure.intent}`,
            participants: [pressure.source.id],
            sourcePressure: pressure,
          };
          reactions.push(newEvent);
          console.log(`[EvoSys-Reaction] Generated event:`, newEvent);
        }
      }
    }

    return reactions;
  }

  /**
   * 模拟事件“涟漪”的时空延迟传播。
   * @param event - 一个新发生的远方事件。
   * @param worldState - 当前的完整世界状态。
   */
  public propagateRipples(event: StressReactionEvent, worldState: AppState['worldState']) {
    if (!worldState?.世界) return;

    const worldId = event.locationId ? entityIndexService.findById(event.locationId)?.worldId : null;
    if (!worldId) return;

    const world = worldState.世界[worldId];
    if (!world) return;

    // 1. 根据事件类型，生成数个 InformationRipple。
    // 占位逻辑：
    const ripple: Omit<InformationRipple, 'arrivalTimestamp'> = {
      id: `ripple_${event.id}_${Math.random().toString(36).substring(2, 6)}`,
      sourceEventId: event.id,
      type: 'rumor',
      content: `听说在${entityIndexService.findById(event.locationId)?.name || '远方'}发生了大事！`,
      sphereOfInfluence: { locationIds: [], factionIds: [] },
      decayRate: 0.1,
      distortion: 0,
    };

    // 2. 读取世界规则中的信息传播法则。
    const propagationRules = get(world, '定义.规则.信息传播法则', []) as InformationPropagationRule[];
    const rule = propagationRules.find(r => r.medium === ripple.type) || { baseSpeed: 100 }; // 默认速度

    // 3. 计算延迟时间。
    // 假设玩家在主世界，我们需要计算从事件发生地到玩家所在地的距离。
    // 这是一个复杂的计算，需要一个专门的距离计算服务。此处为占位实现。
    const distance = 1000; // 占位：1000公里
    const delayDays = distance / rule.baseSpeed;
    const delayMilliseconds = delayDays * 24 * 60 * 60 * 1000;
    const arrivalTimestamp = event.timestamp + delayMilliseconds;

    // 4. 将涟漪推入 informationDelayQueue。
    const newRipple: InformationRipple = { ...ripple, arrivalTimestamp };
    this.informationDelayQueue.push(newRipple);
    console.log(
      `[EvoSys-Ripple] New ripple queued. Distance: ${distance}km. Arrival in ${delayDays.toFixed(1)} days.`,
      newRipple,
    );
    console.log('[EvoSys-Queue] Current Information Delay Queue:', this.informationDelayQueue);
  }

  /**
   * 检视队列，返回所有已“到期”的涟漪。
   * @param currentTime - 当前的游戏时间戳。
   * @returns 一个信息涟漪对象的数组。
   */
  public getAvailableRipples(currentTime: number): InformationRipple[] {
    const availableRipples: InformationRipple[] = [];
    const remainingRipples: InformationRipple[] = [];

    for (const ripple of this.informationDelayQueue) {
      if (ripple.arrivalTimestamp <= currentTime) {
        availableRipples.push(ripple);
      } else {
        remainingRipples.push(ripple);
      }
    }

    // 更新队列，移除已处理的涟漪
    this.informationDelayQueue = remainingRipples;

    if (availableRipples.length > 0) {
      console.log(
        `[EvoSys-Gravity] ${availableRipples.length} ripples have arrived and are now available as 'narrative material'.`,
        availableRipples,
      );
    }

    return availableRipples;
  }

  /**
   * 计算两个空间实体之间的逻辑距离。
   * @param locationIdA - 起点ID
   * @param locationIdB - 终点ID
   * @param world - 所在的世界对象
   * @returns 距离（公里），如果无法计算则返回null
   */
  private calculateDistance(locationIdA: string, locationIdB: string, world: World): number | null {
    const locationA = entityIndexService.findById(locationIdA);
    const locationB = entityIndexService.findById(locationIdB);

    if (!locationA || !locationB || !world) return null;

    // 简化逻辑：如果属于同一个父实体，则使用相对坐标距离。
    // 复杂的寻路算法（如A*）将在此处实现。
    if (locationA.parentId === locationB.parentId && locationA.parentId !== 'WORLD_ORIGIN') {
      const epochId = locationA.epochId || get(world, '定义.元规则.当前纪元ID');
      if (!epochId) return null;
      const parentEntity = get(world, `定义.历史纪元.${epochId}.内容.空间实体.${locationA.parentId}`) as SpatialEntity;
      const locAData = get(world, `定义.历史纪元.${epochId}.内容.空间实体.${locationIdA}`) as SpatialEntity;
      const locBData = get(world, `定义.历史纪元.${epochId}.内容.空间实体.${locationIdB}`) as SpatialEntity;

      if (locAData?.相对坐标 && locBData?.相对坐标) {
        // 简化：直接返回两者距离之和，实际应使用向量计算
        return (locAData.相对坐标.距离?.[0] || 0) + (locBData.相对坐标.距离?.[0] || 0);
      }
    }

    // 默认/跨区域的占位距离
    return 1000;
  }
}

export const worldEvolutionService = new WorldEvolutionService();
