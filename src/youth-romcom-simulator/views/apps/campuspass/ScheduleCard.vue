<template>
  <div class="schedule-card" :style="cardStyle">
    <div class="course-time">
      <span>{{ startTime }}</span>
      <span>{{ endTime }}</span>
    </div>
    <div class="course-info">
      <h3 class="course-name">{{ course.课程名称 }}</h3>
      <p class="course-teacher">
        <i class="fas fa-user-tie"></i> {{ course.教师 }}
      </p>
      <p class="course-location">
        <i class="fas fa-map-marker-alt"></i> {{ course.教室ID }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  course: {
    type: Object,
    required: true,
  },
});

// 节次到具体时间的映射
const sectionTimeMap: { [key: number]: string } = {
  1: '08:00',
  2: '09:00',
  3: '10:00',
  4: '11:00',
  5: '13:00', // Assuming lunch break
  6: '14:00',
  7: '15:00',
  8: '16:00',
};

const getEndTime = (startTime: string) => {
  const [hour, minute] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setMinutes(date.getMinutes() + 50); // Assuming 50-minute class
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const startTime = computed(() => {
  const firstSection = Math.min(...props.course.节次);
  return sectionTimeMap[firstSection] || '未知';
});

const endTime = computed(() => {
  const lastSection = Math.max(...props.course.节次);
  const lastSectionStartTime = sectionTimeMap[lastSection] || '未知';
  if (lastSectionStartTime === '未知') return '未知';
  return getEndTime(lastSectionStartTime);
});

const cardStyle = computed(() => {
  const colors = [
    { bg: '#eef2ff', border: '#4f46e5' }, // Indigo
    { bg: '#f0fdf4', border: '#16a34a' }, // Green
    { bg: '#fffbeb', border: '#f59e0b' }, // Amber
    { bg: '#fee2e2', border: '#ef4444' }, // Red
    { bg: '#f5f3ff', border: '#7c3aed' }, // Violet
    { bg: '#fdf2f8', border: '#db2777' }, // Pink
    { bg: '#fff7ed', border: '#f97316' }, // Orange
    { bg: '#ecfdf5', border: '#10b981' }, // Emerald
  ];
  const colorIndex =
    Math.abs(props.course.课程名称.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) %
    colors.length;

  return {
    '--card-bg-color': colors[colorIndex].bg,
    '--card-border-color': colors[colorIndex].border,
  };
});
</script>

<style lang="scss" scoped>
.schedule-card {
  display: flex;
  background-color: var(--card-bg-color);
  border-left: 5px solid var(--card-border-color);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  }
}

.course-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-right: 12px;
  margin-right: 12px;
  border-right: 1px solid #e5e7eb;
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
  min-width: 50px;

  span:first-child {
    margin-bottom: 4px;
  }
}

.course-info {
  flex-grow: 1;
}

.course-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.course-teacher,
.course-location {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  display: flex;
  align-items: center;

  i {
    margin-right: 6px;
    width: 12px;
    text-align: center;
  }
}

.course-teacher {
  margin-bottom: 4px;
}
</style>