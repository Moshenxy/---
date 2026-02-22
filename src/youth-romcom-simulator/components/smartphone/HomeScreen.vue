<template>
  <div class="home-screen">
    <div class="wallpaper-background" :style="wallpaperStyle"></div>
    <div class="content-overlay">
      <div class="header-info">
        <div class="date">{{ formattedDate }}</div>
        <div class="time">{{ worldTime }}</div>
        <div class="location-weather-widget">
          <span><i class="fas fa-map-marker-alt"></i> {{ currentLocation }}</span>
          <span><i class="fas fa-cloud-sun"></i> {{ currentWeather }} → {{ futureWeather }}</span>
        </div>
      </div>
      <div class="app-grid">
        <AppIcon
          v-for="app in apps"
          :key="app.id"
          :icon-class="app.icon"
          :name="app.name"
          @click="$emit('open-app', app.id)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue';
import { npcService } from '../../services/NpcService';
import { smartphoneService } from '../../services/SmartphoneService';
import { store } from '../../store';
import AppIcon from './AppIcon.vue';

export default defineComponent({
  name: 'HomeScreen',
  components: { AppIcon },
  emits: ['open-app'],
  setup() {
    const wallpaper = smartphoneService.wallpaperContent;

    onMounted(() => {
      smartphoneService.fetchWallpaperContent();
    });

    const isWallpaperUrl = computed(() => {
      return wallpaper.value && (wallpaper.value.startsWith('http') || wallpaper.value.startsWith('/'));
    });

    const wallpaperStyle = computed(() => {
      if (isWallpaperUrl.value) {
        return {
          backgroundImage: `url(${wallpaper.value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        };
      }
      return {};
    });

    const apps = ref([
      { id: 'contacts', name: '通讯录', icon: 'fas fa-address-book' },
      { id: 'calendar', name: '日历', icon: 'fas fa-calendar-alt' },
      { id: 'character', name: '角色', icon: 'fas fa-user' },
      { id: 'destiny', name: '命运', icon: 'fas fa-star' },
      { id: 'diary', name: '日记', icon: 'fas fa-book' },
      { id: 'inventory', name: '背包', icon: 'fas fa-briefcase' },
      { id: 'forum', name: '论坛', icon: 'fas fa-comments' },
      { id: 'map', name: '地图', icon: 'fas fa-map-marked-alt' },
      { id: 'system', name: '系统', icon: 'fas fa-cog' },
    ]);

    const formattedDate = computed(() => {
      const dateStr = store.worldState?.世界状态?.时间?.日期;
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}月${date.getDate()}日 星期${['日', '一', '二', '三', '四', '五', '六'][date.getDay()]}`;
    });

    const worldTime = computed(() => store.worldState?.世界状态?.时间?.当前片段 || '');

    const currentLocation = computed(() => {
      const protagonist = store.worldState?.主角;
      if (protagonist && typeof protagonist === 'object' && '位置' in protagonist) {
        const locationId = protagonist.位置;
        return locationId ? npcService.getLocationName(locationId) : '未知';
      }
      return '未知';
    });
    const currentWeather = computed(() => store.worldState?.世界状态?.天气 || '未知');
    const futureWeather = computed(() => store.worldState?.世界状态?.未来天气 || '未知');

    return {
      apps,
      formattedDate,
      worldTime,
      currentLocation,
      currentWeather,
      futureWeather,
      wallpaper,
      wallpaperStyle,
      isWallpaperUrl,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables.scss' as *;

.home-screen {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: $spacing-lg;
  padding-top: 40px; // Space for notch
}

.wallpaper-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background-size: cover;
  background-position: center;
  transition: background-image 0.5s ease-in-out;
  
  // Add a subtle vignette to make text more readable
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%);
  }
}

.content-overlay {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header-info {
  text-align: center;
  color: $color-white-moon;
  padding: $spacing-lg 0;
  flex-shrink: 0;

  .date {
    font-size: $font-size-base;
    opacity: 0.7;
  }
  .time {
    font-size: $font-size-h1 * 1.2;
    font-weight: 300;
    margin-top: $spacing-xs;
    color: $color-white-moon;
  }
}

.app-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: center;
  flex-grow: 1;
  gap: $spacing-lg;
  padding: $spacing-xl 0;
}
</style>
