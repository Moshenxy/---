<template>
  <div class="smartphone-shell">
    <div class="smartphone-screen">
      <div class="status-bar">
        <div class="time">{{ currentTime }}</div>
        <div class="battery-status">
          <span>{{ batteryLevel }}%</span>
          <i class="fas" :class="batteryIcon"></i>
        </div>
      </div>
      <transition name="app-fade" mode="out-in">
        <HomeScreen v-if="!activeAppId" @open-app="openApp" />
        <AppViewContainer v-else :title="getAppName(activeAppId)" @back="goHome">
          <template #header-actions>
            <button v-if="activeAppId === 'diary'" class="header-action-btn" @click="isDiaryNavOpen = !isDiaryNavOpen">
               <i class="fas fa-bars"></i>
            </button>
          </template>
          <component :is="activeApp" :is-diary-nav-open="isDiaryNavOpen" @close-diary-nav="isDiaryNavOpen = false"/>
        </AppViewContainer>
      </transition>
    </div>
    <div class="navigation-bar">
      <button class="nav-btn menu-btn">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>
      <button class="nav-btn home-btn" @click="$emit('close-smartphone')"></button>
      <button class="nav-btn back-btn" @click="goHome"></button>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, shallowRef } from 'vue';
import { store } from '../../store';
import CharacterApp from '../../views/apps/CharacterApp.vue';
import MapApp from '../../views/apps/MapApp.vue';
import DestinyCardPanel from '../panels/DestinyCardPanel.vue';
import DiaryPanel from '../panels/DiaryPanel.vue';
import ForumPanel from '../panels/ForumPanel.vue';
import InventoryPanel from '../panels/InventoryPanel.vue';
import NpcDirectoryPanel from '../panels/NpcDirectoryPanel.vue';
import SystemPanel from '../panels/SystemPanel.vue';
import TimelinePanel from '../panels/TimelinePanel.vue';
import AppViewContainer from './AppViewContainer.vue';
import HomeScreen from './HomeScreen.vue';

const apps: Record<string, any> = {
  contacts: NpcDirectoryPanel,
  calendar: TimelinePanel,
  character: CharacterApp,
  destiny: DestinyCardPanel,
  diary: DiaryPanel,
  inventory: InventoryPanel,
  forum: ForumPanel,
  map: MapApp,
  system: SystemPanel,
};

export default defineComponent({
  name: 'SmartphoneShell',
  components: { HomeScreen, AppViewContainer },
  emits: ['close-smartphone'],
  setup() {
    const activeAppId = ref<string | null>(null);
    const activeApp = shallowRef<any>(null);
    const isDiaryNavOpen = ref(false);

    const getAppName = (id: string) => {
      const appMap: Record<string, string> = {
        contacts: '通讯录',
        calendar: '日历',
        character: '角色',
        destiny: '命运',
        diary: '日记',
        forum: '论坛',
        system: '系统',
        map: '地图',
        inventory: '背包',
      };
      return appMap[id] || '应用';
    };

    const openApp = (appId: string) => {
      if (apps[appId]) {
        activeApp.value = apps[appId];
        activeAppId.value = appId;
        if (appId !== 'diary') {
           isDiaryNavOpen.value = false;
        }
      } else {
        console.warn(`App not found: ${appId}`);
        activeApp.value = null;
        activeAppId.value = appId;
      }
    };

    const goHome = () => {
      activeAppId.value = null;
      activeApp.value = null;
      isDiaryNavOpen.value = false;
    };

    const currentTime = ref('');
    const updateTime = () => {
      const now = new Date();
      currentTime.value = now.toTimeString().slice(0, 5);
    };
    onMounted(() => {
      updateTime();
      setInterval(updateTime, 1000 * 60);
    });

    const totalApPerDay = 21;
    const batteryLevel = computed(() => {
      const ap = store.worldState?.世界状态?.行动点;
      if (!ap) return 100;

      // This is a simplified logic. A more robust solution would track AP spent since morning.
      // Assuming the '上限' resets each time segment, which isn't accurate for a daily total.
      // For now, let's use a rough estimation.
      // A better way is to calculate AP spent based on current time segment.
      const segmentAPMap: Record<string, number> = {
        早晨: 2,
        上学路: 1,
        午前: 2,
        午休: 3,
        午后: 2,
        放学后: 5,
        傍晚: 3,
        夜: 3,
      };
      const segments = ['早晨', '上学路', '午前', '午休', '午后', '放学后', '傍晚', '夜'];
      const currentSegment = store.worldState?.世界状态?.时间?.当前片段 || '早晨';
      const currentSegmentIndex = segments.indexOf(currentSegment);

      let apSpent = 0;
      for (let i = 0; i < currentSegmentIndex; i++) {
        apSpent += segmentAPMap[segments[i]];
      }
      apSpent += segmentAPMap[currentSegment] - ap.当前;

      const percentage = 100 - Math.round((apSpent / totalApPerDay) * 100);
      return Math.max(0, percentage);
    });

    const batteryIcon = computed(() => {
      if (batteryLevel.value > 80) return 'fa-battery-full';
      if (batteryLevel.value > 60) return 'fa-battery-three-quarters';
      if (batteryLevel.value > 40) return 'fa-battery-half';
      if (batteryLevel.value > 10) return 'fa-battery-quarter';
      return 'fa-battery-empty';
    });

    return {
      activeAppId,
      activeApp,
      openApp,
      goHome,
      getAppName,
      currentTime,
      batteryLevel,
      batteryIcon,
      isDiaryNavOpen,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.smartphone-shell {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 380px;
  height: 800px;
  background-color: #1a1a1a;
  border-radius: 40px;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.5),
    inset 0 0 5px rgba(0, 0, 0, 0.8);
  padding: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition:
    transform 0.4s ease-in-out,
    opacity 0.4s ease-in-out;
  z-index: 10000;
}

.status-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 30px;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #fff;
  z-index: 20;

  .time {
    font-weight: bold;
  }

  .battery-status {
    display: flex;
    align-items: center;
    gap: 6px;
    opacity: 0.8;
  }
}

.smartphone-screen {
  width: 100%;
  height: 100%;
  background-color: #050a15;
  border-radius: 25px;
  overflow: hidden;
  position: relative;
  @include custom-scrollbar;
  display: flex;
  flex-direction: column;
}

.home-indicator {
  // This is no longer used, but might be referenced in the main App.vue.
  // Clearing styles to avoid interference.
}

.app-fade-enter-active,
.app-fade-leave-active {
  transition: opacity 0.2s ease;
}

.app-fade-enter-from,
.app-fade-leave-to {
  opacity: 0;
}

.navigation-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background-color: #1a1a1a;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 100;
  border-bottom-left-radius: 25px;
  border-bottom-right-radius: 25px;
}

.nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.7;
  transition: opacity 0.2s ease, background-color 0.2s ease;

  &:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.menu-btn {
  position: relative;
  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 2px;
    background-color: white;
    border-radius: 1px;
  }
  &::before {
    top: 16px;
    box-shadow: 0 5px 0 white, 0 10px 0 white;
  }
}

.home-btn {
  width: 26px;
  height: 26px;
  border: 2px solid white;
  border-radius: 50%;
}

.back-btn {
  width: 24px;
  height: 24px;
  
  &::before {
    content: '';
    display: block;
    width: 0;
    height: 0;
    border-left: 8px solid white;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
  }
}
</style>
