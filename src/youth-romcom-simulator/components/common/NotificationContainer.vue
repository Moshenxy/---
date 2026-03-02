<template>
  <div class="notification-container">
    <Notification
      v-for="notification in notificationState.notifications"
      :key="notification.id"
      :notification="notification"
    />
  </div>
</template>

<script setup lang="ts">
import { notificationState } from '../../services/NotificationService';
import Notification from './Notification.vue';
</script>

<style lang="scss">
.notification-container {
  position: fixed;
  top: 80px; // Adjust to be below the top status bar
  right: 20px;
  z-index: 100000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
</style>
