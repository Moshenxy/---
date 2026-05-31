<template>
  <div class="grades-view">
    <div class="summary-card">
      <div class="summary-item">
        <span class="label">综合排名</span>
        <span class="value rank">{{ overallRank }}</span>
      </div>
    </div>

    <div class="subjects-grid">
      <div v-for="(subject, name) in subjects" :key="name" class="subject-card">
        <h3 class="subject-name">{{ name }}</h3>
        <div class="details">
          <div class="detail-item">
            <span class="label">最近分数</span>
            <span class="value score">{{ subject.最近一次分数 }}</span>
          </div>
          <div class="detail-item">
            <span class="label">知识水平</span>
            <span class="value">{{ subject.知识水平 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getters } from '../../../store';
import { get } from 'lodash';

const subjects = computed(() => getters.subjects.value);

const overallRank = computed(() => {
  const rank = get(getters.character.value, '学业.综合排名[0]');
  return rank ?? 'N/A';
});
</script>

<style lang="scss" scoped>
.grades-view {
  padding: 5px;
}

.summary-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  text-align: center;

  .summary-item .label {
    font-size: 16px;
    color: #6b7280;
    margin-bottom: 8px;
    display: block;
  }

  .summary-item .value.rank {
    font-size: 36px;
    font-weight: 700;
    color: #0d6efd;
  }
}

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.subject-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .subject-name {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 15px 0;
    text-align: center;
    color: #374151;
  }

  .details {
    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-size: 13px;
        color: #6b7280;
      }

      .value {
        font-size: 14px;
        font-weight: 500;
        color: #1f2937;

        &.score {
          font-weight: 600;
          color: #0d6efd;
        }
      }
    }
  }
}
</style>
