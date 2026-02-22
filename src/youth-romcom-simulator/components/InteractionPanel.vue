<template>
  <div class="interaction-panel">
    <button id="btn-inventory" class="interaction-btn" @click="$emit('showInventory')">背包</button>
    <button id="btn-command-center" class="interaction-btn" @click="$emit('showCommandCenter')">指令中心</button>
    <button id="btn-show-extracted" class="interaction-btn" @click="$emit('showExtracted')">查看提取内容</button>
    <button id="btn-save-load-manager" class="interaction-btn" @click="$emit('showSaveLoad')">存档/读档</button>
    <!-- 新增：统一的世界书控制模块 -->
    <div id="world-book-controls" class="panel-section">
      <div class="section-title">世界书控制</div>
      <div class="world-book-controls-content">
        <div class="world-book-control-row">
          <label for="unified-index-input" class="world-book-label">读写序号:</label>
          <input type="number" id="unified-index-input" class="world-book-input" value="1" min="1" />
        </div>
        <div class="world-book-control-row">
          <input type="checkbox" id="auto-toggle-lorebook-checkbox" style="cursor: pointer" />
          <label for="auto-toggle-lorebook-checkbox" class="auto-write-label">自动开关世界书</label>
        </div>
      </div>
    </div>
    <!-- 时间线按钮已移至存档界面 -->
    <div class="world-line-section">
      <div class="world-line-title">历史记录</div>
      <div class="history-buttons-container">
        <button id="btn-view-campus-log" class="interaction-btn primary-btn btn-view-campus-log">
          校园日志
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits(['showInventory', 'showCommandCenter', 'showExtracted', 'showSaveLoad']);
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '../styles/main.scss' as *;

.interaction-panel {
  border-left: 1px solid $theme-border-color;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: $theme-secondary-bg;
  padding: 15px;
  overflow-y: auto;
  box-shadow: inset 0 0 10px rgba($charcoal-blue, 0.03);
}

.interaction-btn {
  padding: 10px 15px;
  background-image: linear-gradient(to bottom, #ffffff, #f7f7f7);
  border: 1px solid $steel-gray;
  border-radius: 6px;
  color: $theme-primary-text;
  font-size: 13px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &:hover {
    border-color: $royal-blue;
    color: $royal-blue;
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba($royal-blue, 0.15);
  }
  &.primary-btn {
    background-image: linear-gradient(to bottom, $campus-blue, color.scale($campus-blue, $lightness: -8%));
    border-color: color.scale($campus-blue, $lightness: -10%);
    color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    &:hover {
      background-image: linear-gradient(to bottom, color.scale($campus-blue, $lightness: 5%), $campus-blue);
      border-color: color.scale($campus-blue, $lightness: -5%);
      box-shadow: 0 3px 8px rgba($campus-blue, 0.25);
    }
  }
}

.panel-section {
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid $theme-border-color;
  box-shadow: 0 2px 8px rgba($charcoal-blue, 0.05);
  transition: box-shadow 0.3s ease;
  &:hover {
    box-shadow: 0 4px 12px rgba($charcoal-blue, 0.08);
  }
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: $theme-primary-text;
  margin-bottom: 12px;
  text-align: left;
  border-bottom: 2px solid $royal-blue;
  padding-bottom: 8px;
  display: inline-block;
}

// World Book & World Line specific styles
.world-book-controls-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.world-book-control-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.world-book-label,
.auto-write-label {
  font-size: 13px;
  color: $theme-secondary-text;
}
.world-book-input {
  width: 60px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid $steel-gray;
}

.world-line-section {
  margin-top: auto; // Pushes to the bottom
  padding-top: 15px;
  border-top: 1px dashed $divider-color;
}
.world-line-title {
  font-size: 14px;
  font-weight: 600;
  color: $theme-secondary-text;
  margin-bottom: 10px;
  text-align: center;
}
.history-buttons-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>