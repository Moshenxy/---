import { ref, watch } from 'vue';

const FOLLOWED_NPCS_STORAGE_KEY = 'reincarnation_followed_npcs';

const followedNpcs = ref(new Set<string>(
  JSON.parse(localStorage.getItem(FOLLOWED_NPCS_STORAGE_KEY) || '[]')
));

watch(followedNpcs, (newSet) => {
  localStorage.setItem(FOLLOWED_NPCS_STORAGE_KEY, JSON.stringify(Array.from(newSet)));
}, { deep: true });

export function useFollowSystem() {
  const follow = (npcId: string) => {
    followedNpcs.value.add(npcId);
  };

  const unfollow = (npcId: string) => {
    followedNpcs.value.delete(npcId);
  };

  const isFollowed = (npcId: string) => {
    return followedNpcs.value.has(npcId);
  };
  
  const toggleFollow = (npcId: string) => {
    if (isFollowed(npcId)) {
      unfollow(npcId);
    } else {
      follow(npcId);
    }
  };

  return { followedNpcs, toggleFollow, isFollowed };
}