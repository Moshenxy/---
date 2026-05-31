<template>
  <div class="schedule-view">
    <div v-if="isSchedulePaused" class="event-notice">
      <h3>{{ pausedEventName }}</h3>
      <p>事件进行中，课程已暂停。</p>
    </div>
    <div v-else>
        <!-- Debug Info -->
        <div class="debug-info">
          <p>
            Player Class: <code>{{ playerClass }}</code>
          </p>
          <p>
            Total Courses Parsed: <code>{{ totalCoursesParsed }}</code>
          </p>
          <p>
            Filtered Courses: <code>{{ courses.length }}</code>
          </p>
        </div>
        <div class="timeline-grid">
      <div class="time-axis">
        <div v-for="time in timeSlots" :key="time" class="time-slot">{{ time }}</div>
      </div>
      <div class="schedule-lanes">
        <div v-for="day in weekDays" :key="day" class="day-lane" :class="{ today: day === today }">
          <div class="day-header">{{ day }}</div>
          <div class="courses-container">
            <div
              v-for="course in getCoursesForDay(day)"
              :key="course.id"
              class="course-item"
              :style="getCourseStyle(course)"
            >
              <p class="course-name">{{ course.课程名称 }}</p>
              <p class="course-details">@ {{ course.教室ID }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { get } from 'lodash';
import { computed, onMounted, ref } from 'vue';
import { getters } from '../../../store';
import { scheduleService, Course } from '../../../services/schedule';
import { EventEffect } from '../../../types/character';

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
const slotHeight = 60; // in px

const allCourses = ref<Course[]>([]);

onMounted(async () => {
  allCourses.value = await scheduleService.getAllCourses();
});

const today = computed(() => get(getters.worldTime.value, '星期', ''));

const currentEvent = computed(() => getters.currentEvent.value);

const isSchedulePaused = computed(() => {
  return currentEvent.value?.效果?.some((e: EventEffect) => e.类型 === '暂停课程' && e.状态 === '激活');
});

const pausedEventName = computed(() => {
  return currentEvent.value?.名称 || '特别事件';
});

const playerClass = computed(() => {
  const classInfo = getters.character.value?.['班级'];
  if (Array.isArray(classInfo)) {
    return classInfo[0];
  }
  return classInfo || '';
});

const totalCoursesParsed = computed(() => allCourses.value.length);

const courses = computed(() => {
  if (!playerClass.value) return [];
  return allCourses.value.filter(course =>
    course && playerClass.value.startsWith(course.班级ID)
  );
});

const getCoursesForDay = (day: string) => {
  return courses.value.filter((c: any) => c.上课日 === day);
};

const getCourseStyle = (course: any) => {
  // 节次到时间槽的映射
  const sectionToSlot = [0, 0, 1, 2, 3, 5, 6, 7, 8]; // 节次1-4对应0-3，5-8对应5-8

  const startSection = Math.min(...course.节次);
  const endSection = Math.max(...course.节次);

  const startSlot = sectionToSlot[startSection] || 0;
  const endSlot = sectionToSlot[endSection] || startSlot;

  const top = startSlot * slotHeight;
  const height = (endSlot - startSlot + 1) * slotHeight - 4; // -4 for gap

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'];
  const colorIndex =
    Math.abs(course.课程名称.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) %
    colors.length;

  return {
    top: `${top}px`,
    height: `${height}px`,
    backgroundColor: colors[colorIndex],
  };
};
</script>

<style lang="scss" scoped>
.debug-info {
  background: #fffbe6;
  border: 1px solid #fde68a;
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 8px;
  font-size: 12px;
  color: #92400e;
  p {
    margin: 4px 0;
  }
  code {
    background: #fef3c7;
    padding: 2px 4px;
    border-radius: 4px;
  }
}
.schedule-view {
  overflow-x: auto;
}

.timeline-grid {
  display: flex;
  min-width: 800px;
}

.time-axis {
  flex-shrink: 0;
  padding-top: 40px; /* To align with day headers */
  .time-slot {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #6b7280;
  }
}

.schedule-lanes {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex-grow: 1;
}

.day-lane {
  border-left: 1px solid #e5e7eb;
  position: relative;

  &.today {
    background-color: rgba(13, 110, 253, 0.05);
  }
}

.day-header {
  text-align: center;
  padding: 10px 0;
  font-weight: 500;
  position: sticky;
  top: 0;
  background: #f8f9fa;
  z-index: 10;
}

.courses-container {
  position: relative;
  height: 540px; // 9 slots * 60px
}

.event-notice {
  padding: 40px 20px;
  text-align: center;
  background-color: #fffbe6;
  border: 1px solid #fde68a;
  border-radius: 12px;
  color: #92400e;

  h3 {
    margin: 0 0 10px 0;
    font-size: 18px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.course-item {
  position: absolute;
  left: 4px;
  right: 4px;
  border-radius: 8px;
  padding: 8px;
  color: white;
  overflow: hidden;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .course-name {
    font-weight: 600;
    font-size: 14px;
    margin: 0 0 4px 0;
  }
  .course-details {
    font-size: 12px;
    opacity: 0.9;
    margin: 0;
  }
}
</style>
