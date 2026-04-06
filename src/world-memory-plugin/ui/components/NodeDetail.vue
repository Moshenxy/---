<template>
  <div class="node-detail">
    <!-- Nature Trait -->
    <div v-if="props.node.type === 'NATURE'">
      <div class="detail-section">
        <div class="detail-header">
          <h5>描述</h5>
          <button
            v-if="!editing.active && props.node.id !== 'NATURE_CORE'"
            @click="startEdit('description', props.node.data.description)"
            class="edit-btn"
          >
            ✎
          </button>
        </div>
        <p v-if="!editing.active || editing.field !== 'description'">{{ props.node.data.description }}</p>
        <div v-if="editing.active && editing.field === 'description'" class="edit-area">
          <textarea v-model="editing.text" class="wm-textarea"></textarea>
          <div class="edit-controls">
            <button class="wm-save-btn small" @click="saveEdit">保存</button>
            <button class="wm-btn small" @click="cancelEdit">取消</button>
          </div>
        </div>
      </div>
      <div v-if="props.node.data.evolution && props.node.data.evolution.length > 0" class="detail-section">
        <h5>演化历史</h5>
        <ul class="evolution-list">
          <li v-for="(evo, i) in props.node.data.evolution.slice().reverse()" :key="i">
            <p class="time">{{ evo.timestamp }}</p>
            <p><strong>原因:</strong> {{ evo.reason }}</p>
            <p><strong>新描述:</strong> {{ evo.new_description }}</p>
          </li>
        </ul>
      </div>
    </div>

    <!-- Cognition -->
    <div v-else-if="props.node.type === 'COGNITION'">
      <div class="detail-section">
        <div class="detail-header">
          <h5>认知内容</h5>
          <button v-if="!editing.active" @click="startEdit('statement', props.node.data.statement)" class="edit-btn">
            ✎
          </button>
        </div>
        <p v-if="!editing.active || editing.field !== 'statement'">{{ props.node.data.statement }}</p>
        <div v-if="editing.active && editing.field === 'statement'" class="edit-area">
          <textarea v-model="editing.text" class="wm-textarea"></textarea>
          <div class="edit-controls">
            <button class="wm-save-btn small" @click="saveEdit">保存</button>
            <button class="wm-btn small" @click="cancelEdit">取消</button>
          </div>
        </div>
        <p class="time">{{ props.node.data.timestamp }}</p>
      </div>
    </div>

    <!-- Episodic Memory -->
    <div v-else-if="props.node.type === 'MEMORY'">
      <div class="detail-section">
        <div class="detail-header">
          <h5>摘要</h5>
          <button
            v-if="!editing.active"
            @click="startEdit('summary_text', props.node.data.summary.text)"
            class="edit-btn"
          >
            ✎
          </button>
        </div>
        <p v-if="!editing.active || editing.field !== 'summary_text'">{{ props.node.data.summary.text }}</p>
        <div v-if="editing.active && editing.field === 'summary_text'" class="edit-area">
          <textarea v-model="editing.text" class="wm-textarea"></textarea>
          <div class="edit-controls">
            <button class="wm-save-btn small" @click="saveEdit">保存</button>
            <button class="wm-btn small" @click="cancelEdit">取消</button>
          </div>
        </div>
      </div>
      <div class="detail-section">
        <div class="detail-header">
          <h5>闪光灯碎片</h5>
        </div>
        <ul class="flashbulb-list">
          <li>
            <strong>视觉:</strong>
            <span v-if="!editing.active || editing.field !== 'visual'">{{
              props.node.data.flashbulb_fragments.visual
            }}</span>
            <button
              v-if="!editing.active"
              @click="startEdit('visual', props.node.data.flashbulb_fragments.visual)"
              class="edit-btn small-edit"
            >
              ✎
            </button>
            <div v-if="editing.active && editing.field === 'visual'" class="edit-area inline">
              <input type="text" v-model="editing.text" class="wm-input" />
              <button class="wm-save-btn small" @click="saveEdit">保存</button>
              <button class="wm-btn small" @click="cancelEdit">取消</button>
            </div>
          </li>
          <li>
            <strong>听觉:</strong>
            <span v-if="!editing.active || editing.field !== 'auditory'">{{
              props.node.data.flashbulb_fragments.auditory
            }}</span>
            <button
              v-if="!editing.active"
              @click="startEdit('auditory', props.node.data.flashbulb_fragments.auditory)"
              class="edit-btn small-edit"
            >
              ✎
            </button>
            <div v-if="editing.active && editing.field === 'auditory'" class="edit-area inline">
              <input type="text" v-model="editing.text" class="wm-input" />
              <button class="wm-save-btn small" @click="saveEdit">保存</button>
              <button class="wm-btn small" @click="cancelEdit">取消</button>
            </div>
          </li>
          <li>
            <strong>体感:</strong>
            <span v-if="!editing.active || editing.field !== 'somatic'">{{
              props.node.data.flashbulb_fragments.somatic
            }}</span>
            <button
              v-if="!editing.active"
              @click="startEdit('somatic', props.node.data.flashbulb_fragments.somatic)"
              class="edit-btn small-edit"
            >
              ✎
            </button>
            <div v-if="editing.active && editing.field === 'somatic'" class="edit-area inline">
              <input type="text" v-model="editing.text" class="wm-input" />
              <button class="wm-save-btn small" @click="saveEdit">保存</button>
              <button class="wm-btn small" @click="cancelEdit">取消</button>
            </div>
          </li>
        </ul>
      </div>
      <div class="detail-section">
        <div class="detail-header">
          <h5>关键词</h5>
          <button
            v-if="!editing.active"
            @click="startEdit('keywords', props.node.data.summary.keywords.join(', '))"
            class="edit-btn"
          >
            ✎
          </button>
        </div>
        <div v-if="!editing.active || editing.field !== 'keywords'" class="wm-keywords">
          <span v-for="keyword in props.node.data.summary.keywords" :key="keyword" class="wm-keyword">{{
            keyword
          }}</span>
        </div>
        <div v-if="editing.active && editing.field === 'keywords'" class="edit-area">
          <input type="text" v-model="editing.text" class="wm-input" placeholder="用逗号分隔关键词" />
          <div class="edit-controls">
            <button class="wm-save-btn small" @click="saveEdit">保存</button>
            <button class="wm-btn small" @click="cancelEdit">取消</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="getSupportingMemories(props.node.data).length > 0" class="detail-section">
      <h5>支撑记忆 ({{ getSupportingMemories(props.node.data).length }})</h5>
      <ul class="support-list">
        <li v-for="mem in getSupportingMemories(props.node.data)" :key="mem">
          <a href="#" @click.prevent="emit('select-node', mem)" class="memory-link">{{ mem }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue';
import type { NatureTrait } from '../../types';
import { useSettingsStore } from '../store';

const props = defineProps({
  node: {
    type: Object as PropType<any>,
    required: true,
  },
});

const emit = defineEmits(['select-node']);

const store = useSettingsStore();

const editing = ref({
  active: false,
  field: '',
  text: '',
});

function startEdit(field: string, text: string) {
  editing.value = {
    active: true,
    field,
    text,
  };
}

function cancelEdit() {
  editing.value = {
    active: false,
    field: '',
    text: '',
  };
}

async function saveEdit() {
  if (!props.node?.id) return;

  let payload: any = {};

  if (editing.value.field === 'keywords') {
    payload.keywords = editing.value.text
      .split(',')
      .map(k => k.trim())
      .filter(k => k);
  } else {
    payload[editing.value.field] = editing.value.text;
  }

  await store.updateNodeContent(props.node.id, props.node.type, props.node.data.parentEntryName, payload);

  // Optimistically update the view
  if (editing.value.field === 'statement') {
    props.node.data.statement = editing.value.text;
  } else if (editing.value.field === 'description') {
    props.node.data.description = editing.value.text;
  } else if (editing.value.field === 'summary_text') {
    props.node.data.summary.text = editing.value.text;
  } else if (editing.value.field === 'keywords') {
    props.node.data.summary.keywords = payload.keywords;
  } else if (['visual', 'auditory', 'somatic'].includes(editing.value.field)) {
    props.node.data.flashbulb_fragments[editing.value.field] = editing.value.text;
  }

  cancelEdit();
}

const getLatestDescription = (trait: NatureTrait): string => {
  if (trait.evolution && trait.evolution.length > 0) {
    return trait.evolution[trait.evolution.length - 1].new_description;
  }
  return trait.description;
};

const getSupportingMemories = (data: any): string[] => {
  if (data.supporting_memories) return data.supporting_memories;
  if (Array.isArray(data)) {
    return data.flatMap(item => item.supporting_memories || []);
  }
  return [];
};
</script>

<style>
.node-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 15px;
}
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.edit-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 16px;
}
.edit-btn:hover {
  color: #fff;
}
.edit-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.edit-area.inline {
  flex-direction: row;
  align-items: center;
  margin-top: 4px;
}
.small-edit {
  font-size: 12px;
  margin-left: 8px;
}
.memory-link {
  color: #9194e8;
  text-decoration: none;
  cursor: pointer;
}
.memory-link:hover {
  text-decoration: underline;
}
.wm-textarea {
  width: 100%;
  min-height: 80px;
  background: #222;
  border: 1px solid #444;
  color: #ddd;
  border-radius: 4px;
  padding: 8px;
  font-family: inherit;
  resize: vertical;
}
.edit-controls {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.wm-save-btn.small {
  padding: 6px 12px;
  font-size: 13px;
}
.wm-btn.small {
  width: auto;
  height: auto;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
}

.detail-section h5 {
  margin: 0 0 8px 0;
  color: #9194e8;
  font-size: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 6px;
}
.detail-section p {
  margin: 0;
  color: #ddd;
  line-height: 1.6;
}
.evolution-list,
.support-list,
.flashbulb-list {
  padding-left: 20px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.evolution-list li,
.support-list li,
.flashbulb-list li {
  font-size: 13px;
}
.evolution-list .time,
.time {
  font-size: 12px;
  color: #888;
}
</style>
