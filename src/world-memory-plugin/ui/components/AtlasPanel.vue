<template>
  <div class="atlas-container" ref="container">
    <div v-if="isLoading" class="wm-placeholder">正在加载人格图谱...</div>
    <canvas v-show="!isLoading && !error" ref="canvasRef"></canvas>
    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="selectedNode" class="atlas-modal-backdrop" @click="selectedNode = null">
      <div class="atlas-modal" @click.stop>
        <div class="atlas-modal-header" ref="modalHeaderRef">
          <h4>{{ selectedNode.label }} ({{ selectedNode.type }})</h4>
          <button class="wm-btn" @click="selectedNode = null">&times;</button>
        </div>
        <div class="atlas-modal-body" ref="modalBodyRef">
          <NodeDetail :node="selectedNode" @select-node="handleNodeSelect" />
        </div>
      </div>
    </div>

    <button v-if="!isLoading && !error" @click="isTimelineVisible = !isTimelineVisible" class="timeline-toggle-btn">
      ⏳
    </button>
    <div v-if="!isLoading && !error && isTimelineVisible" class="timeline-slider-container">
      <label for="timeline-slider">时间线 (楼层): {{ timelineValue }} / {{ timelineMax }}</label>
      <input
        type="range"
        id="timeline-slider"
        min="0"
        :max="timelineMax"
        v-model.number="timelineValue"
        class="timeline-slider"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import { forceCollide, forceManyBody, forceRadial, forceSimulation } from 'd3-force-3d';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import type { GraphNode } from '../../services/GraphDataService';
import { GraphDataService } from '../../services/GraphDataService';
import NodeDetail from './NodeDetail.vue';

type D3Node = GraphNode &
  d3.SimulationNodeDatum & {
    z?: number;
    vx?: number;
    vy?: number;
    vz?: number;
    fx?: number | null;
    fy?: number | null;
    fz?: number | null;
  };

const isLoading = ref(true);
const error = ref<string | null>(null);
const container = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const selectedNode = ref<D3Node | null>(null);
const modalHeaderRef = ref<HTMLDivElement | null>(null);
const modalBodyRef = ref<HTMLDivElement | null>(null);

const timelineMax = ref(0);
const timelineValue = ref(0);
const isTimelineVisible = ref(false);

let animationFrameId: number;

const highlightState = reactive({
  active: false,
  selectedId: null as string | null,
  connectedIds: new Set<string>(),
});

const color = (d: D3Node) => ({ NATURE: '#FFD700', COGNITION: '#3498db', MEMORY: '#2ecc71' })[d.type] || '#95a5a6';

const radius = (d: D3Node) => {
  if (d.type === 'MEMORY') return 2;
  let strength = 1;
  if (d.type === 'NATURE') {
    strength = d.data.supporting_memories?.length ?? 1;
  } else if (d.type === 'COGNITION') {
    strength = d.data.supporting_memories?.length ?? 1;
  }
  return d3.scaleSqrt().domain([1, 15]).range([6, 20]).clamp(true)(strength);
};

const fullGraphData = ref<{ nodes: GraphNode[]; links: any[] }>({ nodes: [], links: [] });

const filteredGraphData = computed(() => {
  const maxFloor = timelineValue.value;
  const allNodes = fullGraphData.value.nodes;
  const allLinks = fullGraphData.value.links;

  if (!allNodes.length || maxFloor === timelineMax.value) {
    return {
      nodes: allNodes.map(d => ({ ...d })),
      links: allLinks.map(d => ({ ...d })),
    };
  }

  const visibleMemoryIds = new Set(
    allNodes.filter(n => n.type === 'MEMORY' && n.data.created_at_message_id <= maxFloor).map(n => n.id),
  );

  const visibleNodes = allNodes.filter(n => {
    if (n.type === 'MEMORY') return visibleMemoryIds.has(n.id);
    if (n.id === 'NATURE_CORE') return true;
    if (!n.data.supporting_memories || n.data.supporting_memories.length === 0) return false;
    return n.data.supporting_memories.some((memId: string) => visibleMemoryIds.has(memId));
  });

  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  const visibleLinks = allLinks.filter(
    l => visibleNodeIds.has(l.source.id ?? l.source) && visibleNodeIds.has(l.target.id ?? l.target),
  );

  return {
    nodes: visibleNodes.map(d => ({ ...d })),
    links: visibleLinks.map(d => ({ ...d })),
  };
});

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

watch(
  filteredGraphData,
  newGraphData => {
    renderGraph(newGraphData);
  },
  { deep: true },
);

function disposeScene() {
  if (scene) {
    while (scene.children.length > 0) {
      const obj = scene.children[0];
      scene.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        obj.material.dispose();
      } else if (obj instanceof THREE.Line) {
        (obj.material as THREE.Material).dispose();
        obj.geometry.dispose();
      }
    }
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
}

function renderGraph(graphData: { nodes: D3Node[]; links: any[] }) {
  disposeScene();
  if (!container.value || !canvasRef.value || !graphData.nodes.length) {
    // Clear canvas if no data
    renderer?.clear();
    return;
  }

  const nodes = graphData.nodes;
  const links = graphData.links;

  const nodeObjects: THREE.Mesh[] = [];
  nodes.forEach(node => {
    const r = radius(node);
    const geometry = new THREE.SphereGeometry(r, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: color(node) });
    const sphere = new THREE.Mesh(geometry, material);
    (sphere as any).d3_data = node;
    nodeObjects.push(sphere);
    scene.add(sphere);
  });

  // 移除连线渲染
  // const lineObjects: THREE.Line[] = [];
  // links.forEach(() => { ... });

  // const ageScale = d3.scaleLinear().domain([0, 200]).range([3, 0.5]).clamp(true);

  const simulation = forceSimulation(nodes, 3)
    // 移除 link 力
    // .force('link', forceLink(links)...)
    // 增加节点间的排斥力，让它们在球面上散开
    .force('charge', forceManyBody().strength(-100))
    // 增加碰撞力，防止节点重叠
    .force('collide', forceCollide().radius((d: any) => radius(d as D3Node) + 5).iterations(2))
    .force(
      'r',
      // 使用 d3-force-3d 的 forceRadial
      forceRadial((d: any) => {
        const node = d as D3Node;
        if (node.type === 'NATURE' && node.id !== 'NATURE_CORE') return 100; // 本性在内层
        if (node.type === 'COGNITION') return 250; // 认知在中层
        if (node.type === 'MEMORY') return 450; // 记忆在外层
        return 0; // 核心在中心
      })
      .strength(1.0) // 增强向心力，使其更严格地保持在球面上
    );

  const coreNode = nodes.find(n => n.id === 'NATURE_CORE');
  if (coreNode) {
    coreNode.fx = 0;
    coreNode.fy = 0;
    coreNode.fz = 0;
  }

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    simulation.tick();
    nodes.forEach((node, i) => {
      nodeObjects[i]?.position.set(node.x ?? 0, node.y ?? 0, (node.z ?? 0) as number);
    });
    // 移除连线动画更新
    // links.forEach((link: any, i: number) => { ... });
    controls.update();
    renderer.render(scene, camera);
  };

  animate();

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  canvasRef.value.onclick = event => {
    // Use onclick to avoid multiple listeners
    const rect = canvasRef.value!.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(nodeObjects);
    if (intersects.length > 0) {
      const clickedNode = (intersects[0].object as any).d3_data as D3Node;
      selectedNode.value = clickedNode;
    } else {
      selectedNode.value = null;
    }
  };
}

function handleNodeSelect(nodeId: string) {
  const targetNode = fullGraphData.value.nodes.find(n => n.id === nodeId);
  if (targetNode) {
    selectedNode.value = targetNode as D3Node;
  } else {
    toastr.warning('未找到该记忆节点。');
  }
}

onMounted(async () => {
  if (!container.value || !canvasRef.value) return;

  let width = container.value.clientWidth;
  let height = container.value.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1e1e1e);
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
  camera.position.z = 400;
  renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true });
  renderer.setSize(width, height);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const resizeObserver = new ResizeObserver(entries => {
    if (!container.value) return;
    const entry = entries[0];
    width = entry.contentRect.width;
    height = entry.contentRect.height;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
  resizeObserver.observe(container.value);

  onBeforeUnmount(() => {
    resizeObserver.disconnect();
    disposeScene();
  });

  try {
    const data = await GraphDataService.getGraphData();
    fullGraphData.value = data;
    const currentFloor = getChatMessages(-1)[0]?.message_id ?? 0;
    timelineMax.value = currentFloor;
    timelineValue.value = currentFloor;
    isLoading.value = false;
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载图谱数据时发生未知错误。';
    isLoading.value = false;
  }
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrameId);
});
</script>

<style>
.atlas-container {
  width: 100%;
  height: 100%;
  position: absolute; /* Take up all space of parent */
  top: 0;
  left: 0;
  overflow: hidden; /* Prevent scrollbars */
}

.atlas-container canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.atlas-modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
}

.atlas-modal {
  background: #2d2d2d;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
}

.atlas-modal-body {
  overflow-y: auto;
  padding-right: 10px; /* for scrollbar */
  flex-grow: 1;
  min-height: 0;
}

.atlas-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #444;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.atlas-modal-header h4 {
  margin: 0;
  color: #c5aeff;
}

.atlas-modal-header .wm-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
}
.timeline-toggle-btn {
  position: absolute;
  top: 15px;
  left: 15px;
  z-index: 10;
  appearance: none;
  border: none;
  background: rgba(45, 45, 45, 0.8);
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.timeline-toggle-btn:hover {
  background: rgba(60, 60, 60, 0.9);
}

.timeline-slider-container {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 600px;
  background: rgba(45, 45, 45, 0.8);
  border-radius: 12px;
  padding: 10px 20px;
  color: #fff;
  text-align: center;
  font-size: 14px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.timeline-slider {
  width: 100%;
  margin-top: 5px;
}
</style>
