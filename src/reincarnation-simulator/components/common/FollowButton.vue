<template>
  <button class="follow-btn" :class="{ followed: isFollowedState }" @click.stop="toggle">★</button>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { useFollowSystem } from '../../services/useFollowSystem';

const props = defineProps<{
  npcId: string;
}>();

const { toggleFollow, isFollowed } = useFollowSystem();
const isFollowedState = ref(false);

watchEffect(() => {
  isFollowedState.value = isFollowed(props.npcId);
});

function toggle() {
  toggleFollow(props.npcId);
}
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

.follow-btn {
  background: none;
  border: none;
  color: $color-grey-stone;
  cursor: pointer;
  font-size: 1.2rem;
  transition:
    color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    color: $color-gold-liu;
    transform: scale(1.2);
  }

  &.followed {
    color: $color-gold-liu;
    text-shadow: 0 0 5px $color-gold-liu;
  }
}
</style>
