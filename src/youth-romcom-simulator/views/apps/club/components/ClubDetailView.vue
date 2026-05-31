<template>
  <div class="club-detail-view">
    <div class="detail-header">
      <button @click="$emit('back')" class="back-btn">< 返回列表</button>
      <h2 class="detail-title">{{ club.name }}</h2>
    </div>
    <div class="club-details-content">
      <div class="detail-section">
        <h3>社团简介</h3>
        <p>{{ club.description }}</p>
      </div>
      <div class="detail-section">
        <h3>核心成员</h3>
        <ul class="member-list">
          <li><strong>部长:</strong> {{ getCharacterName(club.leader) }}</li>
          <li v-if="club.deputyLeader && club.deputyLeader.length > 0">
            <strong>副部长:</strong> {{ club.deputyLeader.map(getCharacterName).join(', ') }}
          </li>
          <li v-for="member in club.members" :key="member">{{ getCharacterName(member) }}</li>
        </ul>
      </div>
      <div class="detail-section">
        <h3>活动信息</h3>
        <p><strong>活动日:</strong> {{ club.activityDays }}</p>
        <p><strong>地点:</strong> {{ club.location }}</p>
        <p><strong>活跃度:</strong> {{ clubActivity }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Club } from '../../../../services/ClubService';
import { getters, store } from '../../../../store';
import { getCharacterById, safeGetValue } from '../../../../utils/character-utils';

interface Props {
  club: Club;
}

const props = defineProps<Props>();
defineEmits(['back']);

const clubActivity = computed(() => {
  if (!store.worldState) return 'N/A';
  return safeGetValue(store.worldState, `世界状态.社团活跃度.${props.club.id}`, 0);
});

function getCharacterName(charId: string): string {
  if (charId === '{{user}}') return getters.userFullName.value;
  if (!store.worldState) return charId;
  const char = getCharacterById(store.worldState, charId);
  return char ? `${safeGetValue(char, '姓', '')}${safeGetValue(char, '名', charId)}` : charId;
}
</script>

<style scoped lang="scss">
.club-detail-view {
  padding: 15px;
}
.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}
.back-btn {
  background: none;
  border: 1px solid #ccc;
  padding: 5px 10px;
  cursor: pointer;
  margin-right: 15px;
  border-radius: 4px;
  font-size: 0.9rem;
}
.detail-title {
  font-size: 1.3rem;
  margin: 0;
}
.detail-section {
  margin-bottom: 20px;
  h3 {
    font-size: 1.1rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  p,
  ul {
    font-size: 0.95rem;
    line-height: 1.7;
    color: #333;
  }
  .member-list {
    list-style: none;
    padding: 0;
    li {
      background: #f8f9fa;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 5px;
    }
  }
}
</style>
