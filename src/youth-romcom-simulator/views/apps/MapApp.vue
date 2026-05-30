<template>
  <div class="map-app">
    <ul class="location-tree">
      <LocationNode 
        v-for="location in locationTree" 
        :key="location.id" 
        :location="location"
        :all-locations="locations"
        :characters-by-location="charactersByLocation"
      />
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { get } from 'lodash';
import { store } from '../../store';
import LocationNode from './map/LocationNode.vue';

// Based on `变量结构.txt`
interface Location {
  名称: string;
  层级类型: string;
  所属: { ID: string } | null;
  描述: string;
  场景特质?: any[];
  包含物品?: string[];
}

interface Character {
  名称: string;
  位置: string;
  身份: any[];
  个人信息: any;
  内在世界: any;
  人格内核: any;
  关系动态: any;
  属性: any;
  技能: any;
  记忆: any;
  当前状态: any[];
}

interface LocationNodeData extends Location {
  id: string;
  children: LocationNodeData[];
}

const locations = computed(() => get(store.worldState, '地点', {}) as Record<string, Location>);
const characters = computed(() => get(store.worldState, '角色列表', {}) as Record<string, Character>);

const charactersByLocation = computed(() => {
  const map: Record<string, Character[]> = {};
  for (const charId in characters.value) {
    const char = characters.value[charId];
    if (typeof char === 'object' && char !== null && char.位置) {
      if (!map[char.位置]) {
        map[char.位置] = [];
      }
      map[char.位置].push(char as Character);
    }
  }
  return map;
});

const locationTree = computed(() => {
  const locationsValue = locations.value;
  const roots: LocationNodeData[] = [];
  const childrenOf: Record<string, LocationNodeData[]> = {};

  for (const id in locationsValue) {
    const location = { ...locationsValue[id], id, children: [] };
    if (location.所属 && location.所属.ID) {
      if (!childrenOf[location.所属.ID]) {
        childrenOf[location.所属.ID] = [];
      }
      childrenOf[location.所属.ID].push(location);
    } else {
      roots.push(location);
    }
  }

  const buildTree = (nodes: LocationNodeData[]): LocationNodeData[] => {
    return nodes.map(node => ({
      ...node,
      children: childrenOf[node.id] ? buildTree(childrenOf[node.id]) : []
    }));
  };

  return buildTree(roots);
});
</script>

<style lang="scss" scoped>
.map-app {
  height: 100%;
  overflow-y: auto;
  background-color: #10141d;
  color: #e0e0e0;
  padding: 15px;
}

.location-tree {
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>
