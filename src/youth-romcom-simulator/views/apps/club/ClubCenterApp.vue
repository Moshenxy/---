<template>
  <div class="club-center-app">
    <div class="app-header">
      <h1>社团中心</h1>
    </div>
    <div class="app-content">
      <ClubDetailView v-if="selectedClub" :club="selectedClub" @back="selectedClub = null" />
      <div v-else>
        <div v-if="clubs.length === 0" class="loading">正在加载社团信息...</div>
        <div v-else class="club-list">
          <div v-for="club in clubs" :key="club.id" class="club-item">
            <div class="club-item-header">
              <span class="club-name">{{ club.name }}</span>
              <button class="join-btn" @click="handleClubAction(club)" :disabled="isClubActionDisabled(club.id)">
                {{ getButtonText(club.id) }}
              </button>
            </div>
            <div class="club-item-body">
              <p class="club-description">{{ club.description }}</p>
              <div class="club-meta">
                <span><strong>指导老师:</strong> {{ club.advisor || '无' }}</span>
                <span><strong>部长:</strong> {{ getAuthorName(club.leader) }}</span>
                <span><strong>活动日:</strong> {{ club.activityDays }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { clubService, type Club } from '../../../services/ClubService';
import { actions, store, getters } from '../../../store';
import { getCharacterById, safeGetValue } from '../../../utils/character-utils';
import ClubDetailView from './components/ClubDetailView.vue';
import { eventBus } from '../../../utils/event-bus';

const clubs = computed(() => clubService.clubs.value);
const selectedClub = ref<Club | null>(null);
const pendingClubId = ref<string | null>(null); // 追踪已申请但未处理的社团

const userId = computed(() => store.userId);

const playerJoinedClub = computed(() => {
  if (!userId.value) return null;
  return clubs.value.find(
    club =>
      club.leader === userId.value ||
      (club.deputyLeader && club.deputyLeader.includes(userId.value)) ||
      club.members.includes(userId.value),
  );
});

function getClubStatus(clubId: string): 'member' | 'pending' | 'full' | 'none' {
  if (playerJoinedClub.value?.id === clubId) {
    return 'member';
  }
  if (pendingClubId.value === clubId) {
    return 'pending';
  }
  if (playerJoinedClub.value) {
    return 'full'; // 玩家已加入其他社团
  }
  return 'none';
}

function getButtonText(clubId: string): string {
  const status = getClubStatus(clubId);
  switch (status) {
    case 'member':
      return '查看详情';
    case 'pending':
      return '申请中';
    case 'full':
      return '已加入社团';
    default:
      return '申请加入';
  }
}

function isClubActionDisabled(clubId: string): boolean {
  const status = getClubStatus(clubId);
  return status === 'pending' || status === 'full';
}

function handleClubAction(club: Club) {
  const status = getClubStatus(club.id);
  if (status === 'member') {
    selectedClub.value = club;
  } else if (status === 'none') {
    actions.addCachedCommand(`[行动指令|申请加入社团|${club.id}]`);
    pendingClubId.value = club.id;
    actions.showToastr(`已申请加入【${club.name}】，申请将在下次与AI交互时处理。`);
  }
}

function getAuthorName(authorId: string): string {
  if (authorId === '{{user}}') return getters.userFullName.value;
  if (!store.worldState) return authorId;
  const char = getCharacterById(store.worldState, authorId);
  return char ? `${safeGetValue(char, '姓', '')}${safeGetValue(char, '名', authorId)}` : authorId;
}

const handleBackRequest = (setHandled: () => void) => {
  if (selectedClub.value) {
    selectedClub.value = null;
    setHandled();
  }
};

onMounted(() => {
  eventBus.on('app-back-request', handleBackRequest);
});

onUnmounted(() => {
  eventBus.off('app-back-request', handleBackRequest);
});
</script>

<style lang="scss">
@import '../../../styles/apps/club.scss';
</style>
