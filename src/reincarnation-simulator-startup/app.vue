<template>
  <div id="app-container" class="container">
    <GenerationProgress v-if="store.isGenerating" />
    <template v-else>
      <div v-if="store.currentPage > 1" id="points-tracker">
        <div class="difficulty-selector">
          <span>难度: </span>
          <select v-model="store.difficulty">
            <option v-for="diff in GAME_DATA.difficulties" :key="diff.id" :value="diff.id">
              {{ diff.name }}
            </option>
          </select>
        </div>
        <div class="points-display">创世点数: {{ store.remainingPoints }}</div>
      </div>
      <button type="button" class="fullscreen-btn" @click="toggleFullscreen">
        {{ isFullscreen ? '退出全屏' : '全屏' }}
      </button>
      <div v-if="store.currentPage > 1" class="schematic-box">
        <SchematicDisplay />
      </div>
      <template v-if="store.currentPage === 2">
        <div class="scrollable-content">
          <component :is="currentPageComponent" />
        </div>
      </template>
      <form v-else id="startup-form" @submit.prevent="tavernService.generatePrompt">
        <div class="scrollable-content">
          <component :is="currentPageComponent" />
        </div>
      </form>
      <div class="nav-buttons">
        <button v-if="store.currentPage > 1" type="button" class="nav-btn prev" @click="navigate(-1)">
          &larr; 上一章
        </button>
        <button v-if="store.currentPage === 1" type="button" id="reset-world-btn" @click="tavernService.resetWorld">
          重置世界
        </button>
        <button type="button" class="nav-btn" @click="showPresetManager = true">管理方案</button>
        <div style="flex-grow: 1"></div>
        <button
          v-if="store.currentPage > 1 && store.currentPage < 7"
          type="button"
          class="nav-btn next"
          @click="navigate(1)"
        >
          下一章 &rarr;
        </button>
        <button v-if="store.currentPage === 6" type="button" @click="tavernService.buildWorld" class="submit-btn">构筑世界</button>
        <button v-if="store.currentPage === 7" type="button" @click="tavernService.startReincarnation" class="submit-btn">开启轮回</button>
      </div>
    </template>
    <PresetManager :show="showPresetManager" @close="showPresetManager = false" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import * as tavernService from './services/TavernService';
import { GAME_DATA, navigate, store } from './store';

import CharacterCreator from './components/CharacterCreator.vue';
import CoverPage from './components/CoverPage.vue';
import GenerationProgress from './components/GenerationProgress.vue';
import PotentialAllocator from './components/PotentialAllocator.vue';
import PresetManager from './components/PresetManager.vue';
import SchematicDisplay from './components/SchematicDisplay.vue';
import SummaryPage from './components/SummaryPage.vue';
import WorldBuilder from './components/WorldBuilder.vue';
import WorldVisionPage from './components/WorldVisionPage.vue';
import WorldConfirmationPage from './components/WorldConfirmationPage.vue';

const showPresetManager = ref(false);

const isFullscreen = ref(false);

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    isFullscreen.value = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      isFullscreen.value = false;
    }
  }
};

document.addEventListener('fullscreenchange', () => {
  isFullscreen.value = !!document.fullscreenElement;
});

const pages = [CoverPage, WorldVisionPage, WorldBuilder, CharacterCreator, PotentialAllocator, SummaryPage, WorldConfirmationPage];

const currentPageComponent = computed(() => pages[store.currentPage - 1]);
</script>
