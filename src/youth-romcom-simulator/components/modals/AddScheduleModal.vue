<template>
  <Modal :show="show" @close="close" :title="isEditing ? '编辑日程' : '添加新日程'">
    <form @submit.prevent="handleSubmit" class="schedule-form">
      <div class="form-group">
        <label for="title">标题</label>
        <input id="title" v-model="editableSchedule.标题" type="text" required />
      </div>
      <div class="form-group">
        <label for="date">日期</label>
        <input id="date" v-model="editableSchedule.日期" type="date" required />
      </div>
      <div class="form-group">
        <label for="time">时间</label>
        <input id="time" v-model="editableSchedule.时间" type="time" required />
      </div>
      <div class="form-group">
        <label for="type">类型</label>
        <select id="type" v-model="editableSchedule.类型">
          <option>个人</option>
          <option>社交</option>
          <option>学业</option>
          <option>社团</option>
        </select>
      </div>
      <div class="form-group">
        <label for="location">地点</label>
        <div class="location-cascader">
          <select
            v-for="(level, index) in locationLevels"
            :key="index"
            v-model="selectedLocations[index]"
            @change="handleLocationChange(index)"
          >
            <option :value="null" disabled>请选择...</option>
            <option v-for="loc in level" :key="loc.id" :value="loc.id">
              {{ loc.name }}
            </option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label for="description">描述</label>
        <textarea id="description" v-model="editableSchedule.描述"></textarea>
      </div>
      <div class="form-actions">
        <button type="button" @click="close" class="btn-secondary">取消</button>
        <button type="submit" class="btn-primary">{{ isEditing ? '保存更改' : '添加日程' }}</button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { calendarService, ScheduleItem } from '../../services/CalendarService';
import { locationService } from '../../services/LocationService';
import Modal from './Modal.vue';

const props = defineProps<{
  show: boolean;
  scheduleToEdit?: ScheduleItem | null;
}>();

const emit = defineEmits(['close']);

const editableSchedule = ref<Partial<ScheduleItem>>({});
const isEditing = computed(() => !!props.scheduleToEdit);

// --- Location Cascader Logic ---
const locationLevels = ref<any[][]>([locationService.locations]);
const selectedLocations = ref<(string | null)[]>([]);

watch(() => props.scheduleToEdit, (newVal) => {
    if (newVal && newVal.地点ID) {
        // This is a simplified path reconstruction. A full implementation
        // would require a lookup in the locationService to build the parent path.
        selectedLocations.value = [newVal.地点ID];
    } else {
        selectedLocations.value = [null];
    }
}, { immediate: true });


function handleLocationChange(levelIndex: number) {
  const selectedId = selectedLocations.value[levelIndex];
  
  // Update the final location ID
  if(selectedId) {
      editableSchedule.value.地点ID = selectedId;
  }

  // Prune subsequent levels
  locationLevels.value.splice(levelIndex + 1);
  selectedLocations.value.splice(levelIndex + 1);

  if (selectedId) {
    const children = locationService.getChildren(selectedId);
    if (children.length > 0) {
      locationLevels.value.push(children);
      selectedLocations.value.push(null);
    }
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.scheduleToEdit) {
      editableSchedule.value = { ...props.scheduleToEdit };
    } else {
      const now = new Date();
      editableSchedule.value = {
        标题: '',
        日期: now.toISOString().split('T')[0],
        时间: now.toTimeString().slice(0, 5),
        地点ID: '',
        参与者: [],
        类型: '个人',
        描述: '',
      };
    }
  }
});

const handleSubmit = async () => {
  if (isEditing.value) {
    await calendarService.updateSchedule(editableSchedule.value as ScheduleItem);
  } else {
    await calendarService.addSchedule(editableSchedule.value as Omit<ScheduleItem, 'ID'>);
  }
  close();
};

const close = () => {
  emit('close');
  editableSchedule.value = {};
};
</script>

<style lang="scss" scoped>
.schedule-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;

  label {
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  input,
  select,
  textarea {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }

  textarea {
    min-height: 80px;
    resize: vertical;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
  }
}

.location-cascader {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  select {
    width: 100%;
  }
}
</style>
