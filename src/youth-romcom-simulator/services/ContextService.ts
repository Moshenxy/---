import dayjs from 'dayjs';
import { AppState, DiaryFragment, Npc, 主角, 游戏世界状态 } from '../types';
import { InformationRipple } from '../types/evolution';
import { debugService } from './DebugService';
import { diarySynthesisService } from './DiarySynthesisService';
import { lorebookService } from './LorebookService';
import { memoryRetrievalService } from './MemoryRetrievalService';
import { storylineService } from './StorylineService';

type TimeSegment = '早晨' | '上学路' | '午前' | '午休' | '午后' | '放学后' | '傍晚' | '夜';

export interface UserIntent {
  actionType: 'combat' | 'social' | 'exploration' | 'inventory' | 'creation' | 'default';
  crossContextQuery?: { worldId: string; epochId?: string; items?: string[]; locations?: string[] };
  explicitEntities: {
    characters: string[];
    locations: string[];
    dbItems: string[];
  };
  triggeredRipples: InformationRipple[];
  loadFullPlayerData?: (keyof (主角 | Npc))[];
}

class ContextService {
  private lastProcessedCardDrawTime: { 日期: string; 片段: string } | null = null;
  private hasIssuedDrawCommandForTime = false;

  public analyzeUserIntent(
    userInput: string,
    worldState: AppState['worldState'],
    availableRipples: InformationRipple[],
  ): UserIntent {
    const intent: UserIntent = {
      actionType: 'default',
      explicitEntities: {
        characters: [],
        locations: [],
        dbItems: [],
      },
      triggeredRipples: [],
    };
    if (!worldState) return intent;
    const patterns: { type: UserIntent['actionType']; regex: RegExp }[] = [
      { type: 'social', regex: /(对话|交谈|说服|询问|关系|告诉|回答|问)/ },
      { type: 'exploration', regex: /(探索|前往|调查|寻找|去|观察|看)/ },
      { type: 'inventory', regex: /(背包|物品|整理|装备|使用|查看)/ },
    ];
    for (const { type, regex } of patterns) {
      if (regex.test(userInput)) {
        intent.actionType = type;
        break;
      }
    }
    if (worldState.角色列表) {
      for (const charId in worldState.角色列表) {
        const char = worldState.角色列表[charId];
        if (typeof char === 'object' && char.名称 && userInput.includes(char.名称)) {
          intent.explicitEntities.characters.push(charId);
        }
      }
    }
    console.log('[ContextService] User Intent Analyzed:', intent);
    return intent;
  }

  public async buildLeanContext(
    intent: UserIntent,
    userInput: string,
    lastNarrative: string,
    worldState: AppState['worldState'],
    userId: string,
    diaryFragments: DiaryFragment[],
  ): Promise<{ sceneContext: object; worldContext: object }> {
    if (!worldState || typeof worldState.主角 !== 'object') {
      console.error('[ContextService] World state or protagonist not found or invalid.');
      return { sceneContext: {}, worldContext: {} };
    }

    const combinedInput = `${userInput} ${lastNarrative}`;
    const dateFilter = this.parseRelativeDate(combinedInput, worldState);

    const allStages = await storylineService.getFlattenedStages();
    const protagonist = worldState.主角;
    const protagonistId = userId;

    const { anchorCharacterNames, anchorLocationNames } = await this.parseDirectorLogForAnchors();
    const locationContext = this.buildLocationContext(worldState, protagonist, anchorLocationNames);
    const sceneContext = this.buildSceneContext(worldState, protagonist, locationContext);

    const { presentCharacters, absentCharacterSummaries, presentCharacterIds } = await this.buildCharacterContext(
      intent,
      combinedInput,
      worldState,
      protagonist,
      protagonistId,
      anchorCharacterNames,
    );

    const relationshipContext = this.buildRelationshipContext(worldState, presentCharacterIds, protagonistId);
    const directiveContext = await this.buildDirectiveContext(worldState, presentCharacterIds, allStages);
    const memoryContext = await this.buildMemoryContext(
      worldState,
      combinedInput,
      diaryFragments,
      allStages,
      userId,
      dateFilter,
    );
    const cardContext = this.buildCardContext(worldState);

    const worldContext = {
      主角: protagonist,
      在场人物: presentCharacters,
      非在场人物摘要: absentCharacterSummaries,
      关系网络: relationshipContext,
      地点: locationContext,
      导演指令: directiveContext,
      卡牌系统: cardContext,
      ...memoryContext,
    };

    debugService.setLastContext({ ...sceneContext, ...worldContext });

    return { sceneContext, worldContext };
  }

  private buildSceneContext(worldState: AppState['worldState'], protagonist: 主角 | Npc, locationContext: any): object {
    if (!worldState) {
      return { 地点: '未知', 时间: '', 天气: '晴天', 氛围: '未知' };
    }

    const locationId = protagonist?.位置;
    const currentLocation = locationId ? locationContext[locationId] : undefined;

    return {
      地点: currentLocation?.名称 || '未知',
      时间: `${worldState.世界状态.时间.日期} ${worldState.世界状态.时间.当前片段}`,
      天气: worldState.世界状态.天气,
      氛围: currentLocation?.场景特质?.map((t: any) => t.特质名称).join(', ') || '无特殊氛围',
    };
  }

  private buildLocationContext(
    worldState: AppState['worldState'],
    protagonist: 主角 | Npc | undefined,
    anchorLocationNames: string[] = [],
  ): object {
    const locationContext: any = {};
    if (!worldState?.地点) return locationContext;

    const allLocations = worldState.地点;
    const anchorLocationIds = Object.entries(allLocations)
      .filter(([, loc]) => anchorLocationNames.includes(loc.名称))
      .map(([id]) => id);

    const fullDetailLocationIds = new Set<string>(anchorLocationIds);

    if (protagonist?.位置) {
      fullDetailLocationIds.add(protagonist.位置);
      const parentIds = this.getAllParentLocationIds(protagonist.位置, allLocations);
      parentIds.forEach(id => fullDetailLocationIds.add(id));
    }

    for (const locationId in allLocations) {
      const location = allLocations[locationId];
      if (fullDetailLocationIds.has(locationId)) {
        locationContext[locationId] = location;
      } else {
        locationContext[locationId] = {
          名称: location.名称,
          层级类型: location.层级类型,
        };
      }
    }
    return locationContext;
  }

  private async buildCharacterContext(
    intent: UserIntent,
    combinedInput: string,
    worldState: AppState['worldState'],
    protagonist: 主角 | Npc | undefined,
    protagonistId: string | undefined,
    anchorCharacterNames: string[] = [],
  ): Promise<{ presentCharacters: any; absentCharacterSummaries: any; presentCharacterIds: Set<string> }> {
    const presentCharacters: any = {};
    const absentCharacterSummaries: any = {};
    const presentCharacterIds = new Set<string>();

    const clothingStyleGuide = await this.loadClothingStyles();

    if (worldState && worldState.角色列表) {
      const allChars = worldState.角色列表;
      const anchorCharIds = Object.entries(allChars)
        .filter(([, char]) => typeof char === 'object' && anchorCharacterNames.includes(char.名称))
        .map(([id]) => id);

      const sceneLocation = protagonist?.位置;
      const explicitChars = new Set(intent.explicitEntities.characters);

      const fullDetailCharIds = new Set<string>(anchorCharIds);
      if (protagonistId) fullDetailCharIds.add(protagonistId);
      explicitChars.forEach(id => fullDetailCharIds.add(id));

      for (const charId in allChars) {
        const char = allChars[charId];
        if (typeof char === 'object' && char && char.位置 === sceneLocation) {
          fullDetailCharIds.add(charId);
          presentCharacterIds.add(charId);
        }
      }

      for (const charId in allChars) {
        const char = allChars[charId];
        if (typeof char !== 'object' || !char) continue;

        const charWithStyle = { ...char };
        const styleGuide = clothingStyleGuide?.[charId] || clothingStyleGuide?.DEFAULT;
        if (styleGuide) {
          const finalStyle: any = {
            通用偏好: styleGuide.通用偏好,
            特殊情境: styleGuide.特殊情境,
          };

          const season = this.getCurrentSeason(new Date(worldState.世界状态.时间.日期));
          const weather = worldState.世界状态.天气;

          if (styleGuide.季节偏好?.[season]) {
            finalStyle.季节偏好 = { [season]: styleGuide.季节偏好[season] };
          }
          if (styleGuide.天气应对?.[weather]) {
            finalStyle.天气应对 = { [weather]: styleGuide.天气应对[weather] };
          }

          (charWithStyle as any).服装风格 = finalStyle;
        }

        if (fullDetailCharIds.has(charId)) {
          presentCharacters[charId] = charWithStyle;
          if (char.位置 === sceneLocation) presentCharacterIds.add(charId);
        } else {
          absentCharacterSummaries[charId] = {
            名称: char.名称,
            身份: char.身份,
            位置: char.位置,
            核心标识: (char as Npc).人格内核?.标识符,
          };
        }
      }
    }

    return { presentCharacters, absentCharacterSummaries, presentCharacterIds };
  }

  private buildRelationshipContext(
    worldState: AppState['worldState'],
    presentCharacterIds: Set<string>,
    protagonistId?: string,
  ): object {
    const relationshipContext: any = {};
    if (!worldState?.关系) return relationshipContext;

    const fullCausalNet = worldState.关系;
    const idsToProcess = new Set(presentCharacterIds);
    if (protagonistId) {
      idsToProcess.add(protagonistId);
    }

    for (const subjectId of idsToProcess) {
      const subjectRelations = fullCausalNet[subjectId];
      if (!subjectRelations) continue;
      relationshipContext[subjectId] = {};
      for (const objectId of idsToProcess) {
        if (subjectRelations[objectId]) {
          relationshipContext[subjectId][objectId] = subjectRelations[objectId];
        }
      }
    }
    return relationshipContext;
  }

  private async buildDirectiveContext(
    worldState: AppState['worldState'],
    presentCharacterIds: Set<string>,
    allStages: any[] | null,
  ): Promise<object> {
    if (!worldState) return {};
    const directiveContext: any = {};

    try {
      if (allStages) {
        const actionableEvent = await storylineService.getActionableStoryline(worldState);
        let foreshadowedEvents: any[] = [];

        if (actionableEvent) {
          directiveContext.待触发主线 = {
            ...actionableEvent,
            导演指导:
              '【剧情触发指令】这是一个必须发生的核心事件。请在本回合或接下来的几个回合内，严格按照以上剧本（包含NPC剧本、关键情节等）进行演绎，确保剧情向此事件发展。你可以根据`默认演化`中的描述来理解在无干预情况下的标准剧情走向。',
          };
          const actionableEventIndex = allStages.findIndex(s => s.id === actionableEvent.id);
          if (actionableEventIndex !== -1) {
            foreshadowedEvents = allStages.slice(actionableEventIndex + 1, actionableEventIndex + 4);
          }
        } else {
          const history = worldState.叙事记录?.历史事件 || [];
          const firstUncompletedIndex = allStages.findIndex(s => s.id && !history.includes(s.id));
          if (firstUncompletedIndex !== -1) {
            foreshadowedEvents = allStages.slice(firstUncompletedIndex, firstUncompletedIndex + 3);
          }
        }

        if (foreshadowedEvents.length > 0) {
          directiveContext.未来主线预告 = foreshadowedEvents.map((event: any) => ({
            ...event,
            导演指导:
              '【叙事铺垫指引】这是一个未来可能发生的事件，请将其作为背景信息。你不能直接表演其中的`关键情节`，但可以利用剧本中的所有信息（如人物关系、心态、关键道具等）在当前的叙事中进行合理的铺垫。例如，可以在对话中提及未来的关键人物，或让角色对未来的关键地点产生兴趣。',
          }));
        }
      }
    } catch (error) {
      console.error('[ContextService] Failed to process main story data:', error);
    }

    // 日历与随机事件注入
    try {
      const calendarContent = await lorebookService.readFromLorebook('[数据]日历-固定事件');
      if (calendarContent) {
        const calendarData = JSON.parse(calendarContent);
        const currentMonth = new Date(worldState.世界状态.时间.日期).getMonth() + 1;
        const currentDay = new Date(worldState.世界状态.时间.日期).getDate();
        const monthKey = String(currentMonth).padStart(2, '0');

        const fixedEvents = calendarData.events?.[monthKey] || {};

        const upcomingEvents = [];
        for (let i = 0; i < 7; i++) {
          const checkDate = new Date(worldState.世界状态.时间.日期);
          checkDate.setDate(currentDay + i);
          const checkDayKey = String(checkDate.getDate()).padStart(2, '0');
          if (fixedEvents[checkDayKey]) {
            upcomingEvents.push({
              日期: `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${checkDayKey}`,
              事件: fixedEvents[checkDayKey].join(' | '),
            });
          }
        }

        if (upcomingEvents.length > 0) {
          directiveContext.日历事件 = {
            指导: '【背景氛围素材】以下是近期将发生的日历事件，请在叙事中适当融入相关的节日氛围或活动暗示，以增强世界的真实感。',
            事件列表: upcomingEvents,
          };
        }
      }

      const randomEventsContent = await lorebookService.readFromLorebook('[数据]日历-随机事件');
      if (randomEventsContent) {
        const randomEventsData = JSON.parse(randomEventsContent);
        const randomPool = randomEventsData.pool || [];
        const availableRandomEvents = randomPool
          .slice(0, 2)
          .map((event: any) => ({ 类型: event.type, 标题: event.content, 内容: event.detail }));
        if (availableRandomEvents.length > 0) {
          directiveContext.可用随机事件 = {
            指导: '【叙事填充素材】当没有明确的主线任务时，你可以从以下随机事件中选择一个进行演绎，以丰富日常剧情。请选择与当前场景和人物心情最匹配的事件。',
            事件列表: availableRandomEvents,
          };
        }
      }
    } catch (error) {
      console.error('[ContextService] Failed to process calendar data:', error);
    }

    if (worldState.命运卡牌系统 && worldState.命运卡牌系统.下次抽卡时间) {
      const cardDrawTime = worldState.命运卡牌系统.下次抽卡时间;
      if (cardDrawTime && cardDrawTime.日期 && cardDrawTime.片段) {
        if (
          !this.lastProcessedCardDrawTime ||
          this.lastProcessedCardDrawTime.日期 !== cardDrawTime.日期 ||
          this.lastProcessedCardDrawTime.片段 !== cardDrawTime.片段
        ) {
          this.hasIssuedDrawCommandForTime = false;
          this.lastProcessedCardDrawTime = { ...cardDrawTime };
        }

        const timeToDraw = storylineService.isTimeReached(
          dayjs(worldState.世界状态.时间.日期),
          worldState.世界状态.时间.当前片段 as TimeSegment,
          {
            trigger_time: cardDrawTime,
          },
        );

        if (timeToDraw && !this.hasIssuedDrawCommandForTime) {
          directiveContext.系统指令 = directiveContext.系统指令 || [];
          directiveContext.系统指令.push({
            指令类型: '触发抽卡',
            描述: '命运的齿-轮再次转动，你感到似乎有什么新的可能性即将到来。是时候进行一次命运抽卡了。',
          });
          this.hasIssuedDrawCommandForTime = true;
        }
      }
    }

    const synthesisRequest = diarySynthesisService.getSynthesisRequest();
    if (synthesisRequest) {
      directiveContext.系统指令 = directiveContext.系统指令 || [];
      directiveContext.系统指令.push({
        指令类型: synthesisRequest.includes('日记') ? '请求合成日记' : '请求合成周刊',
        描述: synthesisRequest,
      });
    }

    return directiveContext;
  }

  private async buildMemoryContext(
    worldState: 游戏世界状态,
    combinedInput: string,
    diaryFragments: DiaryFragment[],
    allStages: any[] | null,
    userId: string,
    dateFilter?: (date: string) => boolean,
  ): Promise<object> {
    if (!worldState) return {};

    const memoryContext: any = {};

    const memories = memoryRetrievalService.getRelevantMemories(
      combinedInput,
      worldState,
      diaryFragments,
      userId,
      dateFilter,
    );

    if (memories.length > 0) {
      if (dateFilter) {
        memoryContext.指定日期记忆 = {
          指导: `【精确记忆检索】根据用户的日期提示，检索到以下记忆片段。`,
          事件列表: memories,
        };
      } else {
        memoryContext.相关记忆 = {
          指导: '【相关性记忆检索】根据你的输入，系统从记忆库中检索到了以下最相关的历史事件日志。',
          事件列表: memories,
        };
      }
    }

    if (!dateFilter && worldState.叙事记录?.历史事件 && worldState.叙事记录.历史事件.length > 0 && allStages) {
      const recentHistoryIds = worldState.叙事记录.历史事件.slice(-3);
      const recentEventsDetails = recentHistoryIds
        .map(id => allStages.find(s => (s.id || s.stage_id) === id))
        .filter(Boolean);

      if (recentEventsDetails.length > 0) {
        memoryContext.短期记忆 = {
          指导: '【短期记忆模块】以下是最近发生的3件关键主线事件的完整日志。这是确保叙事连贯性的核心参考。',
          事件列表: recentEventsDetails,
        };
      }
    }

    return memoryContext;
  }

  private async parseDirectorLogForAnchors(): Promise<{
    anchorCharacterNames: string[];
    anchorLocationNames: string[];
  }> {
    const anchorCharacterNames: string[] = [];
    const anchorLocationNames: string[] = [];
    try {
      const directorLogContent = await lorebookService.readFromLorebook('[导演场记]');
      if (directorLogContent) {
        const anchorSectionRegex = /【下回合锚点预告】\s*([\s\S]*)/;
        const match = directorLogContent.match(anchorSectionRegex);
        if (match && match[1]) {
          const content = match[1];
          const charRegex = /触发人物：(.*?)\n/;
          const locRegex = /触发地点：(.*?)\n/;

          const charMatch = content.match(charRegex);
          if (charMatch && charMatch[1]) {
            anchorCharacterNames.push(...charMatch[1].split('、').map(s => s.trim()));
          }

          const locMatch = content.match(locRegex);
          if (locMatch && locMatch[1]) {
            anchorLocationNames.push(...locMatch[1].split('、').map(s => s.trim()));
          }
        }
      }
    } catch (error) {
      console.error('[ContextService] Failed to parse director log for anchors:', error);
    }
    return { anchorCharacterNames, anchorLocationNames };
  }

  private getAllParentLocationIds(locationId: string, allLocations: Record<string, any>): string[] {
    const parents: string[] = [];
    let currentId: string | undefined = locationId;
    for (let i = 0; i < 10 && currentId; i++) {
      const location: any = allLocations[currentId];
      if (location && location.所属 && location.所属.ID) {
        const parentId: string = location.所属.ID;
        parents.push(parentId);
        currentId = parentId;
      } else {
        break;
      }
    }
    return parents;
  }

  private simplifyIdMap(map: any) {
    if (!map) return {};
    const simple: any = {};
    for (const key in map) {
      if (key === '$meta') continue;
      simple[key] = typeof map[key] === 'number' ? map[key] : true;
    }
    return simple;
  }

  private parseRelativeDate(userInput: string, worldState: 游戏世界状态): ((date: string) => boolean) | undefined {
    const currentDate = dayjs(worldState.世界状态.时间.日期);
    const chineseNumMap: { [key: string]: number } = {
      一: 1,
      二: 2,
      三: 3,
      四: 4,
      五: 5,
      六: 6,
      七: 7,
      八: 8,
      九: 9,
      十: 10,
    };

    const daysAgoMatch = userInput.match(/((\d+)|[一二三四五六七八九十])天前/);
    const weeksAgoMatch = userInput.match(/((\d+)|[一二三四五六七八九十])周前/);
    const shangZhouMatch = userInput.match(/^(上+)周/);
    const monthsAgoMatch = userInput.match(/((\d+)|[一二三四五六七八九十])个月前/);
    const specificMonthMatch = userInput.match(/((\d+)|[一二三四五六七八九十])月(的时候)?/);

    if (daysAgoMatch) {
      const numStr = daysAgoMatch[1];
      const num = parseInt(numStr, 10) || chineseNumMap[numStr];
      if (num) {
        const target = currentDate.subtract(num, 'day').format('YYYY-MM-DD');
        return (d: string) => d === target;
      }
    } else if (shangZhouMatch) {
      const num = shangZhouMatch[1].length;
      const targetWeekStart = currentDate.subtract(num, 'week').startOf('week');
      const targetWeekEnd = currentDate.subtract(num, 'week').endOf('week');
      return (d: string) => dayjs(d).isAfter(targetWeekStart) && dayjs(d).isBefore(targetWeekEnd);
    } else if (weeksAgoMatch) {
      const numStr = weeksAgoMatch[1];
      const num = parseInt(numStr, 10) || chineseNumMap[numStr];
      if (num) {
        const targetWeekStart = currentDate.subtract(num, 'week').startOf('week');
        const targetWeekEnd = currentDate.subtract(num, 'week').endOf('week');
        return (d: string) => dayjs(d).isAfter(targetWeekStart) && dayjs(d).isBefore(targetWeekEnd);
      }
    } else if (monthsAgoMatch) {
      const numStr = monthsAgoMatch[1];
      const num = parseInt(numStr, 10) || chineseNumMap[numStr];
      if (num) {
        const targetMonth = currentDate.subtract(num, 'month');
        const target = targetMonth.format('YYYY-MM');
        return (d: string) => d.startsWith(target);
      }
    } else if (userInput.includes('去年')) {
      const target = currentDate.subtract(1, 'year').format('YYYY');
      return (d: string) => d.startsWith(target);
    } else if (specificMonthMatch) {
      const numStr = specificMonthMatch[1];
      const monthNum = parseInt(numStr, 10) || chineseNumMap[numStr];
      if (monthNum && monthNum > 0 && monthNum <= 12) {
        let targetMonth = currentDate.month(monthNum - 1);
        if (targetMonth.isAfter(currentDate)) {
          targetMonth = targetMonth.subtract(1, 'year');
        }
        const target = targetMonth.format('YYYY-MM');
        return (d: string) => d.startsWith(target);
      }
    } else if (userInput.includes('上旬') || userInput.includes('月初')) {
      const prefix = currentDate.format('YYYY-MM');
      return (d: string) => d.startsWith(prefix) && parseInt(d.slice(-2), 10) <= 10;
    } else if (userInput.includes('中旬') || userInput.includes('月中')) {
      const prefix = currentDate.format('YYYY-MM');
      return (d: string) => d.startsWith(prefix) && parseInt(d.slice(-2), 10) > 10 && parseInt(d.slice(-2), 10) <= 20;
    } else if (userInput.includes('下旬') || userInput.includes('月末')) {
      const prefix = currentDate.format('YYYY-MM');
      return (d: string) => d.startsWith(prefix) && parseInt(d.slice(-2), 10) > 20;
    } else if (userInput.includes('昨天')) {
      const target = currentDate.subtract(1, 'day').format('YYYY-MM-DD');
      return (d: string) => d === target;
    } else if (userInput.includes('前天')) {
      const target = currentDate.subtract(2, 'day').format('YYYY-MM-DD');
      return (d: string) => d === target;
    }

    return undefined;
  }

  private buildCardContext(worldState: AppState['worldState']): object {
    const cardContext: any = {
      背包详情: [],
      已激活详情: [],
    };
    if (!worldState?.主角 || typeof worldState.主角 === 'string') {
      return cardContext;
    }

    // 根据新的数据结构，直接从主角和叙事记录中获取完整的卡牌对象
    cardContext.背包详情 = worldState.主角.卡牌背包 || [];
    cardContext.已激活详情 = worldState.叙事记录.当前激活卡牌 || [];

    return cardContext;
  }

  private async loadClothingStyles(): Promise<Record<string, any> | null> {
    try {
      const content = await lorebookService.readFromLorebook('[数据]服装风格指南');
      if (content) {
        const data = JSON.parse(content);
        return data.character_styles || null;
      }
    } catch (e) {
      console.error('Failed to load or parse [数据]服装风格指南', e);
    }
    return null;
  }

  private getCurrentSeason(date: Date): '春' | '夏' | '秋' | '冬' {
    const month = date.getMonth() + 1;
    if (month >= 3 && month <= 5) return '春';
    if (month >= 6 && month <= 8) return '夏';
    if (month >= 9 && month <= 11) return '秋';
    return '冬';
  }
}

export const contextService = new ContextService();
