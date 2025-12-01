<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <h3>管理开局方案</h3>
      
      <div class="preset-list">
        <div v-for="preset in presets" :key="preset.name" class="preset-item">
          <span class="preset-name">{{ preset.name }}</span>
          <div class="preset-actions">
            <button @click="load(preset)">加载</button>
            <button @click="exportPreset(preset)">导出</button>
            <button class="delete" @click="remove(preset.name)">删除</button>
          </div>
        </div>
        <p v-if="presets.length === 0" class="no-presets">暂无任何方案。</p>
      </div>

      <div class="save-section">
        <input type="text" v-model="newPresetName" placeholder="输入新方案名称..." />
        <button @click="save">保存当前选择</button>
      </div>

      <div class="import-section">
        <button @click="triggerImport">导入方案文件</button>
        <input type="file" ref="fileInput" @change="handleFileUpload" accept=".json" style="display: none;" />
      </div>

      <button class="close-btn" @click="close">关闭</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import * as PresetService from '../services/PresetService';

const props = defineProps({
  show: Boolean,
});

const emit = defineEmits(['close']);

const presets = ref([]);
const newPresetName = ref('');
const fileInput = ref(null);

const refreshPresets = () => {
  presets.value = PresetService.getPresets();
};

const save = () => {
  PresetService.savePreset(newPresetName.value);
  newPresetName.value = '';
  refreshPresets();
};

const load = (preset) => {
  PresetService.loadPreset(preset);
  close();
};

const remove = (name) => {
  if (confirm(`确定要删除方案 "${name}" 吗？此操作不可撤销。`)) {
    PresetService.deletePreset(name);
    refreshPresets();
  }
};

const exportPreset = (preset) => {
  PresetService.exportPreset(preset);
};

const triggerImport = () => {
  fileInput.value.click();
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    await PresetService.importPreset(file);
    refreshPresets();
  }
};

const close = () => {
  emit('close');
};

watch(() => props.show, (newVal) => {
  if (newVal) {
    refreshPresets();
  }
});

onMounted(refreshPresets);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-indigo-deep);
  padding: 2rem 3rem;
  border-radius: 12px;
  border: 1px solid rgba(212, 175, 55, 0.3);
  width: 90vw;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

h3 {
  font-family: var(--font-family-title);
  text-align: center;
  color: var(--color-gold-pale);
  font-size: 1.8rem;
  margin: 0 0 1rem;
}

.preset-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  padding: 1rem;
  background: var(--color-black-void);
}

.preset-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 0;
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}
.preset-item:last-child {
  border-bottom: none;
}

.preset-name {
  font-weight: bold;
  color: var(--color-white-moon);
}

.preset-actions button {
  margin-left: 0.5rem;
  padding: 0.3rem 0.8rem;
  font-size: 0.9rem;
  background: var(--color-cyan-tian);
  color: var(--color-black-void);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.preset-actions button.delete {
  background: var(--color-red-chi);
}

.no-presets {
  text-align: center;
  color: var(--color-grey-stone);
  padding: 2rem 0;
}

.save-section, .import-section {
  display: flex;
  gap: 1rem;
}

.save-section input {
  flex-grow: 1;
  background: var(--color-black-void);
  border: 1px solid var(--color-gold-liu);
  color: var(--color-white-moon);
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

.save-section button, .import-section button {
  padding: 0.5rem 1.5rem;
  background: var(--color-gold-liu);
  color: var(--color-black-void);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.close-btn {
  margin-top: 1rem;
  padding: 0.8rem;
  background: transparent;
  border: 1px solid var(--color-grey-stone);
  color: var(--color-grey-stone);
  border-radius: 4px;
  cursor: pointer;
}
.close-btn:hover {
  background: rgba(160, 160, 160, 0.1);
  color: var(--color-white-moon);
}
</style>