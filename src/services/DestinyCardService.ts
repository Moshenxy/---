import { computed, type ComputedRef } from 'vue';
import { store } from '../store';
import type { 卡牌 as Card } from '../types';

/**
 * 命运卡牌服务
 * @description 提供与 `命运卡牌系统` 相关的业务逻辑。
 */
class DestinyCardService {
  /**
   * 获取玩家当前激活的卡牌的详细信息列表
   * @description 直接从 state 获取，因为现在存储的是完整的卡牌对象
   */
  get activeCards(): ComputedRef<Card[]> {
    return computed(() => {
      const activeCardId = store.worldState?.叙事记录.当前激活卡牌;
      if (!activeCardId) {
        return [];
      }
      const allPlayerCards = this.playerBackpackCards.value;
      const activeCard = allPlayerCards.find(card => card.ID === activeCardId);
      return activeCard ? [activeCard] : [];
    });
  }

  /**
   * 获取主角背包中的所有卡牌
   * @description 直接从 state 获取，因为现在存储的是完整的卡牌对象
   */
  get playerBackpackCards(): ComputedRef<Card[]> {
    return computed(() => {
      const protagonist = store.worldState?.主角;
      if (
        typeof protagonist === 'object' &&
        protagonist &&
        '卡牌背包' in protagonist &&
        Array.isArray(protagonist.卡牌背包)
      ) {
        // 根据 `变量结构.txt`，我们确信这里是卡牌对象数组。
        // 使用类型断言来帮助 TypeScript 正确推断类型。
        return protagonist.卡牌背包 as Card[];
      }
      return [];
    });
  }
}

export const destinyCardService = new DestinyCardService();
