<template>
  <div class="node-detail-panel" ref="panelRef">
    <div class="panel-header">
      <h3>{{ node?.name || '详情' }}</h3>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>
    <div class="panel-content">
      <div v-if="node">
        <!-- 类型 -->
        <div class="section">
          <p><strong>类型:</strong> {{ node.type }}</p>
          <p v-if="node.data.面积"><strong>面积:</strong> {{ node.data.面积[0] }} {{ node.data.面积[1] }}</p>
        </div>

        <!-- 描述 -->
        <div class="section" v-if="node.data.描述">
          <h4 class="section-title">描述</h4>
          <pre>{{ node.data.描述 }}</pre>
        </div>

        <!-- 子节点 -->
        <div class="section" v-if="children.length > 0">
          <h4 class="section-title">子节点 ({{ children.length }})</h4>
          <ul class="item-list">
            <li v-for="child in children" :key="child.id" class="interactive list-item" @click="onNavigate(child)">
              {{ child.name }} ({{ child.type }})
            </li>
          </ul>
        </div>

        <!-- 关联资源 -->
        <div class="section" v-if="associatedResources.length > 0">
          <h4 class="section-title">关联资源</h4>
          <ul class="item-list">
            <li v-for="resource in associatedResources" :key="resource.ID" class="list-item">
              {{ resource.名称 }}
              <span class="rarity" :class="`rarity-${resource.稀有度}`">[{{ resource.稀有度 }}]</span>
            </li>
          </ul>
        </div>

        <!-- 盘踞势力 (暂未实现) -->
        <div class="section" v-if="associatedFactions.length > 0">
          <h4 class="section-title">盘踞势力</h4>
          <ul class="item-list">
            <li v-for="faction in associatedFactions" :key="faction.ID" class="list-item">
              {{ faction.名称 }} ({{ faction.类型 }})
            </li>
          </ul>
        </div>
      </div>
      <div v-else>
        <p>没有选中的节点。</p>
      </div>
    </div>
    <div class="resize-handle top" data-direction="top"></div>
    <div class="resize-handle right" data-direction="right"></div>
    <div class="resize-handle bottom" data-direction="bottom"></div>
    <div class="resize-handle left" data-direction="left"></div>
    <div class="resize-handle top-left" data-direction="top-left"></div>
    <div class="resize-handle top-right" data-direction="top-right"></div>
    <div class="resize-handle bottom-left" data-direction="bottom-left"></div>
    <div class="resize-handle bottom-right" data-direction="bottom-right"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, type PropType } from 'vue';
import { mapActions, mapState } from '../store/mapState';
import type { Faction, MapNode, Resource } from '../types';

const props = defineProps({
  node: {
    type: Object as PropType<MapNode | null>,
    default: null,
  },
});

defineEmits(['close']);

const onNavigate = (node: MapNode) => {
  if (node.childCount > 0) {
    mapActions.navigateToNode(node);
  }
};

const children = computed((): MapNode[] => {
  return props.node?.children || [];
});

const associatedResources = computed((): Resource[] => {
  if (!props.node || !mapState.worldData?.内容?.资源) {
    return [];
  }
  const resources = mapState.worldData.内容.资源;
  // 确保资源是一个数组
  const resourcesArray = Array.isArray(resources) ? resources : [];
  return resourcesArray.filter((resource: Resource) => resource.所属实体ID === props.node?.id);
});

const associatedFactions = computed((): Faction[] => {
  // @TODO: 势力与空间实体的关联逻辑需要根据世界书规则确定
  if (!props.node || !mapState.worldData?.内容?.文明?.势力) {
    return [];
  }

  const factionsSource = mapState.worldData.内容.文明.势力;
  // 兼容势力数据源既可能是数组也可能是对象的情况
  const factionsArray = Array.isArray(factionsSource)
    ? factionsSource
    : Object.values(factionsSource);

  // 临时逻辑：如果势力的核心目标或描述中包含地名，则认为其关联
  const filtered = factionsArray.filter(faction => {
    // 添加一个健壮性检查，防止faction不是一个有效的对象
    if (!faction || typeof faction !== 'object') return false;
    const factionDataString = JSON.stringify(faction);
    return factionDataString.includes(props.node!.name);
  });

  return filtered;
});

const panelRef = ref<HTMLElement | null>(null);
onMounted(() => {
  const panel = panelRef.value;
  if (!panel) return;
  const header = panel.querySelector('.panel-header') as HTMLElement;

  // --- 拖动逻辑 ---
  header.addEventListener('mousedown', (e: MouseEvent) => {
    let isDragging = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = panel.offsetLeft;
    const startTop = panel.offsetTop;

    const onDragMove = (moveEvent: MouseEvent) => {
      if (!isDragging) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      panel.style.left = `${startLeft + dx}px`;
      panel.style.top = `${startTop + dy}px`;
    };

    const onDragEnd = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
    };

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
  });

  // --- 缩放逻辑 ---
  const handles = panel.querySelectorAll<HTMLElement>('.resize-handle');
  handles.forEach(handle => {
    handle.addEventListener('mousedown', (e: MouseEvent) => {
      e.stopPropagation();
      const direction = handle.dataset.direction;
      if (!direction) return;

      let isResizing = true;
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = panel.offsetWidth;
      const startHeight = panel.offsetHeight;
      const startLeft = panel.offsetLeft;
      const startTop = panel.offsetTop;

      const onResizeMove = (moveEvent: MouseEvent) => {
        if (!isResizing) return;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        if (direction.includes('right')) {
          panel.style.width = `${startWidth + dx}px`;
        }
        if (direction.includes('bottom')) {
          panel.style.height = `${startHeight + dy}px`;
        }
        if (direction.includes('left')) {
          panel.style.width = `${startWidth - dx}px`;
          panel.style.left = `${startLeft + dx}px`;
        }
        if (direction.includes('top')) {
          panel.style.height = `${startHeight - dy}px`;
          panel.style.top = `${startTop + dy}px`;
        }
      };

      const onResizeEnd = () => {
        isResizing = false;
        document.removeEventListener('mousemove', onResizeMove);
        document.removeEventListener('mouseup', onResizeEnd);
      };

      document.addEventListener('mousemove', onResizeMove);
      document.addEventListener('mouseup', onResizeEnd);
    });
  });
});
</script>

<style lang="scss" scoped>
// 使用与原文件一致的、不依赖外部主题的普通样式
.node-detail-panel {
  position: absolute;
  top: 50px;
  right: 10px;
  width: 320px; // 稍微加宽以容纳更多信息
  max-height: 85vh;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  display: flex;
  flex-direction: column;
  color: #333;
  resize: both; // 允许用户在支持的浏览器中调整大小
  overflow: hidden; // 配合resize
}

.resize-handle {
  position: absolute;
  background: transparent;
  z-index: 10;
}
.resize-handle.top { top: -5px; left: 0; right: 0; height: 10px; cursor: ns-resize; }
.resize-handle.right { top: 0; right: -5px; bottom: 0; width: 10px; cursor: ew-resize; }
.resize-handle.bottom { bottom: -5px; left: 0; right: 0; height: 10px; cursor: ns-resize; }
.resize-handle.left { top: 0; left: -5px; bottom: 0; width: 10px; cursor: ew-resize; }
.resize-handle.top-left { top: -5px; left: -5px; width: 10px; height: 10px; cursor: nwse-resize; }
.resize-handle.top-right { top: -5px; right: -5px; width: 10px; height: 10px; cursor: nesw-resize; }
.resize-handle.bottom-left { bottom: -5px; left: -5px; width: 10px; height: 10px; cursor: nesw-resize; }
.resize-handle.bottom-right { bottom: -5px; right: -5px; width: 10px; height: 10px; cursor: nwse-resize; }

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
  cursor: move; // 添加拖拽手势

  &.dragging {
    background-color: #f5f5f5;
  }

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #999;
    &:hover {
      color: #333;
    }
  }
}

.panel-content {
  padding: 5px 15px 15px 15px;
  overflow-y: auto;
  font-size: 14px;

  p {
    margin: 0 0 10px;
  }

  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    background-color: #f5f5f5;
    padding: 10px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 13px;
    color: #555;
  }
}

.section {
  margin-top: 15px;
  border-top: 1px solid #f0f0f0;
  padding-top: 15px;

  &:first-child {
    margin-top: 0;
    border-top: none;
    padding-top: 5px;
  }
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 10px 0;
  color: #000;
}

.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 150px; // 限制列表高度
  overflow-y: auto;

  .list-item {
    padding: 6px 8px;
    border-radius: 4px;
    margin-bottom: 4px;
    background-color: #fafafa;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &.interactive {
      cursor: pointer;
      &:hover {
        background-color: #e9e9e9;
      }
    }
  }
}

.rarity {
  font-size: 12px;
  font-weight: bold;
  padding: 2px 5px;
  border-radius: 3px;
  color: white;

  // 定义一些基础的稀有度颜色
  &-常见 {
    background-color: #a0a0a0;
  }
  &-稀有 {
    background-color: #4caf50;
  }
  &-传说 {
    background-color: #ff9800;
  }
  &-史诗 {
    background-color: #9c27b0;
  }
  &-神话 {
    background-color: #f44336;
  }
}
</style>
