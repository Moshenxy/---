<template>
  <div class="map-app" :class="{ 'filter-sidebar-open': isFilterSidebarOpen }">
    <div class="filter-sidebar-handle" @click="toggleFilterSidebar">功能</div>
    <div class="app-header" ref="breadcrumbsContainer">
      <div class="breadcrumbs">
        <span v-for="(crumb, index) in breadcrumbs" :key="index" @click="goBack(index)" class="crumb">
          {{ crumb.name }}
        </span>
      </div>
    </div>
    <div class="map-sidebar">
      <div class="sidebar-tabs">
        <button :class="{ active: activeTab === 'collection' }" @click="activeTab = 'collection'">集合</button>
        <button :class="{ active: activeTab === 'search' }" @click="activeTab = 'search'">搜索</button>
        <button :class="{ active: activeTab === 'filter' }" @click="activeTab = 'filter'">筛选</button>
      </div>

      <div v-show="activeTab === 'collection'" class="sidebar-content">
        <h4>当前层级地点</h4>
        <ul class="location-list">
          <li v-for="loc in currentLevelLocations" :key="loc.id" @click="focusOnLocation(loc)">
            {{ loc.name }}
          </li>
        </ul>
      </div>

      <div v-show="activeTab === 'search'" class="sidebar-content">
        <h4>搜索地点</h4>
        <input type="text" v-model="searchQuery" placeholder="输入地点名称..." class="search-input" />
        <ul class="location-list search-results">
          <li v-for="loc in searchResults" :key="loc.id" @click="jumpToLocation(loc)">
            <span class="search-result-name">{{ loc.name }}</span>
            <span class="search-result-path">{{ getLocationPath(loc.id) }}</span>
          </li>
        </ul>
      </div>

      <div v-show="activeTab === 'filter'" class="sidebar-content">
        <h4>地点类型筛选</h4>
        <div class="filter-group">
          <label v-for="(visible, type) in locationTypeFilters" :key="type">
            <input type="checkbox" v-model="locationTypeFilters[type]" />
            <span class="color-indicator" :style="{ backgroundColor: locationTypeColors[type] }"></span>
            {{ type }}
          </label>
        </div>
      </div>
    </div>
    <div class="map-container" ref="mapContainer">
      <div class="map-controls">
        <button @click="zoomIn">+</button>
        <button @click="zoomOut">-</button>
      </div>
      <div v-if="mapData" ref="panzoomContainer" class="map-pan-container">
        <div class="map-grid" :style="gridStyle">
          <div
            v-for="location in currentLevelLocations"
            :key="location.id"
            class="location-node"
            :class="[{ 'has-event': hasEvent(location.id) }, `type-${location.type}`]"
            :style="getLocationStyle(location)"
            @click="selectedLocationId = location.id"
            @dblclick="drillDown(location)"
          >
            <span class="location-text">{{ location.name }}</span>
            <div
              v-if="charactersOnMap[location.id] && charactersOnMap[location.id].length > 0"
              class="character-cluster-icon"
              @click.stop="showCharacterList(location)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span class="cluster-count">{{ charactersOnMap[location.id].length }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="loading-pane">加载地图中...</div>
    </div>
    <div v-if="selectedLocation" class="info-panel" ref="infoPanelContainer">
      <h3>{{ selectedLocation.name }}</h3>
      <p>{{ selectedLocation.description }}</p>
      <div v-if="eventsAtLocation.length > 0">
        <h4>今日日程:</h4>
        <ul>
          <li v-for="event in eventsAtLocation" :key="event.ID">{{ event.标题 }}</li>
        </ul>
      </div>
    </div>
    <LocationCharacterList
      :show="isCharacterListVisible"
      :characters="selectedLocationCharacters"
      :location-name="selectedLocationForList?.name || ''"
      @close="isCharacterListVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import panzoom from 'panzoom';
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import LocationCharacterList from '../../components/map/LocationCharacterList.vue';
import { getAllLocationsMap, getLocationsByParentId, Location } from '../../services/location-parser';
import { getters, store } from '../../store';
import { appNavigator } from '../../utils/app-navigation';
import { getCharacterById, safeGetValue } from '../../utils/character-utils';
import { getCharactersInLocationAndChildren } from '../../utils/map-utils';

const mapData = ref<Location[] | null>(null);
const eventsByLocation = computed(() => getters.eventsByLocation.value);
const characterLocations = computed(() => getters.characterLocations.value);
const allLocationsMap = ref<Map<string, Location>>(new Map());
const mapContainer = ref<HTMLElement | null>(null);
const panzoomContainer = ref<HTMLElement | null>(null);
let panzoomInstance: any = null;
const isMapLoading = ref(false);

const breadcrumbsContainer = ref<HTMLElement | null>(null);
const infoPanelContainer = ref<HTMLElement | null>(null);

const activeContextId = ref<string | null>(null);
const breadcrumbs = ref<{ name: string; contextId: string | null }[]>([]);
const locationTypeFilters = reactive<{ [key: string]: boolean }>({
  店铺: true,
  娱乐场所: true,
  社团活动室: true,
  运动设施: true,
  公共设施: true,
  名胜古迹: true,
  特殊地点: true,
});
const isFilterSidebarOpen = ref(false);
const isCharacterListVisible = ref(false);
const selectedLocationForList = ref<Location | null>(null);

const selectedLocationId = ref<string | null>(null);
const activeTab = ref('collection'); // 'collection', 'search', 'filter'
const searchQuery = ref('');

const locationTypeColors: { [key: string]: string } = {
  店铺: '#f59e0b',
  娱乐场所: '#d946ef',
  社团活动室: '#db2777',
  运动设施: '#0ea5e9',
  公共设施: '#7c3aed',
  名胜古迹: '#c026d3',
  特殊地点: '#475569',
};
const panState = reactive({ x: 0, y: 0, scale: 1 });

const allLocations = computed((): Location[] => Array.from(allLocationsMap.value.values()));

const searchResults = computed(() => {
  if (!searchQuery.value) return [];
  const query = searchQuery.value.toLowerCase();
  return allLocations.value.filter(loc => loc.name.toLowerCase().includes(query));
});

const selectedLocation = computed(() => {
  if (!selectedLocationId.value) return null;
  return allLocations.value.find(l => l.id === selectedLocationId.value) || null;
});

const selectedLocationCharacters = computed(() => {
  if (!selectedLocationForList.value) return [];
  return charactersOnMap.value[selectedLocationForList.value.id] || [];
});

const charactersOnMap = computed(() => {
  const result: { [key: string]: { id: string; name: string }[] } = {};
  if (!mapData.value) return result;

  for (const location of mapData.value) {
    const charIds = getCharactersInLocationAndChildren(location.id, allLocations.value, characterLocations.value);
    result[location.id] = charIds.map(id => {
      const char = getCharacterById(store.worldState, id);
      return {
        id: id,
        name: char ? `${safeGetValue(char, '姓', '', true)}` : '?',
      };
    });
  }
  return result;
});

const gridStyle = computed(() => {
  if (!mapData.value) return {};
  const maxX = Math.max(...allLocations.value.map(l => (l.gridX || 0) + (l.gridWidth || 1)));
  const maxY = Math.max(...allLocations.value.map(l => (l.gridY || 0) + (l.gridHeight || 1)));
  return {
    'grid-template-columns': `repeat(${maxX}, 50px)`,
    'grid-template-rows': `repeat(${maxY}, 50px)`,
  };
});

const eventsAtLocation = computed(() => {
  if (!selectedLocationId.value) return [];
  return eventsByLocation.value[selectedLocationId.value] || [];
});

const hasEvent = (locationId: string) => {
  return eventsByLocation.value[locationId]?.length > 0;
};

const isVisible = (location: Location) => {
  // If the location type is in our filter list, its visibility depends on the filter's value
  if (location.type in locationTypeFilters) {
    return locationTypeFilters[location.type];
  }
  // If the location type is not in our filter list, it's always visible by default.
  return true;
};

const currentLevelLocations = computed((): Location[] => {
  return mapData.value || [];
});

const getCharacterAvatarText = (charId: string) => {
  if (charId === store.userId) return '我';
  const char = getCharacterById(store.worldState, charId);
  return char ? `${safeGetValue(char, '姓', '?', true)}` : '?';
};

const showCharacterList = (location: Location) => {
  selectedLocationForList.value = location;
  isCharacterListVisible.value = true;
};

onMounted(() => {
  getAllLocationsMap().then(data => {
    allLocationsMap.value = data;
    loadMapData();
  });
});

watch(activeContextId, loadMapData, { immediate: true });

async function loadMapData() {
  isMapLoading.value = true;
  mapData.value = await getLocationsByParentId(activeContextId.value);
  updateBreadcrumbs();

  if (panzoomInstance) {
    panzoomInstance.dispose();
  }
  if (panzoomContainer.value) {
    panzoomInstance = panzoom(panzoomContainer.value, {
      maxZoom: 5,
      minZoom: 0.1,
    });

    const onTransform = () => {
      if (!panzoomInstance) return;
      const transform = panzoomInstance.getTransform();
      panState.x = transform.x;
      panState.y = transform.y;
      panState.scale = transform.scale;
    };

    panzoomInstance.on('pan', onTransform);
    panzoomInstance.on('zoom', onTransform);
    panzoomInstance.on('transform', onTransform); // Catch all transform changes
  }

  // Auto-center map on data change
  nextTick(() => {
    if (panzoomInstance && panzoomContainer.value) {
      const locations = currentLevelLocations.value;
      if (locations.length === 0) {
        isMapLoading.value = false;
        return;
      }

      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      locations.forEach(loc => {
        minX = Math.min(minX, loc.gridX || 0);
        minY = Math.min(minY, loc.gridY || 0);
        maxX = Math.max(maxX, (loc.gridX || 0) + (loc.gridWidth || 1));
        maxY = Math.max(maxY, (loc.gridY || 0) + (loc.gridHeight || 1));
      });

      const GRID_CELL_SIZE = 50;
      const PADDING = 20;

      const rect = {
        left: minX * GRID_CELL_SIZE - PADDING,
        top: minY * GRID_CELL_SIZE - PADDING,
        right: maxX * GRID_CELL_SIZE + PADDING,
        bottom: maxY * GRID_CELL_SIZE + PADDING,
      };

      // Custom centering logic
      if (!mapContainer.value) return;
      const mapContainerRect = mapContainer.value.getBoundingClientRect();
      const sidebarWidth = isFilterSidebarOpen.value ? 220 : 0;
      const viewbox = {
        left: sidebarWidth,
        top: 0,
        width: mapContainerRect.width - sidebarWidth,
        height: mapContainerRect.height,
      };

      panzoomInstance.showRectangle(rect, {
        viewbox,
      });

      // The 'transform' event will handle updating panState
      // But we need to ensure it's updated for the first render
      const { x, y, scale } = panzoomInstance.getTransform();
      panState.x = x;
      panState.y = y;
      panState.scale = scale;

      // Defer setting loading to false to allow computed properties to catch up
      setTimeout(() => {
        isMapLoading.value = false;
      }, 50);
    } else {
      isMapLoading.value = false;
    }
  });
}

const toggleFilterSidebar = () => {
  isFilterSidebarOpen.value = !isFilterSidebarOpen.value;
};

const drillDown = (location: Location) => {
  const hasChildren = allLocations.value.some(loc => loc.parentId === location.id);
  if (hasChildren) {
    activeContextId.value = location.id;
    searchQuery.value = ''; // Clear search when drilling down
  }
};

const focusOnLocation = (location: Location) => {
  if (!panzoomInstance || !mapContainer.value) return;
  selectedLocationId.value = location.id;

  // Define the bounding box of the target location
  const PADDING = 50;
  const rect = {
    left: (location.gridX || 0) * 50 - PADDING,
    top: (location.gridY || 0) * 50 - PADDING,
    right: ((location.gridX || 0) + (location.gridWidth || 1)) * 50 + PADDING,
    bottom: ((location.gridY || 0) + (location.gridHeight || 1)) * 50 + PADDING,
  };

  // Define the visible area (viewbox), considering the sidebar
  const mapContainerRect = mapContainer.value.getBoundingClientRect();
  const sidebarWidth = isFilterSidebarOpen.value ? 220 : 0;
  const viewbox = {
    left: sidebarWidth,
    top: 0,
    width: mapContainerRect.width - sidebarWidth,
    height: mapContainerRect.height,
  };

  // Use the library's built-in function to show the rectangle within the specified viewbox
  // This handles both zooming and panning to center the target correctly.
  panzoomInstance.showRectangle(rect, {
    viewbox,
  });
};

const jumpToLocation = async (location: Location) => {
  activeContextId.value = location.parentId;
  await nextTick(); // Wait for the map to re-render with the correct level
  focusOnLocation(location);
};

const getLocationPath = (locationId: string): string => {
  const path: string[] = [];
  let currentId: string | null = locationId;
  while (currentId) {
    const currentLocation = allLocationsMap.value.get(currentId);
    if (currentLocation) {
      path.unshift(currentLocation.name);
      currentId = currentLocation.parentId;
    } else {
      break;
    }
  }
  return path.slice(0, -1).join(' / '); // Exclude the location name itself
};

async function updateBreadcrumbs() {
  const newCrumbs: { name: string; contextId: string | null }[] = [{ name: '世界', contextId: null }];

  if (activeContextId.value) {
    let currentId: string | null = activeContextId.value;
    const path: Location[] = [];
    while (currentId) {
      const currentLocation = allLocationsMap.value.get(currentId);
      if (currentLocation) {
        path.unshift(currentLocation);
        currentId = currentLocation.parentId;
      } else {
        break;
      }
    }
    path.forEach(loc => {
      newCrumbs.push({ name: loc.name, contextId: loc.id });
    });
  }
  breadcrumbs.value = newCrumbs;
}

function goBack(index: number) {
  const crumb = breadcrumbs.value[index];
  activeContextId.value = crumb.contextId;
  searchQuery.value = ''; // Clear search when going back
}

const getLocationStyle = (location: Location) => {
  if (location.gridX === undefined || location.gridY === undefined) return {};

  const width = location.gridWidth || 1;
  const height = location.gridHeight || 1;
  const area = width * height;

  const AREA_SQRT_RATIO = 8; // 缩放因子，将面积的平方根映射到字体大小
  const MIN_FONT_SIZE = 8; // px

  // 使用面积的平方根来同一个一维的字体大小进行线性关联
  let fontSize = Math.sqrt(area) * AREA_SQRT_RATIO;

  // 保证一个最小的可读性
  fontSize = Math.max(MIN_FONT_SIZE, fontSize);

  return {
    'grid-column-start': location.gridX + 1,
    'grid-column-end': `span ${width}`,
    'grid-row-start': location.gridY + 1,
    'grid-row-end': `span ${height}`,
    opacity: isVisible(location) ? 1 : 0.3,
    'font-size': `${fontSize.toFixed(2)}px`,
  };
};

const zoomIn = () => {
  panzoomInstance?.zoomIn();
};

const zoomOut = () => {
  panzoomInstance?.zoomOut();
};

const openChat = (characterId: string) => {
  if (characterId === store.userId) return;

  const chat = getters.enrichedChatList.value.find(c => c.characterId === characterId);
  if (chat) {
    appNavigator.openApp('tianhuachat', { chatId: chat.id });
  } else {
    alert(`还不是好友，无法聊天。`);
  }
};
</script>

<style lang="scss" scoped>
@import '../../styles/apps/map.scss';
</style>
