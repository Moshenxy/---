<template>
  <div class="panel-wrapper tasks-panel-starmap">
    <div v-if="destiny" class="starmap-container">
      <svg class="starmap-svg">
        <defs>
          <linearGradient id="grad-triggered" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: rgba(0, 255, 255, 0.8)" />
            <stop offset="100%" style="stop-color: rgba(138, 43, 226, 0.8)" />
          </linearGradient>
        </defs>
        <!-- 星轨 -->
        <path v-for="path in starPaths" :key="path.d" :d="path.d" :class="path.class" />
      </svg>

      <!-- 终极任务 (帝星) -->
      <div
        v-if="ultimateTask"
        class="star-node ultimate-star"
        :style="getStarPosition(0)"
        @click="selectNode(ultimateTask, 'ultimate', $event)"
      >
        <div class="star-core"></div>
        <div class="star-label">终极宿命</div>
      </div>

      <!-- 命运节点 (星宿) -->
      <div
        v-for="(node, index) in destinyNodes"
        :key="node.ID"
        class="star-node destiny-star"
        :class="{ triggered: node.状态 === '完成' }"
        :style="getStarPosition(index + 1)"
        @click="selectNode(node, 'destiny', $event)"
      >
        <div class="star-core"></div>
        <div class="star-label">{{ node.名称 }}</div>
      </div>

      <!-- 衍生任务 (流星) -->
      <div
        v-for="(task, index) in derivedTasks"
        :key="task.ID"
        class="star-node derived-star"
        :style="getDerivedStarPosition(task, index)"
        @click="selectNode(task, 'derived', $event)"
      >
        <div class="star-core"></div>
      </div>

      <!-- 详情弹窗 -->
      <div v-if="selectedNode" class="node-detail-modal" :style="detailModalStyle">
        <h4 class="detail-title" @mousedown="startDrag">{{ selectedNode.data.名称 }}</h4>
        <p class="detail-desc">{{ selectedNode.data.描述 }}</p>
        <div class="detail-meta">
          <p v-if="selectedNode.data.状态"><strong>状态:</strong> {{ selectedNode.data.状态 }}</p>
          <p v-if="selectedNode.data.目标"><strong>目标:</strong> {{ selectedNode.data.目标 }}</p>
          <p v-if="selectedNode.data.前置任务ID">
            <strong>前置:</strong> {{ getTaskNameById(selectedNode.data.前置任务ID) }}
          </p>
          <p v-if="selectedNode.type === 'ultimate' && selectedNode.data.完成条件">
            <strong>完成条件:</strong> {{ selectedNode.data.完成条件.join(', ') }}
          </p>
        </div>
        <button class="close-button" @click="selectedNode = null">×</button>
      </div>
    </div>
    <div v-else class="no-data">
      <p>{{ currentAvatar ? '当前化身没有宿命任务。' : '当前没有激活的化身。' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { get } from 'lodash';
import { computed, reactive, ref } from 'vue';
import { currentAvatar } from '../../../store/getters';
import type { DestinyNode, Task } from '../../../types';

type SelectedNode = {
  data: any;
  type: 'ultimate' | 'destiny' | 'derived';
  el: HTMLElement;
};

const destiny = computed(() => get(currentAvatar.value, '本世宿命', null));

// [Roo-Fix] 恢复并增强 getItemsArray 以兼容多种数据格式
const getItemsArray = (data: any[] | undefined) => {
  if (!Array.isArray(data)) {
    return [];
  }
  // 兼容 [ [items], "desc" ] 或 [ [items] ]
  if (Array.isArray(data[0])) {
    return data[0];
  }
  // 兼容 [items] (虽然不常见，但作为兜底)
  return data;
};

const allTasks = computed<Task[]>(() => {
  if (!destiny.value) return [];
  const taskObject = get(destiny.value, '宿命之网', {});
  return Object.values(taskObject);
});

const ultimateTask = computed(() => {
  if (!destiny.value) return null;
  return get(destiny.value, '终极任务', null);
});

const destinyNodes = computed<DestinyNode[]>(() => {
  return allTasks.value.filter(task => task.类型 === '命运节点') as DestinyNode[];
});

const derivedTasks = computed<Task[]>(() => {
  return allTasks.value.filter(task => task.类型 === '衍生任务');
});

const selectedNode = ref<SelectedNode | null>(null);
const detailModalStyle = reactive({ top: '0px', left: '0px', transform: 'translate(-50%, -50%)' });

const getTaskNameById = (taskId: string) => {
  if (!taskId) return '无';
  const task = allTasks.value.find(t => t.ID === taskId);
  return task ? task.名称 : taskId;
};

const starPositions = computed(() => {
  const positions: { top: string; left: string }[] = [];
  const totalNodes = destinyNodes.value.length;

  positions.push({ top: '15%', left: '50%' });

  const startY = 85;
  const endY = 30;

  destinyNodes.value.forEach((_, i) => {
    const progress = totalNodes > 1 ? i / (totalNodes - 1) : 0.5;
    const y = startY - (startY - endY) * progress;
    const x = 50 + 20 * Math.sin(progress * Math.PI * 2);
    positions.push({ top: `${y}%`, left: `${x}%` });
  });

  return positions;
});

const starPaths = computed(() => {
  if (starPositions.value.length <= 1) return [];
  const paths: { d: string; class: string }[] = [];

  for (let i = 0; i < destinyNodes.value.length - 1; i++) {
    const startPos = starPositions.value[i + 1];
    const endPos = starPositions.value[i + 2];

    const d = `M ${parseFloat(startPos.left)} ${parseFloat(startPos.top)} Q ${(parseFloat(startPos.left) + parseFloat(endPos.left)) / 2} ${(parseFloat(startPos.top) + parseFloat(endPos.top)) / 2} ${parseFloat(endPos.left)} ${parseFloat(endPos.top)}`;

    paths.push({
      d,
      class: destinyNodes.value[i + 1].状态 === '完成' ? 'star-path triggered' : 'star-path',
    });
  }

  if (destinyNodes.value.length > 0) {
    const lastNodePos = starPositions.value[destinyNodes.value.length];
    const ultimatePos = starPositions.value[0];
    const d = `M ${parseFloat(lastNodePos.left)} ${parseFloat(lastNodePos.top)} Q ${(parseFloat(lastNodePos.left) + parseFloat(ultimatePos.left)) / 2} ${(parseFloat(lastNodePos.top) + parseFloat(ultimatePos.top)) / 2} ${parseFloat(ultimatePos.left)} ${parseFloat(ultimatePos.top)}`;
    paths.push({
      d,
      class: destinyNodes.value[destinyNodes.value.length - 1].状态 === '完成' ? 'star-path triggered' : 'star-path',
    });
  }

  derivedTasks.value.forEach((task, index) => {
    const parentNode = destinyNodes.value.find(n => n.ID === task.前置任务ID);
    if (parentNode) {
      const parentNodeIndex = destinyNodes.value.indexOf(parentNode);
      const parentPos = starPositions.value[parentNodeIndex + 1];
      const taskPos = getDerivedStarPosition(task, index);
      const d = `M ${parseFloat(parentPos.left)} ${parseFloat(parentPos.top)} L ${parseFloat(taskPos.left.replace('calc(', '').replace(')', ''))} ${parseFloat(taskPos.top.replace('calc(', '').replace(')', ''))}`;
      paths.push({
        d,
        class: 'star-path derived-path',
      });
    }
  });

  return paths;
});

const getDerivedStarPosition = (task: Task, index: number) => {
  const parentNode = destinyNodes.value.find(n => n.ID === task.前置任务ID);
  if (!parentNode) return { top: '0%', left: '0%' };
  const parentNodeIndex = destinyNodes.value.indexOf(parentNode);
  const parentPos = starPositions.value[parentNodeIndex + 1];

  const offsetX = (index % 2 === 0 ? 5 : -5) * (Math.floor(index / 2) + 1);
  const offsetY = (index % 2 === 0 ? -5 : 5) * (Math.floor(index / 2) + 1);

  return {
    top: `calc(${parentPos.top} + ${offsetY}%)`,
    left: `calc(${parentPos.left} + ${offsetX}%)`,
  };
};

const selectNode = (nodeData: any, type: SelectedNode['type'], event: MouseEvent) => {
  selectedNode.value = { data: nodeData, type, el: event.currentTarget as HTMLElement };
  const starNode = event.currentTarget as HTMLElement;

  const top = `calc(${starNode.style.top} + 20px)`;
  const left = `calc(${starNode.style.left} + 20px)`;

  detailModalStyle.top = top;
  detailModalStyle.left = left;
};

const startDrag = (event: MouseEvent) => {
  const modal = (event.target as HTMLElement).closest('.node-detail-modal') as HTMLElement;
  if (!modal) return;

  const startX = event.clientX;
  const startY = event.clientY;
  const startTop = modal.offsetTop;
  const startLeft = modal.offsetLeft;

  const doDrag = (e: MouseEvent) => {
    detailModalStyle.top = `${startTop + e.clientY - startY}px`;
    detailModalStyle.left = `${startLeft + e.clientX - startX}px`;
  };

  const stopDrag = () => {
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
  };

  document.addEventListener('mousemove', doDrag);
  document.addEventListener('mouseup', stopDrag);
};

const getStarPosition = (index: number) => {
  return starPositions.value[index] || { top: '50%', left: '50%' };
};
</script>

<style lang="scss" scoped>
@use '../../../styles/theme/variables' as *;
@use '../../../styles/theme/mixins' as *;

/* ... (styles remain the same) ... */
.tasks-panel-starmap {
  height: 100%;
  position: relative;
  overflow: hidden;
  background-color: $color-black-void;
  background-image:
    radial-gradient(1px 1px at 25px 5px, white, transparent), radial-gradient(1px 1px at 50px 25px, white, transparent),
    radial-gradient(1.5px 1.5px at 100px 60px, white, transparent),
    radial-gradient(2px 2px at 150px 120px, white, transparent),
    radial-gradient(2.5px 2.5px at 200px 80px, white, transparent);
  background-size: 200px 200px;
  background-position: 0 0;
}

.starmap-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.starmap-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;

  .star-path {
    fill: none;
    stroke: rgba($color-grey-stone, 0.1);
    stroke-width: 1.5;
    stroke-dasharray: 3 6;
    transition: stroke 0.5s ease;

    &.triggered {
      stroke: url(#grad-triggered);
      stroke-dasharray: none;
      filter: drop-shadow(0 0 5px $color-cyan-tian);
      animation: dash 2s linear infinite;
    }
  }
}

@keyframes dash {
  to {
    stroke-dashoffset: -100;
  }
}

.star-node {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;

  .star-core {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    transition: all 0.3s ease;
    position: relative;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 60%);
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.1) inset;
  }

  .star-label {
    margin-top: 8px;
    font-size: 12px;
    color: rgba($color-grey-stone, 0.7);
    text-shadow: 0 0 5px $color-black-void;
    transition: color 0.3s ease;
  }

  &:hover {
    .star-core {
      transform: scale(1.1);
    }
    .star-label {
      color: $color-white-moon;
      text-shadow: 0 0 5px $color-white-moon;
    }
  }
}

.ultimate-star {
  .star-core {
    width: 60px;
    height: 60px;
    background:
      radial-gradient(ellipse, rgba(#ff4d4d, 0.8) 20%, rgba(#ff4d4d, 0.4) 50%, transparent 70%),
      radial-gradient(circle, rgba(#ff4d4d, 0.5) 0%, rgba(#8b0000, 0.8) 100%);
    border: 1px solid rgba(#ff4d4d, 0.8);
    --glow-color: rgba(#ff4d4d, 0.4);
    animation: pulse 4s infinite ease-in-out;
  }
  .star-label {
    font-size: 16px;
    font-weight: bold;
    color: #ff4d4d;
  }
}

.destiny-star {
  .star-core {
    width: 30px;
    height: 30px;
    background:
      radial-gradient(ellipse, rgba($color-grey-stone, 0.5) 30%, transparent 70%),
      radial-gradient(circle, rgba($color-grey-stone, 0.3) 0%, rgba($color-black-void, 0.5) 100%);
    border: 1px solid rgba($color-grey-stone, 0.5);
  }
  &.triggered .star-core {
    background:
      radial-gradient(ellipse, rgba($color-cyan-tian, 0.8) 20%, transparent 70%),
      radial-gradient(circle, rgba($color-cyan-tian, 0.6) 0%, rgba($color-indigo-deep, 0.8) 100%);
    border-color: rgba($color-cyan-tian, 0.8);
    --glow-color: rgba($color-cyan-tian, 0.4);
    animation: pulse 3s infinite ease-in-out;
  }
  &.triggered .star-label {
    color: $color-cyan-tian;
  }
}

.derived-star {
  .star-core {
    width: 10px;
    height: 10px;
    background: rgba($color-gold-liu, 0.5);
    border: 1px solid rgba($color-gold-liu, 0.7);
    box-shadow: 0 0 5px rgba($color-gold-liu, 0.5);
  }
}

.starmap-svg .derived-path {
  stroke: rgba($color-gold-liu, 0.3);
  stroke-dasharray: 2 4;
}

.node-detail-modal {
  position: absolute;
  width: 300px;
  padding: $spacing-lg;
  background: rgba($color-black-void, 0.8);
  border: 1px solid $color-gold-liu;
  border-radius: $border-radius-md;
  @include frosted-glass(rgba($color-indigo-deep, 0.8), 10px);
  z-index: 10;
  color: $color-white-moon;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);

  .detail-title {
    font-family: $font-family-title;
    color: $color-gold-pale;
    margin: 0 0 $spacing-md 0;
    cursor: move;
  }
  .detail-desc {
    font-size: $font-size-small;
    margin-bottom: $spacing-md;
  }
  .detail-meta {
    font-size: 11px;
    color: $color-grey-stone;
    font-style: italic;
    p {
      margin: 0.5em 0;
    }
    strong {
      color: $color-gold-pale;
    }
  }
  .close-button {
    position: absolute;
    top: $spacing-sm;
    right: $spacing-sm;
    background: none;
    border: none;
    color: $color-grey-stone;
    font-size: 20px;
    cursor: pointer;
    &:hover {
      color: $color-white-moon;
    }
  }
}

.no-data {
  @include flex-center;
  height: 100%;
  color: $color-grey-stone;
  font-style: italic;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 20px 5px var(--glow-color);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 35px 10px var(--glow-color);
  }
}
</style>
