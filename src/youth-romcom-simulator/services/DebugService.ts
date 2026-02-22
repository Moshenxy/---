import { reactive } from 'vue';
import { lorebookService } from './LorebookService';

interface DebugInfo {
  mainStoryStatus: string;
  mainStoryContent: any;
  mainStoryStats: {
    filesLoaded: number;
    totalEvents: number;
    actionableEvents: number;
    foreshadowedEvents: number;
  };
  calendarFixedStatus: string;
  calendarFixedContent: any;
  calendarRandomStatus: string;
  calendarRandomContent: any;
  calendarCrossoverStatus: string;
  calendarCrossoverContent: any;
  styleGuideStatus: string;
  styleGuideContent: any;
  lastContext: any;
}

class DebugService {
  public state = reactive<DebugInfo>({
    mainStoryStatus: '未读取',
    mainStoryContent: null,
    mainStoryStats: {
      filesLoaded: 0,
      totalEvents: 0,
      actionableEvents: 0,
      foreshadowedEvents: 0,
    },
    calendarFixedStatus: '未读取',
    calendarFixedContent: null,
    calendarRandomStatus: '未读取',
    calendarRandomContent: null,
    calendarCrossoverStatus: '未读取',
    calendarCrossoverContent: null,
    styleGuideStatus: '未读取',
    styleGuideContent: null,
    lastContext: null,
  });

  public async refreshData() {
    // 1. 读取所有主线剧情卷宗
    try {
      const storyEntryKeys = [
        '[数据]主线剧情_第一卷',
        '[数据]主线剧情_第二卷',
        '[数据]主线剧情_第三卷',
        '[数据]主线剧情_第四卷',
        '[数据]主线剧情_第五卷',
        '[数据]主线剧情_第六卷',
        '[数据]主线剧情_第六点五卷',
        '[数据]主线剧情_第七卷',
        '[数据]主线剧情_第七点五卷',
        '[数据]主线剧情_第八卷',
        '[数据]主线剧情_第九卷',
        '[数据]主线剧情_第十卷',
        '[数据]主线剧情_第十点五卷',
        '[数据]主线剧情_第十一卷',
        '[数据]主线剧情_第十二卷',
        '[数据]主线剧情_第十三卷',
        '[数据]主线剧情_第十四卷',
        '[数据]主线剧情_第十四点五卷',
      ];

      const storyContents = await Promise.all(storyEntryKeys.map(key => lorebookService.readFromLorebook(key)));

      const loadedStories = storyContents
        .filter(c => c)
        .map(c => {
          try {
            return JSON.parse(this._cleanJsonString(c!));
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      if (loadedStories.length > 0) {
        this.state.mainStoryContent = loadedStories;
        this.state.mainStoryStatus = `读取成功 (${loadedStories.length}/${storyEntryKeys.length})`;
        const totalEvents = loadedStories.reduce((acc, story) => acc + (story.timeline?.length || 0), 0);
        this.state.mainStoryStats.filesLoaded = loadedStories.length;
        this.state.mainStoryStats.totalEvents = totalEvents;
      } else {
        this.state.mainStoryStatus = '读取失败：所有主线条目均为空或无效';
      }
    } catch (e) {
      this.state.mainStoryStatus = `读取失败：${(e as Error).message}`;
    }

    // 2. 读取新的日历文件
    await this.loadDebugEntry('[数据]日历-固定事件', 'calendarFixedStatus', 'calendarFixedContent');
    await this.loadDebugEntry('[数据]日历-随机事件', 'calendarRandomStatus', 'calendarRandomContent');
    await this.loadDebugEntry('[数据]日历-跨界事件', 'calendarCrossoverStatus', 'calendarCrossoverContent');

    // 3. 读取服装风格指南
    await this.loadDebugEntry('[数据]服装风格指南', 'styleGuideStatus', 'styleGuideContent');
  }

  public setLastContext(context: any) {
    this.state.lastContext = context;
  }

  public setMainStoryStats(stats: {
    filesLoaded: number;
    totalEvents: number;
    actionableEvents: number;
    foreshadowedEvents: number;
  }) {
    this.state.mainStoryStats = stats;
  }

  private async loadDebugEntry(entryKey: string, statusKey: keyof DebugInfo, contentKey: keyof DebugInfo) {
    try {
      const content = await lorebookService.readFromLorebook(entryKey);
      if (content) {
        (this.state as any)[contentKey] = JSON.parse(this._cleanJsonString(content));
        (this.state as any)[statusKey] = '读取成功';
      } else {
        (this.state as any)[statusKey] = '读取失败：条目为空';
      }
    } catch (e) {
      (this.state as any)[statusKey] = `读取失败：${(e as Error).message}`;
    }
  }

  private _cleanJsonString(str: string): string {
    try {
      JSON.parse(str);
      return str;
    } catch (e) {
      const firstBrace = str.indexOf('{');
      const lastBrace = str.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return str.substring(firstBrace, lastBrace + 1);
      }
    }
    return str;
  }
}

export const debugService = new DebugService();
