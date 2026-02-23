import dayjs from 'dayjs';
import { AppState, Npc } from '../types';
import { lorebookService } from './LorebookService';

type TimeSegment = '早晨' | '上学路' | '午前' | '午休' | '午后' | '放学后' | '傍晚' | '夜';

// 定义从JSON加载的原始剧情结构
interface RawStoryArc {
  id: string;
  title: string;
  is_anchor: boolean;
  stages?: RawStoryStage[];
  阶段?: RawStoryStage[]; // 兼容中文key
  trigger_conditions: any;
  事件链背景?: string[];
  章节核心目标?: string;
}

interface RawStoryStage {
  id?: string; // 兼容中文key
  stage_id?: string;
  title?: string;
  阶段摘要?: string; // 兼容中文key
  summary?: string;
  trigger_time?: { date: string; segment: string };
  触发条件?: any; // 兼容中文key
  trigger_conditions?: any;
  key_characters?: string[];
  关键人物?: string[];
  key_locations?: string[];
  关键地点?: string[];
  key_items?: string[];
  关键道具?: string[];
  scene_modifiers?: string[];
  场景修饰?: string[];
  key_points?: any[];
  关键情节?: any[];
}

// 定义处理后用于显示的时间线阶段结构
export interface DisplayStoryStage extends RawStoryStage {
  arcId: string;
  arcTitle: string;
  status: 'completed' | 'current' | 'future';
  trigger_time: { date: string; segment: string };
  key_characters?: string[];
  key_locations?: string[];
  key_items?: string[];
  阶段背景?: string[];
  关键情节?: any[];
}

class StorylineService {
  private masterTimeline: RawStoryArc[] | null = null;
  private flattenedStages: (RawStoryStage & { arcId: string; arcTitle: string; trigger_time: { date: string, segment: string } })[] | null = null;
  private fixedEvents: Record<string, string[]> | null = null;

  /**
   * 加载并缓存所有主线剧情数据
   */
  private async loadMasterTimeline(): Promise<void> {
    if (this.masterTimeline) {
      return;
    }

    try {
      const storyContents = await Promise.all([
        lorebookService.readFromLorebook('[数据]主线剧情_第一卷'),
        lorebookService.readFromLorebook('[数据]主线剧情_第二卷'),
        lorebookService.readFromLorebook('[数据]主线剧情_第三卷'),
        lorebookService.readFromLorebook('[数据]主线剧情_第四卷'),
        lorebookService.readFromLorebook('[数据]主线剧情_第五卷'),
        lorebookService.readFromLorebook('[数据]主线剧情_第六卷'),
        lorebookService.readFromLorebook('[数据]主线剧情_第六点五卷'),
        lorebookService.readFromLorebook('[数据]主线剧情_第七卷'),
        lorebookService.readFromLorebook('[数据]主线剧情_第七点五卷'),
        lorebookService.readFromLorebook('[数据]主线剧情_第八卷'),
        lorebookService.readFromLorebook('[数据]主线剧情_第九卷'),
        lorebookService.readFromLorebook('[数据]主线剧情_第十卷'),
        lorebookService.readFromLorebook('[数据]主线剧情_第十点五卷'),
        lorebookService.readFromLorebook('[数据]主线剧情_第十一卷'),
        lorebookService.readFromLorebook('[数据]主线剧情_第十二卷'),
        lorebookService.readFromLorebook('[数据]主线剧情_第十三卷'),
        lorebookService.readFromLorebook('[数据]主线剧情_第十四卷'),
        lorebookService.readFromLorebook('[数据]主线剧情_第十四点五卷'),
      ]);

      let combinedTimeline: RawStoryArc[] = [];
      storyContents.forEach(content => {
        if (content) {
          try {
            const storyData = JSON.parse(content);
            if (storyData && Array.isArray(storyData.timeline)) {
              combinedTimeline = combinedTimeline.concat(storyData.timeline);
            }
          } catch (e) {
            console.error('Failed to parse story content:', e);
          }
        }
      });
      this.masterTimeline = combinedTimeline;
      this.flattenStages();
    } catch (error) {
      console.error('[StorylineService] Failed to load main story data:', error);
      this.masterTimeline = [];
    }
  }

  /**
   * 将嵌套的剧情结构扁平化为阶段列表
   */
  private flattenStages(): void {
    if (!this.masterTimeline) {
      this.flattenedStages = [];
      return;
    }
    this.flattenedStages = this.masterTimeline.flatMap(arc => {
      const stages = arc.stages || arc.阶段 || [];
      return stages
        .map(stage => {
          const rawTriggerTime = stage.trigger_time || stage.触发条件 || stage.trigger_conditions;
          let date = 'N/A';
          let segment = 'N/A';
          
          if (rawTriggerTime) {
            const conditions = rawTriggerTime.必须全部满足 || rawTriggerTime.must_all;
            if (conditions && Array.isArray(conditions)) {
              for (const condition of conditions) {
                if (typeof condition === 'string') {
                  const dateMatch = condition.match(/日期为 (\d{4}-\d{2}-\d{2})/);
                  if (dateMatch) {
                    date = dateMatch[1];
                  }
                  const segmentMatch = condition.match(/时间片段为 ([\u4e00-\u9fa5]+)/);
                  if (segmentMatch) {
                    segment = segmentMatch[1];
                  }
                }
              }
            } else if (rawTriggerTime.date) { // Fallback for simple object
              date = rawTriggerTime.date;
              segment = rawTriggerTime.segment || 'N/A';
            }
          }

          return {
            ...stage,
            id: stage.id || stage.stage_id || '',
            arcId: arc.id,
            arcTitle: arc.title,
            trigger_time: { date, segment },
          };
        })
        .filter(stage => stage.id);
    });
  }

  /**
   * 获取扁平化后的所有剧情阶段，主要供内部或关联服务使用
   * @returns {Promise<(RawStoryStage & { arcId: string; arcTitle: string })[] | null>}
   */
  public async getFlattenedStages(): Promise<
    (RawStoryStage & { arcId: string; arcTitle: string; trigger_time: { date: string; segment: string } })[] | null
  > {
    await this.loadMasterTimeline();
    return this.flattenedStages as
      | (RawStoryStage & { arcId: string; arcTitle: string; trigger_time: { date: string; segment: string } })[]
      | null;
  }

  public async getMasterTimeline(): Promise<RawStoryArc[] | null> {
    await this.loadMasterTimeline();
    return this.masterTimeline;
  }


  /**
   * (核心功能) 获取当前第一个可执行的主线剧情阶段
   * @param worldState - 当前的世界状态
   * @returns {Promise<any | null>} - 返回可触发的剧情阶段对象，或null
   */
  public async getActionableStoryline(worldState: AppState['worldState']): Promise<any | null> {
    if (!worldState) return null;
    await this.loadMasterTimeline();
    if (!this.flattenedStages) return null;

    const history = worldState.叙事记录?.历史事件 || [];
    const now = dayjs(worldState.世界状态.时间.日期);
    const currentTimeSegment = worldState.世界状态.时间.当前片段;

    for (const stage of this.flattenedStages) {
      if (!stage.id || history.includes(stage.id)) {
        continue; // 跳过已完成或没有ID的事件
      }

      const timeReached = this.isTimeReached(now, currentTimeSegment, stage);
      if (!timeReached) {
        continue;
      }

      const conditionsMet = this.checkTriggerConditions(stage, history, worldState);
      if (conditionsMet) {
        return stage; // 找到第一个满足所有条件的未完成事件
      }
    }

    return null; // 没有找到可触发的事件
  }

  public isTimeReached(now: dayjs.Dayjs, currentTimeSegment: string, stage: any): boolean {
    let dateConditionStr: string | undefined;
    let targetSegment: TimeSegment | undefined;

    // V2 format check (e.g., [数据]主线剧情_v2.json)
    if (stage.trigger_time && stage.trigger_time.date) {
      dateConditionStr = stage.trigger_time.date;
      targetSegment = stage.trigger_time.segment;
    }
    // V1 format check (e.g., [数据]主线剧情_第一卷.json)
    else if (stage.触发条件 && Array.isArray(stage.触发条件.必须全部满足)) {
      const conditions = stage.触发条件.必须全部满足;
      const dateCondition = conditions.find((c: any) => typeof c === 'string' && c.startsWith('日期为'));
      const segmentCondition = conditions.find((c: any) => typeof c === 'string' && c.startsWith('时间片段为'));
      if (dateCondition) {
        dateConditionStr = dateCondition.replace('日期为 ', '').trim();
      }
      if (segmentCondition) {
        targetSegment = segmentCondition.replace('时间片段为 ', '').trim() as TimeSegment;
      }
    }

    // 如果没有日期条件，则认为时间条件总是满足（由其他前置条件控制）
    if (!dateConditionStr) {
      return true;
    }

    const targetDate = dayjs(dateConditionStr);
    if (!targetDate.isValid()) {
      console.warn(`[StorylineService] Invalid date format in trigger: ${dateConditionStr}`);
      return false;
    }

    // 检查日期
    if (now.isBefore(targetDate, 'day')) {
      return false; // 还没到日期
    }

    // 如果是同一天，则检查时间片段
    if (now.isSame(targetDate, 'day') && targetSegment) {
      const segmentsOrder: TimeSegment[] = ['早晨', '上学路', '午前', '午休', '午后', '放学后', '傍晚', '夜'];
      const currentSegmentIndex = segmentsOrder.indexOf(currentTimeSegment as TimeSegment);
      const targetSegmentIndex = segmentsOrder.indexOf(targetSegment);

      if (targetSegmentIndex === -1) {
        console.warn(`[StorylineService] Invalid time segment in trigger: ${targetSegment}`);
        return false;
      }

      // 必须晚于或等于目标时间片段
      if (currentSegmentIndex < targetSegmentIndex) {
        return false;
      }
    }

    return true;
  }

  private checkTriggerConditions(stage: any, history: string[], worldState: AppState['worldState']): boolean {
    const conditions = stage.触发条件?.必须全部满足 || stage.trigger_conditions?.must_all;

    if (!conditions || !Array.isArray(conditions)) {
      return true; // 没有前置条件
    }

    for (const condition of conditions) {
      // V2 format
      if (typeof condition === 'object' && condition.type) {
        if (condition.type === 'event_completed') {
          if (!history.includes(condition.event_id)) return false;
        } else if (condition.type === 'character_not_has_status') {
          if (!worldState) return false;
          const characterId = condition.character_id;
          const character = characterId === '{{user}}' ? worldState.主角 : worldState.角色列表[characterId];
          if (character && character !== '待初始化' && character.当前状态.includes(condition.status)) {
            return false;
          }
        }
        // ... can add more v2 condition types here
      }
      // V1 format
      else if (typeof condition === 'string') {
        if (condition.startsWith('日期为') || condition.startsWith('时间片段为')) {
          continue; // 时间条件由 isTimeReached 处理
        }
        if (!this._parseNaturalLanguageCondition(condition, history, worldState)) {
          return false;
        }
      }
      // Malformed V1 data from screenshot
      else if (typeof condition === 'object' && condition['完成事件']) {
        if (!history.includes(condition['完成事件'])) {
          return false;
        }
      }
    }
    return true;
  }

  private _parseNaturalLanguageCondition(condition: string, history: string[], worldState: AppState['worldState']): boolean {
    if (!worldState) return false;

    // 解析 "完成事件 EVENT_ID"
    const eventMatch = condition.match(/完成事件\s+([A-Z0-9._-]+)/);
    if (eventMatch) {
      return history.includes(eventMatch[1]);
    }

    // 解析 "角色状态不包含 '状态'"
    const statusMatch = condition.match(/(\S+)\s*当前状态不包含\s*“([^”]+)”/);
    if (statusMatch) {
      const charName = statusMatch[1];
      const statusToCheck = statusMatch[2];
      if (!worldState.角色列表) return false;
      const char = Object.values(worldState.角色列表).find((c: any) => typeof c === 'object' && c.名称 === charName);
      if (char && typeof char === 'object') {
        const charStatus = (char as Npc).当前状态 || [];
        return !charStatus.some((s: any) => s.includes(statusToCheck));
      }
      return false; // 角色不存在
    }

    return true; // 默认返回true以处理非条件字符串
  }
  /**
   * 获取用于在UI上显示的主线剧情列表（当前+未来3个）
   * @param worldState - 当前的世界状态
   * @returns {Promise<DisplayStoryStage[]>} - 用于显示的时间线阶段数组
   */
  public async getDisplayTimeline(worldState: AppState['worldState']): Promise<DisplayStoryStage[]> {
    const allStages = await this.getAllTimelineStages(worldState);
    if (!allStages || !worldState) return [];

    const completedEventIds = new Set(worldState.叙事记录.历史事件);
    let lastCompletedStageIndex = -1;
    for (let i = allStages.length - 1; i >= 0; i--) {
      if (allStages[i].id && completedEventIds.has(allStages[i].id!)) {
        lastCompletedStageIndex = i;
        break;
      }
    }

    const startIndex = lastCompletedStageIndex + 1;
    const endIndex = startIndex + 4; 

    const displayStages = allStages.slice(startIndex, endIndex);

    if (displayStages.length > 0) {
      displayStages[0].status = 'current';
    }

    return displayStages;
  }

  public async getAllTimelineStages(worldState: AppState['worldState']): Promise<DisplayStoryStage[]> {
    await this.loadMasterTimeline();
    if (!this.flattenedStages) {
      return [];
    }
    const completedEventIds = new Set(worldState?.叙事记录?.历史事件 || []);

    return this.flattenedStages.map(stage => ({
      ...(stage as any),
      status: completedEventIds.has(stage.id!) ? 'completed' : 'future',
    }));
  }

  public async getFixedEvents(): Promise<Record<string, string[]>> {
    if (this.fixedEvents) {
      return this.fixedEvents;
    }

    try {
      const content = await lorebookService.readFromLorebook('[数据]日历-固定事件', true);
      if (!content) {
        this.fixedEvents = {};
        return {};
      }
      const rawData = JSON.parse(content);
      const events: Record<string, string[]> = {};
      if (rawData && rawData.events) {
        for (const month in rawData.events) {
          for (const day in rawData.events[month]) {
            const key = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            events[key] = rawData.events[month][day];
          }
        }
      }
      this.fixedEvents = events;
      return this.fixedEvents;
    } catch (error) {
      console.error('[StorylineService] Failed to load or parse fixed events:', error);
      this.fixedEvents = {};
      return {};
    }
  }
}

export const storylineService = new StorylineService();
