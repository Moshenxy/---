/**
 * Represents a course as defined in the course pool.
 */
export interface CourseInfo {
  班级ID: string;
  课程名称: string;
  教师: string;
  教室ID: string;
  课程类型: '必修' | '选修';
}

/**
 * Represents a course that has been scheduled for a specific time slot.
 */
export interface ScheduledCourse {
  id: string;
  课程名称: string;
  教师: string;
  教室ID: string;
  上课日: string;
  节次: number[];
}

/**
 * Parses the course pool text from the lorebook.
 * @param text The raw text content of the course pool.
 * @returns An array of parsed course information.
 */
export function parseCoursePool(text: string | null): CourseInfo[] {
  if (!text) return [];
  return text
    .split('\n')
    .filter(line => !line.startsWith('#') && line.trim() !== '')
    .map(line => {
      const [classId, courseName, teacher, classroomId, courseType] = line.split('|');
      return { 班级ID: classId, 课程名称: courseName, 教师: teacher, 教室ID: classroomId, 课程类型: courseType as any };
    });
}

/**
 * Formats a schedule object into a string for saving to the lorebook.
 * @param schedule The array of scheduled courses.
 * @param playerClass The class ID of the player.
 * @returns A formatted string representing the schedule.
 */
export function formatScheduleToText(schedule: ScheduledCourse[], playerClass: string): string {
  const header = `# ${playerClass} - 本周课程表\n# 自动生成于: ${new Date().toISOString()}\n# 格式: 班级ID|课程名称|教师|上课日|节次(数组)|教室ID\n`;
  const body = schedule
    .map(course => {
      // 确保节次是标准的JSON数组格式字符串
      return `${playerClass}|${course.课程名称}|${course.教师}|${course.上课日}|[${course.节次.join(',')}]|${course.教室ID}`;
    })
    .join('\n');
  return header + '\n' + body;
}
