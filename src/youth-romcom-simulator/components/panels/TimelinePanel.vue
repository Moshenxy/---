<template>
  <div class="timeline-panel">
    <div class="calendar-header">
      <button @click="prevMonth"><</button>
      <h2 class="panel-title">{{ currentYear }}年 {{ currentMonth + 1 }}月</h2>
      <button @click="nextMonth">></button>
    </div>
    <div v-if="storylines.length > 0" class="calendar-grid">
      <div v-for="dayName in weekDays" :key="dayName" class="day-header">{{ dayName }}</div>
      <div
        v-for="day in calendarDays"
        :key="day.date"
        class="day-cell"
        :class="{ 'other-month': !day.isCurrentMonth, selected: selectedDay?.date === day.date }"
        @click="selectDay(day)"
      >
        <div class="day-number">{{ day.day }}</div>
        <div class="events-container">
          <div v-if="day.events.length > 0" class="event-marker"></div>
          <div v-if="day.fixedEvents" class="event-marker festival-marker"></div>
        </div>
      </div>
    </div>
    <div class="details-drawer" :class="{ 'is-open': isDrawerOpen }">
      <div class="drawer-handle" @click="toggleDrawer"></div>
      <div class="details-content">
        <div v-if="selectedDay && (selectedDay.events.length > 0 || selectedDay.fixedEvents)" class="day-details">
          <div v-if="selectedDay.fixedEvents" class="detail-section">
            <h4>本日节日</h4>
            <p v-for="(event, index) in selectedDay.fixedEvents" :key="`fixed-${index}`">{{ event }}</p>
          </div>
          <div v-if="selectedDay.events.length > 0" class="detail-section">
            <h4>本日主线</h4>
            <p class="stage-summary">{{ selectedDay.events[0].阶段摘要 || selectedDay.events[0].summary || '无摘要' }}</p>
            <StorylineStageDetail :stage="selectedDay.events[0]" />
          </div>
        </div>
        <div v-else class="no-selection-message">
          <p>点击包含事件的日期查看详情</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import { detailModalService } from '../../services/DetailModalService';
import { DisplayStoryStage, storylineService } from '../../services/StorylineService';
import { store } from '../../store';
import StorylineStageDetail from '../modals/StorylineStageDetail.vue';

interface CalendarDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  events: DisplayStoryStage[];
  fixedEvents?: string[];
}

export default defineComponent({
  name: 'TimelinePanel',
  components: { StorylineStageDetail },
  setup() {
    const storylines = ref<DisplayStoryStage[]>([]);
    const fixedEvents = ref<Record<string, string[]>>({});
    const currentDate = ref(new Date());
    const selectedDay = ref<CalendarDay | null>(null);
    const isDrawerOpen = ref(false);

    const currentYear = computed(() => currentDate.value.getFullYear());
    const currentMonth = computed(() => currentDate.value.getMonth());

    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    const calendarDays = computed((): CalendarDay[] => {
      const days: CalendarDay[] = [];
      const year = currentYear.value;
      const month = currentMonth.value;

      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);

      const startDayOfWeek = firstDayOfMonth.getDay();
      const daysInMonth = lastDayOfMonth.getDate();

      // a. Fill previous month's days
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const date = new Date(year, month - 1, day);
        days.push({
          date: date.toLocaleDateString('sv'), // Use 'sv' locale for YYYY-MM-DD format
          day,
          isCurrentMonth: false,
          events: [],
        });
      }

      // b. Fill current month's days
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = date.toLocaleDateString('sv');
        const dayEvents = storylines.value.filter(stage => stage.trigger_time?.date === dateString);
        const monthDayKey = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        days.push({
          date: dateString,
          day,
          isCurrentMonth: true,
          events: dayEvents,
          fixedEvents: fixedEvents.value[monthDayKey],
        });
      }

      // c. Fill next month's days
      const lastDayOfWeek = lastDayOfMonth.getDay();
      const remainingDays = 6 - lastDayOfWeek;
      for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i);
        days.push({
          date: date.toLocaleDateString('sv'),
          day: i,
          isCurrentMonth: false,
          events: [],
        });
      }

      return days;
    });

    const prevMonth = () => {
      currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() - 1));
    };

    const nextMonth = () => {
      currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() + 1));
    };

    const refresh = async () => {
      if (store.worldState) {
        const fetchedStorylines = await storylineService.getAllTimelineStages(store.worldState);
        storylines.value = fetchedStorylines;

        fixedEvents.value = await storylineService.getFixedEvents();

        const upcomingEvents = fetchedStorylines.filter(e => e.status === 'future' || e.status === 'current');
        if (
          upcomingEvents.length > 0 &&
          upcomingEvents[0].trigger_time?.date &&
          upcomingEvents[0].trigger_time.date !== 'N/A'
        ) {
          const firstEventDate = new Date(upcomingEvents[0].trigger_time.date.replace(/-/g, '/'));
          currentDate.value = new Date(firstEventDate.getFullYear(), firstEventDate.getMonth(), 1);
        } else if (store.worldState.世界状态.时间.日期) {
          const [year, month, day] = store.worldState.世界状态.时间.日期.split('-').map(Number);
          currentDate.value = new Date(year, month - 1, day);
        }
        console.log('TimelinePanel refreshed:', storylines.value);
      }
    };


    const selectDay = (day: CalendarDay) => {
      selectedDay.value = day;
      if (day.events.length > 0 || day.fixedEvents) {
        isDrawerOpen.value = true;
      }
    };
    
    const toggleDrawer = () => {
      isDrawerOpen.value = !isDrawerOpen.value;
    };

    onMounted(refresh);

    watch(
      () => store.worldState?.叙事记录?.历史事件,
      (newHistory, oldHistory) => {
        if (newHistory && oldHistory && newHistory.length !== oldHistory.length) {
          console.log('History changed, refreshing timeline...');
          refresh();
        }
      },
      { deep: true },
    );

    watch(
      () => store.worldState,
      newState => {
        if (newState) {
          console.log('worldState became available, refreshing timeline...');
          refresh();
        }
      },
    );

    return {
      storylines,
      refresh,
      currentYear,
      currentMonth,
      calendarDays,
      weekDays,
      prevMonth,
      nextMonth,
      selectedDay,
      selectDay,
      isDrawerOpen,
      toggleDrawer,
    };
  },
});
</script>

<style lang="scss">
@use '../../styles/theme/variables.scss' as *;
@use '../../styles/theme/mixins' as *;

.timeline-panel {
  color: $color-white-moon;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-lg;

    .panel-title {
      font-family: $font-family-title;
      font-size: $font-size-h2;
      color: $color-gold-pale;
      margin: 0;
    }

    button {
      background: transparent;
      border: 1px solid $color-gold-pale;
      color: $color-gold-pale;
      cursor: pointer;
    }
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    
    .day-header {
      text-align: center;
      font-weight: bold;
      color: $color-grey-stone;
      padding-bottom: $spacing-sm;
    }

    .day-cell {
      border: 1px solid rgba($color-gold-liu, 0.2);
      padding: $spacing-xs;
      display: flex;
      flex-direction: column;
      min-height: 50px; /* Reduced height */
      cursor: pointer;
      transition: background-color 0.2s;
      
      &:hover {
        background-color: rgba($color-gold-pale, 0.05);
      }
      
      &.selected {
        background-color: rgba($color-gold-pale, 0.1);
        border-color: $color-gold-pale;
      }

      &.other-month {
        .day-number {
          color: $color-grey-stone;
          opacity: 0.5;
        }
      }
    }

    .day-number {
      font-weight: bold;
      margin-bottom: $spacing-sm;
    }

    .events-container {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 4px;
    }

    .event-marker {
      background-color: $color-gold-liu;
      border-radius: 50%;
      width: 8px;
      height: 8px;
    }
    .festival-marker {
      background-color: $color-cyan-tian;
    }
  }
   
  .details-drawer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: auto;
    top: calc(100% - 40px); /* Initially just the handle is visible */
    background-color: #101828;
    border-top: 1px solid $color-gold-liu;
    transition: top 0.4s ease-in-out;
    display: flex;
    flex-direction: column;

    &.is-open {
      top: 120px; /* Adjust this value to align below the weekday header */
    }
  }
  
  .drawer-handle {
    flex-shrink: 0;
    height: 40px;
    cursor: pointer;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 4px;
      background-color: rgba($color-gold-liu, 0.7);
      border-radius: 2px;
    }
  }

  .details-content {
    flex-grow: 1;
    overflow-y: auto;
    padding: 0 $spacing-md $spacing-md;
    @include custom-scrollbar;
  }
   
  .no-selection-message {
    text-align: center;
    color: $color-grey-stone;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .day-details {
    .detail-section {
      margin-bottom: $spacing-lg;
      h4 {
        font-family: $font-family-title;
        font-size: $font-size-h3;
        color: $color-gold-pale;
        margin-bottom: $spacing-md;
      }
      p {
        color: $color-white-moon;
        line-height: 1.6;
      }
      .stage-summary {
        font-style: italic;
        color: $color-grey-stone;
        margin-bottom: $spacing-md;
      }
    }
  }
}
</style>
