<template>
  <div class="radial-menu-container">
    <div class="radial-menu" :style="menuStyle">
      <div
        v-for="(option, index) in regularOptions"
        :key="option.id"
        class="menu-item"
        :class="{ 'is-disabled': option.disabled && option.disabled() }"
        :style="getItemStyle(index)"
        @click="selectOption(option)"
      >
        <div class="item-content">
          <span class="icon">{{ option.icon }}</span>
          <span class="text">{{ option.text }}</span>
        </div>
      </div>
      <div class="menu-item center-button" @click="handleCenterClick">
        <div class="item-content">
          <template v-if="centerOption">
            <span class="icon">{{ centerOption.icon }}</span>
            <span class="text">{{ centerOption.text }}</span>
          </template>
          <template v-else>
            <span class="icon">×</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';

interface MenuOption {
  id: string;
  icon: string;
  text: string;
  action: () => void;
  disabled?: () => boolean;
}

const props = defineProps<{
  options: MenuOption[];
}>();

const emit = defineEmits(['close']);

const { options } = toRefs(props);

const centerOption = computed(() => options.value.find(opt => opt.id === 'unpin'));
const regularOptions = computed(() => options.value.filter(opt => opt.id !== 'unpin'));

const menuStyle = computed(() => ({}));

const getItemStyle = (index: number) => {
  if (regularOptions.value.length === 0) return {};
  const angle = (index / regularOptions.value.length) * 2 * Math.PI - Math.PI / 2;
  const radius = 120; // px
  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle);
  return {
    transform: `translate(${x}px, ${y}px)`,
  };
};

const closeMenu = () => {
  emit('close');
};

const selectOption = (option: MenuOption) => {
  if (option.disabled && option.disabled()) {
    return;
  }
  option.action();
  closeMenu();
};

const handleCenterClick = () => {
  if (centerOption.value) {
    selectOption(centerOption.value);
  } else {
    closeMenu();
  }
};
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.radial-menu {
  position: relative;
  @include flex-center;
  width: 100%;
  height: 100%;
}

.center-button {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-left: -30px;
  margin-top: -30px;
  width: 60px;
  height: 60px;
  z-index: 1; // Ensure it's above the radial lines if any
}

.menu-item {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-left: -30px;
  margin-top: -30px;
  width: 60px;
  height: 60px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;

  .item-content {
    @include flex-center;
    flex-direction: column;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: rgba($color-charcoal-glass, 0.7);
    border: 1px solid rgba($color-cyan-tian, 0.3);
    color: $color-grey-stone;
    transition: all 0.3s ease;

    .icon {
      font-family: $font-family-title;
      font-size: 1.4rem;
    }
    .text {
      font-size: 10px;
      margin-top: 2px;
    }

    &:hover {
      background-color: rgba($color-cyan-tian, 0.2);
      border-color: $color-cyan-tian;
      color: $color-white-moon;
      transform: scale(1.1);
      box-shadow: 0 0 15px rgba($color-cyan-tian, 0.5);
    }
  }

  &.is-disabled .item-content {
    background-color: rgba($color-charcoal-glass, 0.4);
    border-color: rgba($color-grey-stone, 0.2);
    color: rgba($color-grey-stone, 0.4);
    cursor: not-allowed;
    pointer-events: none;

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
}
</style>