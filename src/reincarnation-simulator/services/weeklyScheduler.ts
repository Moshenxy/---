import { get } from 'lodash';
import { watch } from 'vue';
import { getters } from '../store';
import { readFromLorebook, writeToLorebook } from './lorebook';
import { scheduleService } from './schedule';

const LOREBOOK_COMMENT = '课程表-主';

class WeeklyScheduler {
  constructor() {
    this.initialize();
  }

  private initialize() {
    console.log('[WeeklyScheduler] Initializing...');
    watch(
      () => getters.worldTime.value,
      (newTime, oldTime) => {
        const newDay = newTime?.星期;
        const oldDay = oldTime?.星期;

        if (newDay && newDay !== oldDay && newDay === '周日') {
          this.handleSunday();
        }
      },
      { deep: true },
    );
  }

  private async handleSunday() {
    console.log('[WeeklyScheduler] It is Sunday. Checking if a new schedule is needed.');
    const scheduleContent = await readFromLorebook(LOREBOOK_COMMENT);
    const cleanContent = scheduleContent?.replace(/#.*$/gm, '').trim() || '';

    // If the schedule is empty, generate a new one.
    toastr.info('周日，开始更新新一周的课程表...', '排课系统');
    await this.forceScheduleUpdate();
  }

  public async forceScheduleUpdate() {
    toastr.info('正在为您生成新的课程表...', '手动排课');
    try {
      const playerClass = get(getters.character.value, '班级[0]');
      if (!playerClass) {
        toastr.error('无法获取您的班级信息，无法排课。');
        return;
      }

      const coursePoolContent = await readFromLorebook('课程池-主');
      if (!coursePoolContent) {
        toastr.error('无法读取课程池，无法排课。');
        return;
      }

      const coursePool = coursePoolContent
        .split('\n')
        .filter(line => !line.startsWith('#') && line.trim() !== '')
        .map(line => {
          const [classId, courseName, teacher, classroomId, courseType] = line.split('|');
          return { 班级ID: classId, 课程名称: courseName, 教师: teacher, 教室ID: classroomId, 课程类型: courseType };
        });

      const playerGradePrefix = playerClass.substring(0, 2); // 获取年级前缀，如 "1年", "2年"

      // 筛选出所有与该年级相关的课程（年级专属课 + 通用课）
      const relevantCourses = coursePool.filter(c =>
          c.班级ID.startsWith(playerGradePrefix) || c.班级ID === '通用'
      );

      // 从相关课程中再细分出必修和选修
      const requiredCourses = relevantCourses.filter(c => c.课程类型 === '必修');
      const electiveCourses = relevantCourses.filter(c => c.课程类型 === '选修');

      if (requiredCourses.length === 0) {
        toastr.error(`课程池中没有找到 ${playerGradePrefix} 的必修课。`);
        return;
      }
      if (electiveCourses.length === 0) {
        toastr.error('课程池中没有找到通用的选修课。');
        return;
      }

      const weekDays = ['周一', '周二', '周三', '周四', '周五'];
      const timeSlots: number[][] = [
        [1, 2],
        [3, 4],
        [5, 6],
        [7, 8],
      ];
      const totalSlots = weekDays.flatMap(day => timeSlots.map(slot => ({ day, slot })));

      // Fisher-Yates shuffle
      for (let i = totalSlots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [totalSlots[i], totalSlots[j]] = [totalSlots[j], totalSlots[i]];
      }

      const newSchedule: any[] = [];
      const courseCounts: { [key: string]: number } = {};

      // 安排14节必修课
      for (let i = 0; i < 14; i++) {
        if (totalSlots.length === 0) break;
        const slot = totalSlots.pop()!;

        let course;
        let attempts = 0;
        do {
          course = requiredCourses[Math.floor(Math.random() * requiredCourses.length)];
          attempts++;
        } while ((courseCounts[course.课程名称] || 0) >= 3 && attempts < 50);

        courseCounts[course.课程名称] = (courseCounts[course.课程名称] || 0) + 1;
        newSchedule.push({ ...course, 上课日: slot.day, 节次: slot.slot });
      }

      // 安排4节选修课
      for (let i = 0; i < 4; i++) {
        if (totalSlots.length === 0) break;
        const slot = totalSlots.pop()!;

        let course;
        let attempts = 0;
        do {
          course = electiveCourses[Math.floor(Math.random() * electiveCourses.length)];
          attempts++;
        } while ((courseCounts[course.课程名称] || 0) >= 3 && attempts < 50);

        courseCounts[course.课程名称] = (courseCounts[course.课程名称] || 0) + 1;
        newSchedule.push({ ...course, 上课日: slot.day, 节次: slot.slot });
      }

      const scheduleText =
        `# ${playerClass} - 本周课程表\n# 自动生成于: ${new Date().toISOString()}\n# 格式: 班级ID|课程名称|教师|上课日|节次(数组)|教室ID\n` +
        newSchedule
          .map(c => `${playerClass}|${c.课程名称}|${c.教师}|${c.上课日}|[${c.节次.join(',')}]|${c.教室ID}`)
          .join('\n');

      await writeToLorebook(LOREBOOK_COMMENT, scheduleText);
      toastr.success('新课程表已生成！界面将自动刷新。', '排课成功');

      // 强制刷新服务和UI
      await scheduleService.loadSchedule(); // 重新加载scheduleService的数据
      // 可以在这里发出一个事件，让UI组件知道刷新
      document.dispatchEvent(new CustomEvent('schedule-updated'));
    } catch (error) {
      console.error('Failed to force schedule update:', error);
      toastr.error('生成课程表时发生错误，详情请查看控制台。');
    }
  }
}

export const weeklyScheduler = new WeeklyScheduler();
