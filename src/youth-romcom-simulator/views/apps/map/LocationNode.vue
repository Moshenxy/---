<template>
  <li class="location-node" :class="{ expanded: isExpanded }">
    <div class="node-content" @click="toggle">
      <span class="arrow" v-if="hasChildren">►</span>
      <span class="node-name">{{ location.名称 }}</span>
    </div>
    <div class="node-details" v-if="isExpanded">
      <p class="description">{{ location.描述 }}</p>
      <div class="characters" v-if="charactersHere.length">
        <strong>在场角色:</strong>
        <span v-for="char in charactersHere" :key="char.名称" class="character-tag">{{ char.名称 }}</span>
      </div>
      <ul class="children-list" v-if="hasChildren">
        <LocationNode 
          v-for="child in location.children" 
          :key="child.id" 
          :location="child"
          :all-locations="allLocations"
          :characters-by-location="charactersByLocation"
        />
      </ul>
    </div>
  </li>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from 'vue';

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
}

interface LocationNodeData extends Location {
  id: string;
  children: LocationNodeData[];
}

export default defineComponent({
  name: 'LocationNode',
  props: {
    location: {
      type: Object as PropType<LocationNodeData>,
      required: true,
    },
    allLocations: {
      type: Object as PropType<Record<string, Location>>,
      required: true,
    },
    charactersByLocation: {
        type: Object as PropType<Record<string, Character[]>>,
        required: true,
    }
  },
  setup(props) {
    const isExpanded = ref(false);

    const hasChildren = computed(() => props.location.children && props.location.children.length > 0);

    const charactersHere = computed(() => {
        return props.charactersByLocation[props.location.id] || [];
    });

    const toggle = () => {
      isExpanded.value = !isExpanded.value;
    };

    return {
      isExpanded,
      toggle,
      hasChildren,
      charactersHere
    };
  },
});
</script>

<style lang="scss" scoped>
.location-node {
  margin-left: 20px;
  list-style: none;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 15px;
    left: -12px;
    width: 10px;
    height: 1px;
    background-color: #444;
  }
}

.node-content {
  cursor: pointer;
  padding: 5px 0;
  display: flex;
  align-items: center;

  .arrow {
    display: inline-block;
    transition: transform 0.2s;
    margin-right: 8px;
    font-size: 10px;
  }
}

.expanded > .node-content .arrow {
  transform: rotate(90deg);
}

.node-details {
  padding-left: 15px;
  border-left: 1px solid #444;
  margin-left: -7px;
  
  .description {
    font-size: 13px;
    color: #a0a0a0;
    margin: 5px 0;
    padding-left: 5px;
  }

  .characters {
    font-size: 13px;
    margin: 10px 0;
    padding-left: 5px;
    .character-tag {
        background-color: rgba(58, 143, 157, 0.2);
        color: #3a8f9d;
        padding: 2px 6px;
        border-radius: 5px;
        margin-left: 8px;
    }
  }
}

.children-list {
  padding: 0;
  margin: 10px 0 0 0;
  list-style: none;
}
</style>