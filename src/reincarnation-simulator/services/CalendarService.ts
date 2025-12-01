import { reactive } from 'vue';
import { getCharacterById, safeGetValue } from '../utils/character-utils';
import { store } from '../store';

export interface ScheduleItem {
  ID: string;
  标题: string;
  日期: string; // YYYY-MM-DD
  时间: string; // HH:mm
  地点ID: string;
  参与者: string[];
  类型: '个人' | '社交' | '学业' | '社团';
  描述: string;
}

class CalendarService {
  public schedules = reactive<ScheduleItem[]>([]);

  constructor() {
    this.initialize();
  }

  private initialize() {
    this.loadSchedules();
    eventOn('core:storage-update', () => this.loadSchedules());
  }

  public loadSchedules() {
    const user = getCharacterById(store.worldState, store.userId);
    if (user) {
      const scheduleData = safeGetValue(user, '日程', [], false);
      const validSchedules = Array.isArray(scheduleData)
        ? scheduleData.flat().filter((s: any) => s && s.ID)
        : [];
      this.schedules.splice(0, this.schedules.length, ...validSchedules);
    }
  }

  private cacheCommand(action: '添加' | '更新' | '删除', item: Partial<ScheduleItem>) {
    let command = `日程${action}: `;
    if (item.标题) command += `标题为“${item.标题}”`;
    if (item.日期) command += `，日期在${item.日期}`;
    if (item.时间) command += `，时间是${item.时间}`;
    if (item.地点ID) command += `，地点在${item.地点ID}`;
    if (item.类型) command += `，类型为“${item.类型}”`;
    if (item.描述) command += `，描述为“${item.描述}”`;
    if (item.ID && action !== '添加') command += ` (ID: ${item.ID})`;
    command += '。';
    
    store.commandCache.push(command);
    console.log(`[CalendarService] Command cached: ${command}`);
  }

  public async addSchedule(item: Omit<ScheduleItem, 'ID'>) {
    this.cacheCommand('添加', item);
  }

  public async updateSchedule(item: ScheduleItem) {
    this.cacheCommand('更新', item);
  }

  public async deleteSchedule(id: string) {
    this.cacheCommand('删除', { ID: id });
  }
}

export const calendarService = new CalendarService();