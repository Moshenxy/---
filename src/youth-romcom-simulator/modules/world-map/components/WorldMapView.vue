<template>
  <div class="world-map-view" ref="rootElRef">
    <MapNavigator :path="navigationPath" @navigate="onNavigateBack" />
    <button ref="searchBtnRef" class="search-toggle-btn" @click="isSearchPanelVisible = !isSearchPanelVisible">
      🔍
    </button>
    <div v-if="isSearchPanelVisible" class="search-panel">
      <input type="text" v-model="searchText" placeholder="搜索节点..." @keyup.enter="jumpToFirstResult" />
      <ul v-if="searchResults.length && searchText" class="search-results">
        <li v-for="node in searchResults" :key="node.id" @click="jumpToNode(node)">
          {{ getFullPath(node) }}
        </li>
      </ul>
    </div>
    <svg ref="svgRef" class="map-svg"></svg>
    <NodeDetailPanel v-if="isDetailPanelVisible" :node="selectedNode as any" @close="mapActions.hideDetail" />
  </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import { debounce } from 'lodash';
import { computed, nextTick, onActivated, onMounted, onUnmounted, ref, watch } from 'vue';
import { store } from '../../../store';
import { colorService } from '../services/ColorService';
import { coordinateService } from '../services/CoordinateService';
import { worldMapDataService } from '../services/WorldMapDataService';
import { mapActions, mapState } from '../store/mapState';
import type { MapHierarchy, MapNode } from '../types';

import MapNavigator from './MapNavigator.vue';
import NodeDetailPanel from './NodeDetailPanel.vue';

const svgRef = ref<SVGSVGElement | null>(null);
const rootElRef = ref<HTMLDivElement | null>(null);
const fullHierarchy = ref<MapHierarchy | null>(null);
const layoutNodes = ref<MapNode[]>([]);
const layoutLinks = ref<d3.SimulationLinkDatum<MapNode>[]>([]);
const searchText = ref('');
const stars = ref<{ id: number; x: number; y: number; r: number; o: number }[]>([]);
const isSearchPanelVisible = ref(false);
const isStarfieldInitialized = ref(false);

const navigationPath = computed(() => mapState.navigationPath);
const isDetailPanelVisible = computed(() => mapState.isDetailPanelVisible);
const selectedNode = computed(() => mapState.selectedNode);
const currentRootId = computed(() => mapState.currentRootId);

const findNode = (node: MapNode, id: string): MapNode | null => {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
};

const currentRootNode = computed((): MapNode | null => {
  if (!fullHierarchy.value) return null;
  return findNode(fullHierarchy.value, currentRootId.value);
});

const allNodes = computed((): MapNode[] => {
  const nodes: MapNode[] = [];
  function traverse(node: MapNode) {
    nodes.push(node);
    node.children.forEach(traverse);
  }
  if (fullHierarchy.value) {
    traverse(fullHierarchy.value);
  }
  return nodes;
});

const searchResults = computed((): MapNode[] => {
  if (!searchText.value) return [];
  return allNodes.value.filter(node => node.name.toLowerCase().includes(searchText.value.toLowerCase())).slice(0, 10);
});

const getFullPath = (node: MapNode): string => {
  const path = [];
  let current: MapNode | undefined | null = node;
  while (current && current.id !== 'WORLD_ORIGIN') {
    path.unshift(current.name);
    current = allNodes.value.find(n => n.id === current!.parentId);
  }
  return path.join(' > ');
};

const jumpToNode = (node: MapNode) => {
  const path: MapNode[] = [];
  let current: MapNode | undefined | null = node;
  while (current && current.parentId && current.id !== 'WORLD_ORIGIN') {
    path.unshift(current);
    current = allNodes.value.find(n => n.id === current!.parentId);
  }
  if (current) {
    path.unshift(current);
  }

  const newNavPath = path.map(p => ({ id: p.id, name: p.name }));
  mapActions.setNavigationPath(newNavPath);

  if (node.parentId) {
    mapActions.navigateBack(node.parentId);
  } else {
    mapActions.navigateBack('WORLD_ORIGIN');
  }

  searchText.value = '';
};

const jumpToFirstResult = () => {
  if (searchResults.value.length > 0) {
    jumpToNode(searchResults.value[0]);
  }
};

const searchBtnRef = ref<HTMLButtonElement | null>(null);

const initDraggableSearchBtn = () => {
  const btn = searchBtnRef.value;
  if (!btn) return;
  let isDragging = false;
  let offsetX = 0,
    offsetY = 0;

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const container = btn.parentElement;
    if (!container) return;
    let x = e.clientX - offsetX;
    let y = e.clientY - offsetY;
    const containerRect = container.getBoundingClientRect();
    x = Math.max(0, Math.min(x, containerRect.width - btn.offsetWidth));
    y = Math.max(0, Math.min(y, containerRect.height - btn.offsetHeight));
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    const containerRect = btn.parentElement!.getBoundingClientRect();
    const rect = btn.getBoundingClientRect();
    const threshold = 50;
    if (rect.left - containerRect.left < threshold) btn.style.left = '10px';
    else if (containerRect.right - rect.right < threshold)
      btn.style.left = `${containerRect.width - rect.width - 10}px`;
    if (rect.top - containerRect.top < threshold) btn.style.top = '10px';
    else if (containerRect.bottom - rect.bottom < threshold)
      btn.style.top = `${containerRect.height - rect.height - 10}px`;
  };

  btn.onmousedown = e => {
    isDragging = true;
    offsetX = e.clientX - btn.offsetLeft;
    offsetY = e.clientY - btn.offsetTop;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
};

// --- 核心修复逻辑 ---

const mainWorldActiveEpoch = computed(() => {
  const state = store.worldState;
  if (!state || !state.世界) return null;
  const world = Object.values(state.世界).find(w => w.定义?.元规则?.定位 === '主世界');
  if (!world) return null;
  const currentEpochId = world.定义?.元规则?.当前纪元ID;
  if (!currentEpochId || !world.定义.历史纪元) return null;
  return world.定义.历史纪元[currentEpochId] || null;
});

const updateAndRenderMap = debounce(() => {
  if (!svgRef.value) return;

  const { width, height } = svgRef.value.getBoundingClientRect();
  if (width === 0 || height === 0) return; // 关键：确保容器有尺寸

  // 确保星空背景只在容器获得尺寸后初始化一次
  if (!isStarfieldInitialized.value) {
    const starFieldSize = Math.max(width, height) * 4;
    stars.value = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * starFieldSize + width / 2,
      y: (Math.random() - 0.5) * starFieldSize + height / 2,
      r: Math.random() * 1.2,
      o: Math.random() * 0.8 + 0.2,
    }));
    isStarfieldInitialized.value = true;
  }

  if (!mainWorldActiveEpoch.value) {
    renderD3([], [], d3.zoomIdentity);
    return;
  }

  fullHierarchy.value = worldMapDataService.getMapHierarchy(mainWorldActiveEpoch.value as any);

  if (!currentRootNode.value) {
    renderD3([], [], d3.zoomIdentity);
    return;
  }

  const rootCopy = JSON.parse(JSON.stringify(currentRootNode.value));

  let nodesToRender: MapNode[] = [];
  let links: d3.SimulationLinkDatum<MapNode>[] = [];

  if (rootCopy.id === 'WORLD_ORIGIN') {
    const mainNode = rootCopy.children[0];
    if (mainNode) {
      mainNode.x = width / 2;
      mainNode.y = height / 2;
      coordinateService.calculateRelativePositions(mainNode, rootCopy.children.slice(1));
    }
    nodesToRender = rootCopy.children;
    links = rootCopy.children
      .slice(1)
      .map((child: MapNode) => ({ source: mainNode, target: child })) as d3.SimulationLinkDatum<MapNode>[];
  } else {
    rootCopy.x = width / 2;
    rootCopy.y = height / 2;
    coordinateService.calculateRelativePositions(rootCopy, rootCopy.children);
    nodesToRender = [rootCopy, ...rootCopy.children];
    links = rootCopy.children.map((child: MapNode) => ({
      source: rootCopy,
      target: child,
    })) as d3.SimulationLinkDatum<MapNode>[];
  }

  layoutNodes.value = nodesToRender.filter(n => n.id !== 'WORLD_ORIGIN');
  layoutLinks.value = links;

  nextTick(() => {
    renderD3(layoutNodes.value, layoutLinks.value, d3.zoomIdentity);
  });
}, 300);

watch(mainWorldActiveEpoch, updateAndRenderMap, { immediate: true });
watch(currentRootId, updateAndRenderMap);

watch(
  () => store.worldState,
  newState => {
    if (!newState) return;
    const avatarId = newState.玩家?.模拟器?.模拟?.当前化身ID;
    const userLocation = newState.玩家?.本体?.当前位置 || null;
    let avatarLocation: string | null = null;
    if (avatarId && newState.世界) {
      for (const world of Object.values(newState.世界)) {
        const foundAvatar = world.角色?.[avatarId];
        if (foundAvatar) {
          avatarLocation = foundAvatar.当前位置 || null;
          break;
        }
      }
    }
    mapActions.setPlayerLocations({ user: userLocation, avatar: avatarLocation });
  },
  { deep: true, immediate: true },
);

onMounted(() => {
  initDraggableSearchBtn();
  const handleClickOutside = (event: MouseEvent) => {
    const searchPanel = document.querySelector('.search-panel');
    if (
      searchPanel &&
      !searchPanel.contains(event.target as Node) &&
      !searchBtnRef.value?.contains(event.target as Node)
    ) {
      isSearchPanelVisible.value = false;
    }
  };
  document.addEventListener('click', handleClickOutside, true);

  const observer = new ResizeObserver(() => {
    updateAndRenderMap();
  });
  if (rootElRef.value) {
    observer.observe(rootElRef.value);
  }

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside, true);
    observer.disconnect();
  });
});

onActivated(() => {
  if (currentRootNode.value?.id === 'WORLD_ORIGIN') {
    mapActions.setNavigationPath([]);
  }
});

function renderD3(nodes: MapNode[], links: d3.SimulationLinkDatum<MapNode>[], transform: d3.ZoomTransform) {
  const clickTimers = new Map<string, number>();
  if (!svgRef.value) return;

  const svg = d3.select(svgRef.value);
  const zoomContainer = svg.selectAll<SVGGElement, unknown>('g.zoom-container').data([null]);
  const zoomContainerEnter = zoomContainer.enter().append('g').attr('class', 'zoom-container');
  const g = zoomContainer.merge(zoomContainerEnter);

  zoomContainerEnter
    .append('g')
    .selectAll('circle.star')
    .data(stars.value)
    .join('circle')
    .attr('class', 'star')
    .attr('cx', (d: any) => d.x)
    .attr('cy', (d: any) => d.y)
    .attr('r', (d: any) => d.r)
    .attr('fill', 'white')
    .attr('opacity', (d: any) => d.o);

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.01, 10])
    .on('zoom', (event: any) => {
      g.attr('transform', event.transform);
    });
  svg.call(zoom as any).on('dblclick.zoom', null);
  svg
    .transition()
    .duration(750)
    .call(zoom.transform as any, transform);

  const t = d3.transition().duration(750);

  const visualCenterNode = nodes.find(n => n.id === currentRootId.value) || nodes[0];
  if (visualCenterNode) {
    const distances = nodes
      .filter(n => n.id !== visualCenterNode.id)
      .map(n => {
        const dx = (n.x ?? 0) - (visualCenterNode.x ?? 0);
        const dy = (n.y ?? 0) - (visualCenterNode.y ?? 0);
        return Math.sqrt(dx * dx + dy * dy);
      })
      .filter(d => d > 0);

    g.selectAll('circle.orbit-line')
      .data(distances)
      .join(
        (enter: any) =>
          enter
            .append('circle')
            .attr('class', 'orbit-line')
            .attr('cx', visualCenterNode.x ?? 0)
            .attr('cy', visualCenterNode.y ?? 0)
            .attr('r', 0)
            .attr('fill', 'none')
            .attr('stroke', 'rgba(255, 255, 255, 0.1)')
            .call((enter: any) => enter.transition(t).attr('r', (d: any) => d)),
        (update: any) =>
          update.call((update: any) =>
            update
              .transition(t)
              .attr('cx', visualCenterNode.x ?? 0)
              .attr('cy', visualCenterNode.y ?? 0)
              .attr('r', (d: any) => d),
          ),
        (exit: any) => exit.call((exit: any) => exit.transition(t).attr('r', 0).remove()),
      );
  }

  g.selectAll('line.link')
    .data(links, (d: any) => `${d.source.id}-${d.target.id}`)
    .join(
      (enter: any) =>
        enter
          .append('line')
          .attr('class', 'link')
          .attr('stroke', '#999')
          .attr('stroke-opacity', 0)
          .attr('x1', (d: any) => (d.source as MapNode).x || 0)
          .attr('y1', (d: any) => (d.source as MapNode).y || 0)
          .attr('x2', (d: any) => (d.target as MapNode).x || 0)
          .attr('y2', (d: any) => (d.target as MapNode).y || 0)
          .call((enter: any) => enter.transition(t).attr('stroke-opacity', 0.4)),
      (update: any) =>
        update.call((update: any) =>
          update
            .transition(t)
            .attr('x1', (d: any) => (d.source as MapNode).x || 0)
            .attr('y1', (d: any) => (d.source as MapNode).y || 0)
            .attr('x2', (d: any) => (d.target as MapNode).x || 0)
            .attr('y2', (d: any) => (d.target as MapNode).y || 0),
        ),
      (exit: any) => exit.call((exit: any) => exit.transition(t).attr('stroke-opacity', 0).remove()),
    );

  const nodeGroups = g.selectAll<SVGGElement, MapNode>('g.node-group').data(nodes, (d: any) => d.id);

  const nodeEnter = nodeGroups
    .enter()
    .append('g')
    .attr('class', 'node-group')
    .classed('player-location', (d: any) => d.id === mapState.userLocationId)
    .classed('avatar-location', (d: any) => d.id === mapState.avatarLocationId)
    .attr('transform', (d: MapNode) => `translate(${d.x || 0},${d.y || 0})`)
    .attr('opacity', 0);

  nodeEnter
    .append('circle')
    .attr('r', (d: any) => d.radius)
    .attr('fill', (d: any) => colorService.getColor(d.type))
    .attr('stroke', (d: any) => d3.color(colorService.getColor(d.type))?.brighter(1.5).toString() ?? '#fff')
    .attr('stroke-width', 2);

  nodeEnter
    .append('text')
    .text((d: any) => d.name)
    .attr('text-anchor', 'middle')
    .attr('dy', (d: any) => d.radius + 15)
    .attr('fill', 'white')
    .style('font-size', '12px');

  nodeGroups
    .merge(nodeEnter)
    .on('click', function (event: MouseEvent, d: MapNode) {
      const existingTimeout = clickTimers.get(d.id);

      if (existingTimeout) {
        clearTimeout(existingTimeout);
        clickTimers.delete(d.id);
        mapActions.selectNode(d);
      } else {
        const newTimeout = window.setTimeout(() => {
          if (d.childCount > 0) {
            mapActions.navigateToNode(d);
          } else {
            mapActions.selectNode(d);
          }
          clickTimers.delete(d.id);
        }, 250);
        clickTimers.set(d.id, newTimeout);
      }
    })
    .transition(t)
    .attr('transform', (d: MapNode) => `translate(${d.x || 0},${d.y || 0})`)
    .attr('opacity', 1);

  nodeGroups.exit().transition(t).attr('opacity', 0).remove();
}

const onNavigateBack = (nodeId: string) => {
  mapActions.navigateBack(nodeId);
};
</script>

<style lang="scss">
@keyframes move-twink-back {
  from {
    background-position: 0 0;
  }
  to {
    background-position: -10000px 5000px;
  }
}

.stars,
.twinkling {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.stars {
  background: #000 url(https://www.script-tutorials.com/demos/360/images/stars.png) repeat top center;
  z-index: 0;
}

.twinkling {
  background: transparent url(https://www.script-tutorials.com/demos/360/images/twinkling.png) repeat top center;
  z-index: 1;
  animation: move-twink-back 200s linear infinite;
}

.world-map-view {
  .player-location circle {
    stroke: #ffeb3b !important;
    stroke-width: 4px !important;
    filter: drop-shadow(0 0 8px #ffeb3b);
  }
  .avatar-location circle {
    stroke: #03a9f4 !important;
    stroke-width: 4px !important;
    filter: drop-shadow(0 0 8px #03a9f4);
  }

  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #000;

  .search-toggle-btn {
    position: absolute;
    top: 60px; // Initial position
    left: 10px;
    z-index: 20;
    background: rgba(10, 15, 30, 0.7);
    border: 1px solid #4a4a4a;
    color: #e0e0e0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
  }

  .search-panel {
    position: absolute;
    top: 50px;
    left: 10px;
    z-index: 20;
    background: rgba(10, 15, 30, 0.8);
    border: 1px solid #4a4a4a;
    border-radius: 8px;
    padding: 15px;
    width: 280px;

    input {
      width: 100%;
      box-sizing: border-box;
      background-color: rgba(0, 0, 0, 0.5);
      border: 1px solid #4a4a4a;
      color: #e0e0e0;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 10px;
    }

    .search-results {
      list-style: none;
      padding: 0;
      margin: 0;
      max-height: 300px;
      overflow-y: auto;
      li {
        padding: 8px 12px;
        cursor: pointer;
        color: #ccc;
        font-size: 13px;
        border-radius: 4px;
        &:hover {
          background-color: #333;
          color: #fff;
        }
      }
    }
  }

  .map-svg {
    width: 100%;
    height: 100%;
    background-color: transparent;
  }
}
</style>
