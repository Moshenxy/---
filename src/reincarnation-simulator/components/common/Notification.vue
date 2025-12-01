<template>
  <transition name="notification-fade">
    <div :class="['notification', `notification--${notification.type}`]">
      <div class="notification__content">
        <h4 class="notification__title">{{ notification.title }}</h4>
        <p class="notification__message">{{ notification.message }}</p>
      </div>
      <div class="notification__arrow"></div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { Notification } from '../../services/NotificationService';

defineProps<{
  notification: Notification;
}>();
</script>

<style lang="scss">
@use '../../styles/theme/variables' as *;
@use '../../styles/theme/mixins' as *;

.notification {
  position: relative;
  @include frosted-glass(rgba($color-indigo-deep, 0.7), 10px);
  background-color: rgba($color-indigo-deep, 0.5);
  border: 1px solid rgba($color-gold-liu, 0.4);
  border-radius: $border-radius-md;
  padding: $spacing-sm $spacing-md;
  margin-bottom: $spacing-md;
  width: 280px;
  box-shadow: 0 6px 25px rgba($color-black-void, 0.5);
  transition: all 0.4s ease-in-out;

  &__content {
    position: relative;
    z-index: 1;
  }

  &__title {
    font-family: $font-family-title;
    color: $color-gold-pale;
    font-size: $font-size-large;
    margin: 0 0 $spacing-xs 0;
  }

  &__message {
    color: $color-white-moon;
    font-size: $font-size-base;
    margin: 0;
    line-height: 1.5;
  }

  &__arrow {
    position: absolute;
    top: 50%;
    right: -10px;
    width: 0;
    height: 0;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-left: 10px solid rgba($color-gold-liu, 0.4);
    transform: translateY(-50%);

    &::before {
      content: '';
      position: absolute;
      top: -9px;
      left: -11px;
      width: 0;
      height: 0;
      border-top: 9px solid transparent;
      border-bottom: 9px solid transparent;
      border-left: 9px solid $color-indigo-deep;
    }
  }

  // Type variations
  &--success {
    border-left-color: $color-cyan-tian;
  }
  &--info {
    border-left-color: $color-purple-mystery;
  }
  &--warning {
    border-left-color: $color-gold-liu;
  }
  &--error {
    border-left-color: $color-red-chi;
  }
}

// Transition animation
.notification-fade-enter-active,
.notification-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.notification-fade-enter-from,
.notification-fade-leave-to {
  opacity: 0;
  transform: scale(0.5) translateX(100%);
}
</style>
