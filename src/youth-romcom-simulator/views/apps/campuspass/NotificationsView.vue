<template>
  <div class="notifications-view">
    <div v-if="notifications.length > 0" class="notifications-list">
      <div v-for="(notification, index) in notifications" :key="index" class="notification-card">
        <div class="card-header">
          <h3 class="title">{{ notification.标题 }}</h3>
          <span class="time">{{ notification.时间 }}</span>
        </div>
        <p class="content">{{ notification.内容 }}</p>
        <p class="publisher">发布者: {{ notification.发布者 }}</p>
      </div>
    </div>
    <div v-else class="no-notifications">
      <p>暂无校园通知。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { get } from 'lodash';
import { store } from '../../../store';

const notifications = computed(() => {
  const announcements = get(store.worldState, '世界状态.公告');

  if (Array.isArray(announcements)) {
    const validAnnouncements = announcements.filter(
      item => item && typeof item === 'object' && item.hasOwnProperty('标题'),
    );

    if (validAnnouncements.length > 0) {
      return validAnnouncements.sort((a, b) => new Date(b.时间).getTime() - new Date(a.时间).getTime());
    }
  }

  // Return default mock data if no real data is available
  return [
    {
      标题: '关于文化祭的通知',
      内容: '一年一度的天华学园文化祭将于下月15日举行，请各班级和社团踊跃报名参加。',
      发布者: '学生会',
      时间: '2024-09-1',
    },
    {
      标题: '图书馆闭馆通知',
      内容: '因系统维护，图书馆将于下周五（9月12日）下午闭馆半天，请同学们提前安排好借阅事宜。',
      发布者: '图书馆',
      时间: '2024-09-01',
    },
    {
      标题: '寻物启事',
      内容: '本人于今日在体育馆丢失一个蓝色水壶，如有拾获者请联系2年D班的比企谷八幡，万分感谢。',
      发布者: '比企谷八幡',
      时间: '2024-09-01',
    },
  ].sort((a, b) => new Date(b.时间).getTime() - new Date(a.时间).getTime());
});
</script>

<style lang="scss" scoped>
.notifications-view {
  padding: 5px;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.notification-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 5px solid #0d6efd;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;

  .title {
    font-size: 17px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .time {
    font-size: 12px;
    color: #9ca3af;
    flex-shrink: 0;
    margin-left: 15px;
  }
}

.content {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
  margin: 0 0 15px 0;
}

.publisher {
  font-size: 12px;
  color: #9ca3af;
  text-align: right;
  margin: 0;
  font-style: italic;
}

.no-notifications {
  text-align: center;
  color: #9ca3af;
  padding: 40px 20px;
  background-color: #fff;
  border-radius: 8px;
  font-size: 14px;
}
</style>
