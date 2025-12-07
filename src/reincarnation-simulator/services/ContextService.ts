class ContextService {
  /**
   * 根据实体ID列表，生成一段符合“天衍”口吻的、引导AI审视 stat_data 特定路径的自然语言指令。
   * @param entityIds - 当前情景的核心实体ID列表
   * @param worldState - 当前的世界状态对象
   */
  public buildGuidingInstruction(entityIds: string[], worldState: any): string {
    if (!entityIds || entityIds.length === 0) {
      return '*(此乃天道之镜，映照因果之链。此间并无特定之念扰动天机，吾当自行审视此局之核心人物，观其过往，察其心念，以定今日之果。)*';
    }

    const instructions = entityIds
      .map(id => {
        const character = worldState?.角色?.[id];
        const name = character?.姓名 || character?.真名 || id;
        return `汝之心念当聚焦于 \`${name}\` (ID: ${id})。于心中默念，审视其在天道记录中的 \`角色.${id}\` 之背景、心流与短期记忆，并关联其 \`因果之网\` 中与他人的纠葛。`;
      })
      .join('\n');

    return `*(此乃天道之镜，映照因果之链。有凡俗之念扰动天机，引吾洞察其根源。${instructions}此番推演，当以此为基石。)*`;
  }

  /**
   * (这是一个简化的示例，实际项目中需要更复杂的逻辑来识别核心实体)
   * 从当前场景和玩家输入中，解析出最关键的实体ID。
   * @ DRAFT - This is a draft implementation
   */
  public identifyCoreEntities(userInput: string, currentCharacterId: string, worldState: any): string[] {
    const entities = new Set<string>([currentCharacterId]);

    // 简单的基于名称的实体识别
    if (worldState?.角色) {
      for (const id in worldState.角色) {
        const character = worldState.角色[id];
        if (character.姓名 && userInput.includes(character.姓名)) {
          entities.add(id);
        }
      }
    }

    return Array.from(entities);
  }
}

export const contextService = new ContextService();