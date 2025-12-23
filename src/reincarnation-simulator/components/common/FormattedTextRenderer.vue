<template>
  <div class="game-text-container">
    <template v-for="(segment, index) in segments" :key="index">
      <span
        :class="segment.class"
        @click="
          segment.npc
            ? showNpcInfo(segment.npc)
            : segment.locationId
              ? showLocationInfo(segment.locationId)
              : segment.item
                ? showDatabaseItemInfo(segment.item)
                : null
        "
        >{{ segment.text }}</span
      >
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue';
import { npcService } from '../../services/NpcService';
import { detailModalService } from '../../services/DetailModalService';
import NpcInfoCard from './NpcInfoCard.vue';
import LocationInfoCard from './LocationInfoCard.vue';
import DatabaseItemCard from './DatabaseItemCard.vue';
import { Character } from '../../types';
import { store } from '../../store';
import { mainWorld, avatarWorld } from '../../store/getters';

interface TextSegment {
  text: string;
  class: string[] | string;
  npc?: Character;
  locationId?: string;
  item?: any;
}

const props = defineProps({
  text: {
    type: String as PropType<string>,
    required: true,
  },
});

const npcNamesRegex = computed(() => {
  const names = npcService.allNpcs.value.map(npc => (Array.isArray(npc.姓名) ? npc.姓名[0] : npc.姓名)).filter(Boolean);
  if (names.length === 0) return null;
  const escapedNames = names.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(${escapedNames.join('|')})`, 'g');
});

const locationNamesRegex = computed(() => {
  const names = Array.from(npcService.locationCache.values()).map(loc => loc.name);
  if (names.length === 0) return null;
  const escapedNames = names.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(${escapedNames.join('|')})`, 'g');
});

const activeWorld = computed(() => (store.activeView === 'mainWorld' ? mainWorld.value : avatarWorld.value));

const databaseItemNamesRegex = computed(() => {
  const database = activeWorld.value?.数据库;
  if (!database) return null;
  const names: string[] = [];
  for (const category in database) {
    if (category === '$meta') continue;
    const categoryStore = (database as any)[category];
    if (categoryStore) {
      for (const itemId in categoryStore) {
        if (itemId === '$meta') continue;
        const item = categoryStore[itemId];
        if (item && item.名称) {
          names.push(item.名称);
        }
      }
    }
  }

  if (names.length === 0) return null;
  const escapedNames = names.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(${escapedNames.join('|')})`, 'g');
});

const segments = computed((): TextSegment[] => {
  if (!props.text) return [];
  const cleanText = props.text.replace(/<[^>]*>/g, '');
  return parseText(cleanText);
});

function parseText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /(【【.*?】】)|(【.*?】)|(「.*?」)|(\*.*?\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(...parseEntities(text.substring(lastIndex, match.index)));
    }

    const matchedText = match[0];
    let innerText = '';
    let outerClass = '';

    if (match[1]) {
      innerText = matchedText.slice(2, -2);
      outerClass = 'text-system-highlight';
    } else if (match[2]) {
      innerText = matchedText.slice(1, -1);
      outerClass = 'text-scenery';
    } else if (match[3]) {
      innerText = matchedText.slice(1, -1);
      outerClass = 'text-dialogue';
    } else if (match[4]) {
      innerText = matchedText.slice(1, -1);
      outerClass = 'text-psychology';
    }

    const innerSegments = parseEntities(innerText);

    innerSegments.forEach(segment => {
      const combinedClass = Array.isArray(segment.class)
        ? [outerClass, ...segment.class]
        : [outerClass, segment.class].filter(Boolean);
      segments.push({ ...segment, class: combinedClass });
    });

    lastIndex = match.index + matchedText.length;
  }

  if (lastIndex < text.length) {
    segments.push(...parseEntities(text.substring(lastIndex)));
  }

  return segments;
}

function parseEntities(text: string): TextSegment[] {
  const segments: TextSegment[] = [];

  const entityRegexParts = [];
  if (npcNamesRegex.value) entityRegexParts.push(npcNamesRegex.value.source);
  if (locationNamesRegex.value) entityRegexParts.push(locationNamesRegex.value.source);
  if (databaseItemNamesRegex.value) entityRegexParts.push(databaseItemNamesRegex.value.source);

  if (entityRegexParts.length === 0) {
    return [{ text, class: '' }];
  }

  const entityRegex = new RegExp(entityRegexParts.join('|'), 'g');

  let lastIndex = 0;
  let match;

  while ((match = entityRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.substring(lastIndex, match.index), class: '' });
    }

    const name = match[0];
    const npc = npcService.allNpcs.value.find(n => (Array.isArray(n.姓名) ? n.姓名[0] : n.姓名) === name);
    const locId = [...npcService.locationCache.entries()].find(([id, loc]) => loc.name === name)?.[0];
    const item = getItemFromDatabase(name);

    if (npc) {
      const relationshipClass = getNpcRelationshipClass(npc);
      segments.push({ text: name, class: ['npc-name', relationshipClass], npc });
    } else if (locId) {
      segments.push({ text: name, class: 'location-name', locationId: locId });
    } else if (item) {
      segments.push({ text: name, class: 'database-item-name', item });
    } else {
      segments.push({ text: name, class: '' });
    }

    lastIndex = match.index + name.length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.substring(lastIndex), class: '' });
  }

  return segments;
}

const showNpcInfo = (npc: Character) => {
  if (!npc) return;
  const npcName = Array.isArray(npc.姓名) ? npc.姓名[0] : npc.姓名;
  detailModalService.show(npcName, NpcInfoCard, { npc });
};

const showLocationInfo = (locationId: string) => {
  if (!locationId) return;
  const locationName = npcService.getLocationName(locationId);
  detailModalService.show(locationName, LocationInfoCard, { locationId });
};

const showDatabaseItemInfo = (item: any) => {
  if (!item) return;
  detailModalService.show(item.名称, DatabaseItemCard, { item });
};

function getItemFromDatabase(name: string): any | null {
  const database = activeWorld.value?.数据库;
  if (!database) return null;

  for (const category in database) {
    if (category === '$meta') continue;
    const categoryStore = (database as any)[category];
    if (categoryStore) {
      for (const itemId in categoryStore) {
        if (itemId === '$meta') continue;
        const item = categoryStore[itemId];
        if (item && item.名称 === name) {
          return item;
        }
      }
    }
  }
  return null;
}

function getNpcRelationshipClass(npc: Character): string {
  const npcId = npcService.getNpcId(npc);
  const causalNet = activeWorld.value?.因果之网;
  if (!npcId || !causalNet || !causalNet[npcId]?.['本体']) {
    return 'npc-unknown';
  }

  const relationship = causalNet[npcId]['本体'];
  const emotionalSum = (relationship.情感层?.亲近感 || 0) + (relationship.情感层?.仰慕度 || 0);

  if (emotionalSum <= -150) return 'npc-hostile-intense';
  if (emotionalSum <= -50) return 'npc-hostile';
  if (emotionalSum < 0) return 'npc-unfriendly';
  if (emotionalSum < 50) return 'npc-neutral';
  if (emotionalSum < 100) return 'npc-friendly';
  if (emotionalSum < 150) return 'npc-devoted';
  return 'npc-fanatical';
}
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

.game-text-container {
  font-size: 15px;
  line-height: 1.8;
  color: #000000;
  white-space: pre-wrap;

  .text-dialogue {
    color: $color-gold-liu;
  }

  .text-psychology {
    color: $color-purple-mystery;
    font-style: italic;
  }

  .text-scenery {
    color: $color-cyan-tian;
  }

  .text-system-highlight {
    color: $color-gold-liu;
    font-weight: bold;
  }

  :deep(.npc-name) {
    font-family: $font-family-title;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-color: rgba(255, 255, 255, 0.5);
    transition: all 0.2s ease;
    text-shadow:
      -1px -1px 0 #000,
      1px -1px 0 #000,
      -1px 1px 0 #000,
      1px 1px 0 #000;

    &:hover {
      background-color: rgba(255, 255, 255, 0.15);
      text-decoration-color: #fff;
    }

    &.npc-hostile-intense {
      color: #ff4d4d;
    }
    &.npc-hostile {
      color: #ff8c66;
    }
    &.npc-unfriendly {
      color: #ffd700;
    }
    &.npc-neutral {
      color: #ffffff;
    }
    &.npc-friendly {
      color: #90ee90;
    }
    &.npc-devoted {
      color: #87cefa;
    }
    &.npc-fanatical {
      color: #ff69b4;
    }
    &.npc-unknown {
      color: #9e9e9e;
    }
  }

  :deep(.location-name) {
    color: #80b9ea; /* A light cyan color */
    cursor: pointer;
    text-shadow:
      -1px -1px 0 #000,
      1px -1px 0 #000,
      -1px 1px 0 #000,
      1px 1px 0 #000;
    text-decoration: underline;
    text-decoration-color: rgba(128, 222, 234, 0.5);

    &:hover {
      background-color: rgba(128, 151, 234, 0.15);
      text-decoration-color: #80b5ea;
    }
  }

  :deep(.database-item-name) {
    color: #f8cbad; /* A light orange color for items */
    cursor: pointer;
    text-shadow:
      -1px -1px 0 #000,
      1px -1px 0 #000,
      -1px 1px 0 #000,
      1px 1px 0 #000;
    text-decoration: underline;
    text-decoration-color: rgba(248, 203, 173, 0.5);

    &:hover {
      background-color: rgba(248, 203, 173, 0.15);
      text-decoration-color: #f8cbad;
    }
  }
}
</style>
