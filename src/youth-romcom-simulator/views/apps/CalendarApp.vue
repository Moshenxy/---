<template>
  <div class="calendar-app">
    <div class="app-header">
      <button @click="prevMonth">&lt;</button>
      <h2>{{ currentMonthStr }}</h2>
      <button @click="nextMonth">&gt;</button>
    </div>
    <div class="calendar-grid">
      <div v-for="day in weekHeader" :key="day" class="day-header">{{ day }}</div>
      <div
        v-for="day in days"
        :key="day.date.toISOString()"
        class="day-cell"
        :class="{ 'is-today': day.isToday, 'is-other-month': !day.isCurrentMonth }"
        @click="actions.setSelectedDate(day.date)"
        @dblclick="openAddScheduleModal(day.date)"
      >
        <span class="day-number">{{ day.date.getDate() }}</span>
        <div class="events-container">
          <div
            v-for="event in day.events"
            :key="event.id"
            class="event-dot"
            :class="`event-type-${event.type}`"
            :title="event.name"
          ></div>
        </div>
      </div>
    </div>
    <div v-if="selectedEvents.length > 0" class="selected-day-details">
      <h4>{{ selectedDateFormatted }}</h4>
      <ul>
        <li v-for="event in selectedEvents" :key="event.id" :class="`event-type-${event.type}`" class="event-list-item">
          <div>
            <span class="list-dot"></span>
            <span>{{ event.name }}</span>
            <span v-if="event.time" class="event-time">{{ event.time }}</span>
          </div>
          <div v-if="event.type === 'personal'" class="event-actions">
            <button @click="selectedDate && openAddScheduleModal(selectedDate, event)" class="action-btn">✏️</button>
            <button @click="deleteSchedule(event.id)" class="action-btn">🗑️</button>
          </div>
        </li>
      </ul>
    </div>
  </div>
  <AddScheduleModal :show="isModalVisible" :schedule-to-edit="scheduleForModal" @close="isModalVisible = false" />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { get } from 'lodash';
import { store, getters, actions } from '../../store';
import { getUpcomingEvents } from '../../services/event-parser';
import AddScheduleModal from '../../components/modals/AddScheduleModal.vue';
import { calendarService, ScheduleItem } from '../../services/CalendarService';

interface CalendarDay {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  events: { id: string; name: string; type: 'world' | 'personal' | 'upcoming'; time?: string }[];
}

const weekHeader = ['日', '一', '二', '三', '四', '五', '六'];
const today = ref(new Date());
const currentDate = ref(new Date());
const selectedDate = computed(() => store.selectedDate);
const monthlyEvents = ref<{ [key: string]: any[] }>({});

const isModalVisible = ref(false);
const scheduleForModal = ref<ScheduleItem | null>(null);

const isReady = computed(() => {
  const time = getters.worldTime.value;
  return time && time.年 && time.月 && time.日;
});

async function loadEventsForMonth(year: number, month: number) {
  const personalAndWorldEvents = getters.monthlyCalendarEvents.value(year, month);
  const upcomingEvents = await getUpcomingEvents(year, month);
  const personalSchedules = calendarService.schedules;

  const allEvents: { [key: string]: any[] } = { ...personalAndWorldEvents };

  // Merge personal schedules
  personalSchedules.forEach(schedule => {
    const dateStr = schedule.日期;
    const scheduleDate = new Date(dateStr);
    // Fix timezone issue by comparing date parts
    if (scheduleDate.getMonth() === month && scheduleDate.getFullYear() === year) {
      if (!allEvents[dateStr]) allEvents[dateStr] = [];
      allEvents[dateStr].push({ ...schedule, name: schedule.标题, type: 'personal' });
    }
  });

  for (const dateStr in upcomingEvents) {
    if (!allEvents[dateStr]) {
      allEvents[dateStr] = [];
    }
    allEvents[dateStr].push(...upcomingEvents[dateStr]);
  }
  monthlyEvents.value = allEvents;
}

watch(
  currentDate,
  newDate => {
    if (isReady.value) {
      loadEventsForMonth(newDate.getFullYear(), newDate.getMonth());
    }
  },
  { immediate: true },
);

watch(
  isReady,
  ready => {
    if (ready) {
      const time = getters.worldTime.value;
      const newDate = new Date(time.年, time.月 - 1, time.日);
      today.value = newDate;
      currentDate.value = newDate;
      actions.setSelectedDate(newDate); // Set global selected date
      loadEventsForMonth(newDate.getFullYear(), newDate.getMonth());
    }
  },
  { immediate: true },
);

watch(
  () => calendarService.schedules,
  () => {
    loadEventsForMonth(currentDate.value.getFullYear(), currentDate.value.getMonth());
  },
  { deep: true },
);

const currentMonthStr = computed(() => {
  if (!isReady.value) return '加载中...';
  return `${currentDate.value.getFullYear()}年 ${currentDate.value.getMonth() + 1}月`;
});

const days = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();

  const calendarDays: CalendarDay[] = [];

  // Days from previous month
  for (let i = 0; i < startDayOfWeek; i++) {
    const date = new Date(firstDayOfMonth);
    date.setDate(date.getDate() - (startDayOfWeek - i));
    calendarDays.push({ date, isToday: false, isCurrentMonth: false, events: [] });
  }

  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const dateStr = date.toISOString().split('T')[0];
    calendarDays.push({
      date,
      isToday: date.toDateString() === today.value.toDateString(),
      isCurrentMonth: true,
      events: monthlyEvents.value[dateStr] || [],
    });
  }

  // Days from next month
  const remainingCells = 42 - calendarDays.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingCells; i++) {
    const date = new Date(lastDayOfMonth);
    date.setDate(date.getDate() + i);
    calendarDays.push({ date, isToday: false, isCurrentMonth: false, events: [] });
  }

  return calendarDays;
});

const selectedDateFormatted = computed(() => {
  if (!selectedDate.value) return '';
  return selectedDate.value.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
});

const selectedEvents = computed(() => {
  if (!selectedDate.value) return [];
  const dateStr = selectedDate.value.toISOString().split('T')[0];
  return monthlyEvents.value[dateStr] || [];
});

const prevMonth = () => {
  currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() - 1));
};

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() + 1));
};

const openAddScheduleModal = (date?: Date, schedule?: ScheduleItem) => {
  const targetDate = date || new Date();
  if (schedule) {
    scheduleForModal.value = { ...schedule };
  } else {
    scheduleForModal.value = {
      ID: '', // ID will be generated by the service
      标题: '',
      日期: targetDate.toISOString().split('T')[0],
      时间: new Date().toTimeString().slice(0, 5),
      地点ID: '',
      参与者: [],
      类型: '个人',
      描述: '',
    };
  }
  isModalVisible.value = true;
};

const deleteSchedule = async (id: string) => {
  if (confirm('确定要删除这个日程吗？')) {
    await calendarService.deleteSchedule(id);
    // The UI will update via the watcher
  }
};
</script>

<style lang="scss" scoped>
.calendar-app {
  padding: 10px;
  background: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  h2 {
    margin: 0;
    font-size: 18px;
  }
  .nav-btn,
  .add-btn {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 4px 10px;
    cursor: pointer;
    &:hover {
      background: #e5e7eb;
    }
  }
  .add-btn {
    font-size: 18px;
    font-weight: bold;
    padding: 2px 10px;
  }
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  flex-grow: 1;
}
.day-header {
  text-align: center;
  font-weight: 600;
  font-size: 12px;
  padding: 5px 0;
  color: #6b7280;
}
.day-cell {
  border: 1px solid #f3f4f6;
  border-radius: 4px;
  padding: 4px;
  min-height: 60px;
  transition: background-color 0.2s;
  cursor: pointer;
  &.is-other-month {
    color: #d1d5db;
    background-color: #f9fafb;
  }
  &.is-today .day-number {
    background-color: #0d6efd;
    color: white;
    border-radius: 50%;
  }
  &:hover {
    background-color: #eff6ff;
  }
}
.day-number {
  font-size: 12px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.events-container {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: 4px;
}
.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  &.event-type-world {
    background-color: #ef4444; // Red for world events
  }
  &.event-type-personal {
    background-color: #3b82f6; // Blue for personal events
  }
  &.event-type-upcoming {
    background-color: #f59e0b; // Amber for upcoming events
  }
}
.selected-day-details {
  padding: 10px;
  border-top: 1px solid #e5e7eb;
  margin-top: 10px;
  h4 {
    margin: 0 0 8px 0;
  }
  ul {
    margin: 0;
    padding-left: 0;
    font-size: 14px;
    list-style-type: none;
    .event-list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      .list-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 8px;
        display: inline-block;
      }
      .event-time {
        font-size: 0.8em;
        color: #6b7280;
        margin-left: 8px;
      }
      .event-actions {
        display: flex;
        gap: 4px;
        .action-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px 4px;
          font-size: 12px;
        }
      }
      &.event-type-world .list-dot {
        background-color: #ef4444;
      }
      &.event-type-personal .list-dot {
        background-color: #3b82f6;
      }
      &.event-type-upcoming .list-dot {
        background-color: #f59e0b;
      }
    }
  }
}
.loading-pane {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 16px;
  color: #6b7280;
}
</style>
