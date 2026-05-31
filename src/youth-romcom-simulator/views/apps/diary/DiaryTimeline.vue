<template>
  <div class="diary-timeline">
    <div class="timeline-entry" v-for="entry in entries" :key="entry.id">
      <div class="timeline-date">{{ entry.date }}</div>
      <div class="timeline-content">{{ entry.content }}</div>
    </div>
    <div v-if="!entries.length" class="timeline-empty">
      <p>日记还是空的，快去创造一些回忆吧。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, PropType } from 'vue';

interface DiaryEntry {
  id: number;
  date: string;
  content: string;
}

defineProps({
  entries: {
    type: Array as PropType<DiaryEntry[]>,
    default: () => [],
  },
});
</script>

<style lang="scss" scoped>
.diary-timeline {
  .timeline-entry {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px dashed #ccc;
  }

  .timeline-date {
    font-weight: bold;
    color: #0d6efd;
    margin-bottom: 0.5rem;
  }

  .timeline-content {
    line-height: 1.6;
    color: #555;
  }

  .timeline-empty {
    text-align: center;
    color: #999;
    padding: 2rem;
  }
}
</style>
