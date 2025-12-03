<template>
  <div class="save-load-panel">
    <div class="panel-header">
      <h2 class="panel-title">游戏存档</h2>
      <div class="header-actions">
        <button @click="importSave" class="header-btn">导入</button>
        <button @click="exportSave" class="header-btn">导出</button>
      </div>
    </div>

    <div class="save-slots-container">
      <div class="slot-group">
        <h3 class="group-title">手动存档</h3>
        <div v-for="slot in manualSlots" :key="slot.id" class="save-slot">
          <div class="slot-info">
            <span class="slot-name">{{ slot.name }}</span>
            <span class="slot-timestamp">{{ slot.timestamp ? formatTimestamp(slot.timestamp) : '空槽位' }}</span>
            <div v-if="slot.worldLogDate || slot.worldLogTitle" class="slot-world-log">
              <span class="log-date">{{ slot.worldLogDate }}</span>
              <span class="log-title">{{ slot.worldLogTitle }}</span>
            </div>
          </div>
          <div class="slot-actions">
            <button @click="saveGame(slot.id)" class="action-btn save-btn">保存</button>
            <button @click="loadGame(slot)" :disabled="!slot.data" class="action-btn load-btn">读取</button>
            <button @click="deleteSave(slot)" :disabled="!slot.data" class="action-btn delete-btn">删除</button>
          </div>
        </div>
      </div>

      <div class="slot-group">
        <h3 class="group-title">自动存档</h3>
        <div v-for="slot in autoSlots" :key="slot.id" class="save-slot auto-slot">
          <div class="slot-info">
            <span class="slot-name">{{ slot.name }}</span>
            <span class="slot-timestamp">{{ slot.timestamp ? formatTimestamp(slot.timestamp) : '空槽位' }}</span>
            <div v-if="slot.worldLogDate || slot.worldLogTitle" class="slot-world-log">
              <span class="log-date">{{ slot.worldLogDate }}</span>
              <span class="log-title">{{ slot.worldLogTitle }}</span>
            </div>
          </div>
          <div class="slot-actions">
            <button @click="loadGame(slot)" :disabled="!slot.data" class="action-btn load-btn">读取</button>
          </div>
        </div>
        <div class="auto-save-toggle">
          <label>
            <input type="checkbox" v-model="isAutoSaveEnabled" @change="toggleAutoSave" />
            开启自动存档
          </label>
        </div>
      </div>
    </div>
    <input type="file" ref="fileInput" @change="handleFileImport" style="display: none" accept=".json" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { saveLoadService, SaveSlot } from '../../services/saveLoadService';
import * as toastr from 'toastr';

export default defineComponent({
  name: 'SaveLoadPanel',
  setup() {
    const manualSlots = ref<SaveSlot[]>([]);
    const autoSlots = ref<SaveSlot[]>([]);
    const isAutoSaveEnabled = ref(true);
    const fileInput = ref<HTMLInputElement | null>(null);

    const loadSlots = async () => {
      await saveLoadService.loadAllSaveSlots();
      manualSlots.value = [...saveLoadService.manualSlots];
      autoSlots.value = [...saveLoadService.autoSlots];
    };

    onMounted(() => {
      loadSlots();
      isAutoSaveEnabled.value = saveLoadService.isAutoSaveEnabled;
    });

    const formatTimestamp = (timestamp: string) => {
      return new Date(timestamp).toLocaleString('zh-CN', { hour12: false });
    };

    const saveGame = async (slotId: string) => {
      await saveLoadService.saveGame(slotId);
      await loadSlots();
    };

    const loadGame = async (slot: SaveSlot) => {
      await saveLoadService.loadGame(slot);
    };

    const deleteSave = async (slot: SaveSlot) => {
      await saveLoadService.deleteSave(slot);
      await loadSlots();
    };

    const toggleAutoSave = () => {
      saveLoadService.toggleAutoSave(isAutoSaveEnabled.value);
    };

    const importSave = () => {
      fileInput.value?.click();
    };

    const handleFileImport = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        const reader = new FileReader();
        reader.onload = async e => {
          try {
            const content = e.target?.result as string;
            await saveLoadService.importSave(content);
            await loadSlots();
          } catch (error) {
            toastr.error('导入存档失败，文件格式可能不正确。');
            console.error(error);
          }
        };
        reader.readAsText(file);
        target.value = ''; // Reset input
      }
    };

    const exportSave = async () => {
      // For simplicity, we'll export the first manual save slot with data
      const slotToExport = manualSlots.value.find(slot => slot.data);
      if (!slotToExport) {
        toastr.warning('没有可导出的存档。');
        return;
      }
      saveLoadService.exportSave(slotToExport);
    };

    return {
      manualSlots,
      autoSlots,
      isAutoSaveEnabled,
      fileInput,
      formatTimestamp,
      saveGame,
      loadGame,
      deleteSave,
      toggleAutoSave,
      importSave,
      handleFileImport,
      exportSave,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.save-load-panel {
  background-color: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  height: 100%;
  border: none;
  border-radius: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba($color-gold-liu, 0.3);
  padding-bottom: $spacing-md;
}

.panel-title {
  color: $color-gold-pale;
  font-family: $font-family-title;
  font-size: $font-size-h2;
}

.header-actions {
  display: flex;
  gap: $spacing-md;
}

.header-btn {
  @include button-primary;
  padding: $spacing-sm $spacing-lg;
}

.save-slots-container {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.slot-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.group-title {
  color: $color-white-moon;
  font-family: $font-family-main;
  font-size: $font-size-large;
  font-weight: bold;
  border-bottom: 1px solid rgba($color-gold-liu, 0.2);
  padding-bottom: $spacing-sm;
  margin-bottom: $spacing-sm;
}

.save-slot {
  @include frosted-glass(rgba($color-charcoal-glass, 0.6), 10px);
  border: 1px solid rgba($color-gold-liu, 0.2);
  border-radius: $border-radius-sm;
  padding: $spacing-md;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: rgba($color-gold-liu, 0.05);
    border-color: rgba($color-gold-liu, 0.4);
  }
}

.slot-info {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.slot-name {
  color: $color-white-moon;
  font-weight: bold;
}

.slot-timestamp {
  color: $color-grey-stone;
  font-size: $font-size-small;
}

.slot-world-log {
  margin-top: $spacing-xs;
  padding-top: $spacing-xs;
  border-top: 1px solid rgba($color-gold-liu, 0.1);
  font-size: $font-size-small;
  color: $color-grey-stone;

  .log-date {
    font-style: italic;
  }

  .log-title {
    display: block;
    margin-top: 2px;
    color: $color-white-moon;
    font-weight: 500;
  }
}

.slot-actions {
  display: flex;
  gap: $spacing-sm;
}

.action-btn {
  @include button-secondary;
  padding: $spacing-xs $spacing-md;
  font-size: $font-size-small;

  &.delete-btn {
    border-color: rgba($color-red-chi, 0.6);
    color: rgba($color-red-chi, 0.8);

    &:hover:not(:disabled) {
      background-color: rgba($color-red-chi, 0.15);
      border-color: $color-red-chi;
      color: $color-red-chi;
    }
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    border-color: $color-grey-stone;
    color: $color-grey-stone;
  }
}

.auto-save-toggle {
  margin-top: $spacing-md;
  color: $color-white-moon;

  label {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    cursor: pointer;
  }
}
</style>
