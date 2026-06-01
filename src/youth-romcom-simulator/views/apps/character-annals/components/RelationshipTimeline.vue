<template>
  <div class="relationship-timeline-panel" :class="{ visible: visible }">
    <div class="timeline-header">
      <h4>关系时间轴: {{ characterName }}</h4>
      <button @click="emit('close')" class="close-btn">×</button>
    </div>
    <div class="timeline-content">
      <div v-if="events.length === 0" class="no-events">
        <p>暂无重要关系事件</p>
      </div>
      <ul v-else class="timeline-list">
        <li v-for="(event, index) in sortedEvents" :key="index" class="timeline-item" @mouseover="emit('event-hover', event)" @mouseleave="emit('event-hover', null)">
          <div class="timeline-marker" :style="{ backgroundColor: getMarkerColor(event) }"></div>
          <div class="timeline-event-card">
            <p class="event-description">{{ event }}</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{
  visible: boolean;
  events: string[];
  characterName: string;
}>();

const emit = defineEmits(['close', 'event-hover']);

const sortedEvents = computed(() => {
  // Filter out placeholder values before sorting
  return props.events.filter(event => event && !event.startsWith('$__META_EXTENSIBLE__$')).reverse();
});

function getMarkerColor(event: string) {
    if (event.includes('提升') || event.includes('好感')) return '#28a745';
    if (event.includes('下降') || event.includes('误会')) return '#dc3545';
    return '#6c757d';
}

</script>

<style lang="scss" scoped>
.relationship-timeline-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  border-top: 1px solid #dee2e6;
  border-radius: 12px 12px 0 0;
  transform: translateY(100%);
  transition: transform 0.3s ease-in-out;
  z-index: 10;
  max-height: 40%;
  display: flex;
  flex-direction: column;

  &.visible {
    transform: translateY(0);
  }
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #e9ecef;

  h4 {
    margin: 0;
    font-size: 1rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6c757d;
  }
}

.timeline-content {
  overflow-y: auto;
  padding: 16px;
}

.timeline-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 7px;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: #e9ecef;
  }
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  position: relative;
}

.timeline-marker {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid #fff;
  background-color: #6c757d;
  flex-shrink: 0;
  margin-right: 16px;
  z-index: 1;
}

.timeline-event-card {
  background-color: #fff;
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  flex-grow: 1;

  .event-date {
    font-size: 0.8rem;
    color: #6c757d;
    margin: 0 0 4px 0;
    font-weight: 500;
  }

  .event-description {
    font-size: 0.9rem;
    margin: 0;
  }
}

.no-events {
    text-align: center;
    color: #6c757d;
    padding: 20px;
}
</style>
