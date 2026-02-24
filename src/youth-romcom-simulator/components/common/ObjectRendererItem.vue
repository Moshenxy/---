<template>
  <li>
    <div class="object-key" :title="String(itemKey)">{{ itemKey }}</div>
    <div class="value-cell">
      <span v-if="typeof value === 'boolean'" :class="['boolean-tag', value ? 'is-true' : 'is-false']">
        {{ value ? '是' : '否' }}
      </span>
      <span v-else-if="isObject(value)">
        <ObjectRenderer :data="value" :is-nested="true" :context="context" />
      </span>
      <span v-else-if="isProgress(itemKey, value)">
        <ProgressBar :label="String(itemKey)" :value="getProgressValue(itemKey, value).current" :max="getProgressValue(itemKey, value).max" color="#d4af37" />
      </span>
      <span v-else-if="isCharacterId(itemKey, value)">
        <a href="#" @click.prevent="showNpcDetail(value)">{{ getNpcName(value) }}</a>
      </span>
      <span v-else class="object-value">{{ value ?? '无' }}</span>
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { npcService } from '../../services/NpcService';
import { detailModalService } from '../../services/DetailModalService';
import { store } from '../../store';
import ProgressBar from './ProgressBar.vue';
import NpcDetailDisplay from './NpcDetailDisplay.vue';

// Forward declaration for recursive component
const ObjectRenderer = defineAsyncComponent(() => import('./ObjectRenderer.vue'));

const props = defineProps<{
  itemKey: string | number;
  value: any;
  isNested?: boolean;
  context?: Record<string, any>;
}>();

const isObject = (val: any) => typeof val === 'object' && val !== null && !Array.isArray(val);

const isProgress = (key: string | number, val: any) => {
  return (String(key).toLowerCase().includes('经验') || String(key).toLowerCase().includes('progress')) && typeof val === 'number';
};

const getProgressValue = (key: string | number, val: any) => {
    return { current: val, max: 100 }; // Placeholder max value
};

const isCharacterId = (key: string | number, val: any) => {
    return (String(key).toLowerCase().includes('id') || String(key).toLowerCase().includes('角色')) && typeof val === 'string' && store.worldState?.角色列表?.[val];
};

const getNpcName = (id: string) => {
  return npcService.getNpcNameById(id);
};

const showNpcDetail = (npcId: string) => {
  const npc = store.worldState?.角色列表?.[npcId];
  if (npc && typeof npc === 'object') {
    detailModalService.show(npc.名称, NpcDetailDisplay, { npc: npc, npcId: npcId });
  }
};

</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

li {
  display: flex;
  align-items: flex-start;
  gap: $spacing-md;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid rgba($color-gold-liu, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
}

.object-key {
  color: $color-gold-pale;
  font-weight: bold;
  text-align: left;
  width: 80px; // 固定键的宽度
  flex-shrink: 0; // 防止键被压缩
  white-space: nowrap;
  padding-top: $spacing-sm;
}

.value-cell {
  padding-top: $spacing-sm;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.object-value {
  color: $color-white-moon;
}

.boolean-tag {
  padding: 2px 8px;
  border-radius: $border-radius-md;
  font-weight: bold;
  font-size: $font-size-small;

  &.is-true {
    background-color: rgba($color-cyan-tian, 0.2);
    color: $color-cyan-tian;
  }
  &.is-false {
    background-color: rgba($color-red-chi, 0.2);
    color: $color-red-chi;
  }
}

a {
  color: $color-cyan-tian;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

</style>
