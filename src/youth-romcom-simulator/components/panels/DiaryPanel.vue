<template>
  <div class="diary-app-container">
    <transition name="slide-fade">
      <div v-if="isNavOpen" class="side-nav-overlay" @click="emit('close-diary-nav')"></div>
    </transition>
    <transition name="slide">
      <div v-if="isNavOpen" class="side-nav">
        <h3>日记列表</h3>
        <ul>
          <li
            v-for="entry in diaryList"
            :key="entry.日期"
            :class="{ active: selectedDiary && selectedDiary.日期 === entry.日期 }"
            @click="selectDiary(entry)"
          >
            {{ entry.日期 }} - {{ entry.标题 }}
          </li>
        </ul>
      </div>
    </transition>
    <div class="app-content">
      <div v-if="selectedDiary">
        <div class="diary-header">
          <div class="date-weather">
            <span>{{ selectedDiary.日期 }}</span>
            <span>天气: {{ selectedDiary.天气 }}</span>
          </div>
          <h1 class="title">{{ selectedDiary.标题 }}</h1>
        </div>

        <div class="diary-section">
          <h2>心情随笔</h2>
          <p>{{ selectedDiary.心情随笔 }}</p>
        </div>

        <div class="diary-section collapsible">
          <h2 @click="toggleSection('events')">
            本日事件簿 <span class="arrow" :class="{ open: sectionsOpen.events }">▸</span>
          </h2>
          <div v-if="sectionsOpen.events" class="collapsible-content">
            <div v-for="(event, index) in selectedDiary.本日事件簿" :key="index" class="event-item">
              <p><strong>时刻:</strong> {{ event.时刻 }}</p>
              <p><strong>地点:</strong> {{ event.地点 }}</p>
              <p><strong>事件:</strong> {{ event.事件 }}</p>
              <p class="t吐槽"><strong>我的吐槽:</strong> {{ event.我的吐槽 }}</p>
            </div>
          </div>
        </div>

        <div class="diary-section collapsible">
          <h2 @click="toggleSection('relations')">
            关系温度计 <span class="arrow" :class="{ open: sectionsOpen.relations }">▸</span>
          </h2>
          <div v-if="sectionsOpen.relations" class="collapsible-content">
            <div v-for="(relation, index) in selectedDiary.关系温度计" :key="index" class="relation-item">
              <p><strong>对象:</strong> {{ relation.对象 }}</p>
              <p><strong>事件:</strong> {{ relation.事件 }}</p>
              <p><strong>我的看法:</strong> {{ relation.我的看法 }}</p>
            </div>
          </div>
        </div>

        <div class="diary-section collapsible">
          <h2 @click="toggleSection('memos')">
            明日备忘 <span class="arrow" :class="{ open: sectionsOpen.memos }">▸</span>
          </h2>
          <div v-if="sectionsOpen.memos" class="collapsible-content">
            <ul>
              <li v-for="(memo, index) in selectedDiary.明日备忘" :key="index">{{ memo }}</li>
            </ul>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>日记加载中，或没有找到日记条目。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import type { DiaryEntry } from '../../types';
import { diaryService } from '../../services/diaryService';

const props = defineProps({
  isDiaryNavOpen: Boolean,
});
const emit = defineEmits(['close-diary-nav']);

const isNavOpen = ref(props.isDiaryNavOpen);
watch(
  () => props.isDiaryNavOpen,
  newVal => {
    isNavOpen.value = newVal;
  },
);

const diaryList = ref<DiaryEntry[]>([]);
const selectedDiary = ref<DiaryEntry | null>(null);

const sectionsOpen = reactive({
  events: false,
  relations: false,
  memos: false,
});

type Section = keyof typeof sectionsOpen;

const toggleSection = (section: Section) => {
  sectionsOpen[section] = !sectionsOpen[section];
};

const selectDiary = (diary: DiaryEntry) => {
  selectedDiary.value = diary;
  // isNavOpen.value = false; // Now controlled by parent
  emit('close-diary-nav');
};

onMounted(async () => {
  try {
    const entries = await diaryService.getDiaryEntries();
    diaryList.value = entries;
    if (entries.length > 0) {
      selectedDiary.value = entries[0];
    }
  } catch (error) {
    console.error('Failed to load diary entries:', error);
  }
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.diary-app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1a1d2e;
  color: #c8c8d4;
  overflow: hidden;
  position: relative;
}

.app-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
}

.side-nav-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.side-nav {
  position: absolute;
  top: 0;
  left: 0;
  width: 250px;
  height: 100%;
  background-color: #141726;
  padding: 20px;
  z-index: 101;
  transform: translateX(0);
  box-shadow: 5px 0 15px rgba(0, 0, 0, 0.3);

  h3 {
    color: #d4af37;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    padding: 10px;
    cursor: pointer;
    border-radius: 4px;
    margin-bottom: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    &.active {
      background-color: #d4af37;
      color: #141726;
    }
  }
}

.slide-enter-active,
.slide-leave-active,
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
}

.diary-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  .date-weather {
    font-size: 14px;
    color: #8a8a9e;
    margin-bottom: 10px;
  }
  .title {
    font-size: 24px;
    color: #e0e0e0;
    margin: 0;
    font-weight: 600;
  }
}

.diary-section {
  margin-bottom: 15px;
  &.collapsible h2 {
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
    .arrow {
      transition: transform 0.3s ease;
      display: inline-block;
      &.open {
        transform: rotate(90deg);
      }
    }
  }
  h2 {
    font-size: 18px;
    color: #d4af37;
    border-bottom: 1px solid #d4af37;
    padding-bottom: 8px;
    margin-top: 0;
    margin-bottom: 15px;
  }
  p,
  ul {
    font-size: 15px;
    line-height: 1.8;
    white-space: pre-wrap;
  }
  ul {
    padding-left: 20px;
  }
  li {
    margin-bottom: 8px;
  }
}

.collapsible-content {
  padding-top: 10px;
}

.event-item,
.relation-item {
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  border-left: 3px solid #3a8f9d;
  p {
    margin: 5px 0;
  }
  strong {
    color: #a9a9c8;
  }
  .t吐槽 {
    font-style: italic;
    color: #8a8a9e;
  }
}

.relation-item {
  border-left-color: #8a5db5;
}
.empty-state {
  text-align: center;
  color: #888;
  padding-top: 5em;
  font-style: italic;
}
</style>
