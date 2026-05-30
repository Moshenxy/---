import { lorebookService } from './LorebookService';

export interface Course {
  id: string;
  班级ID: string;
  课程名称: string;
  教师: string;
  上课日: string;
  节次: number[];
  教室ID: string;
}

class ScheduleService {
  private static instance: ScheduleService;
  private schedule: Course[] = [];
  private loadingPromise: Promise<void>;

  private constructor() {
    this.loadingPromise = this.loadSchedule();
  }

  public static getInstance(): ScheduleService {
    if (!ScheduleService.instance) {
      ScheduleService.instance = new ScheduleService();
    }
    return ScheduleService.instance;
  }

  public async loadSchedule() {
    try {
      const scheduleContent = (await lorebookService.readFromLorebook('课程表-主')) ?? '';
      const coursePoolContent = (await lorebookService.readFromLorebook('课程池-主')) ?? '';
      this.schedule = this.parseSchedule(scheduleContent, coursePoolContent);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    }
  }

  private parseSchedule(scheduleContent: string, coursePoolContent: string): Course[] {
    const allCourses: Course[] = [];
    if (scheduleContent) {
      const lines = scheduleContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      for (const [index, line] of lines.entries()) {
        const [班级ID, 课程名称, 教师, 上课日, 节次Str, 教室ID] = line.split('|');
        if (班级ID && 课程名称 && 教师 && 上课日 && 节次Str && 教室ID) {
          let 节次: number[] = [];
          try {
            节次 = JSON.parse(节次Str);
          } catch (e) {
            节次 = 节次Str
              .replace(/[[\]]/g, '')
              .split(',')
              .map(Number)
              .filter(n => !isNaN(n));
          }
          allCourses.push({ id: `${上课日}-${课程名称}-${index}`, 班级ID, 课程名称, 教师, 上课日, 节次, 教室ID });
        }
      }
    }
    if (coursePoolContent) {
      const lines = coursePoolContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      for (const line of lines) {
        const [班级ID, 课程名称, 教师, 教室ID, 类型] = line.split('|');
        if (班级ID && 课程名称 && 教师 && 教室ID && 类型) {
          // This is a simplified logic. A more complex one would be needed to generate a full schedule.
          // For now, we just add them to the pool.
        }
      }
    }
    return allCourses;
  }

  public async getCourseForNpc(npcClass: string, worldTime: any): Promise<Course | undefined> {
    await this.loadingPromise;
    return this.schedule.find(
      course =>
        course.班级ID === npcClass &&
        course.上课日 === worldTime.星期 &&
        this.isTimeInCourse(worldTime.时, worldTime.分, course.节次),
    );
  }

  public async getAllCourses(): Promise<Course[]> {
    await this.loadingPromise;
    return this.schedule;
  }

  private isTimeInCourse(hour: number, minute: number, sections: number[]): boolean {
    const currentTime = hour * 60 + minute;
    for (const section of sections) {
      // Based on the AI thought chain
      if ((section === 1 || section === 2) && currentTime >= 8 * 60 && currentTime < 9 * 60 + 30) return true;
      if ((section === 3 || section === 4) && currentTime >= 10 * 60 && currentTime < 11 * 60 + 30) return true;
      if ((section === 5 || section === 6) && currentTime >= 13 * 60 && currentTime < 14 * 60 + 30) return true;
      if ((section === 7 || section === 8) && currentTime >= 15 * 60 && currentTime < 16 * 60 + 30) return true;
    }
    return false;
  }
}

export const scheduleService = ScheduleService.getInstance();
