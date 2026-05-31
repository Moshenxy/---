<template>
  <div class="grade-inquiry-view">
    <div v-if="!grades" class="loading">正在加载成绩...</div>
    <div v-else-if="Object.keys(grades.subjects).length === 0" class="no-data">暂无成绩记录</div>
    <div v-else class="grades-content">
      <div class="summary-card">
        <h2>最近考试总结</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">总成绩</span>
            <span class="value">{{ grades.totalScore }}</span>
          </div>
          <div class="summary-item">
            <span class="label">年级排名</span>
            <span class="value">{{ grades.overallRank }}</span>
          </div>
        </div>
      </div>
      <div class="subjects-list">
        <h3>各科成绩详情</h3>
        <div v-for="(subject, name) in grades.subjects" :key="name" class="subject-item">
          <span class="subject-name">{{ name }}</span>
          <div class="subject-details">
            <span class="score"
              >分数: <strong>{{ subject.最近一次分数 }}</strong></span
            >
            <span class="rank"
              >排名: <strong>{{ subject.年级排名 }}</strong></span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getters } from '../../../store';

const grades = computed(() => {
  const academicData = getters.character.value?.学业;
  if (!academicData) return null;

  const subjects = Object.entries(academicData)
    .filter(([key]) => key !== '综合排名')
    .reduce(
      (acc, [key, value]) => {
        const subjectDetail = Array.isArray(value) ? value[0] : value;
        if (subjectDetail && typeof subjectDetail === 'object') {
          acc[key] = subjectDetail;
        }
        return acc;
      },
      {} as { [key: string]: any },
    );

  const totalScore = Object.values(subjects).reduce((sum, subject) => sum + (subject.最近一次分数 || 0), 0);

  return {
    totalScore,
    overallRank: academicData.综合排名
      ? Array.isArray(academicData.综合排名)
        ? academicData.综合排名[0]
        : academicData.综合排名
      : 'N/A',
    subjects,
  };
});
</script>

<style scoped lang="scss">
.grade-inquiry-view {
  padding: 1rem;
  background-color: #f4f7f6;
  height: 100%;
  overflow-y: auto;

  .loading,
  .no-data {
    text-align: center;
    color: #6c757d;
    padding-top: 2rem;
  }

  .summary-card {
    background-color: #fff;
    border-radius: 8px;
    padding: 1.2rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    h2 {
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.2rem;
      color: #343a40;
      border-bottom: 1px solid #e9ecef;
      padding-bottom: 0.5rem;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      text-align: center;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      .label {
        font-size: 0.9rem;
        color: #6c757d;
        margin-bottom: 0.25rem;
      }
      .value {
        font-size: 1.5rem;
        font-weight: 600;
        color: #0d6efd;
      }
    }
  }

  .subjects-list {
    background-color: #fff;
    border-radius: 8px;
    padding: 1.2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }

    .subject-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.8rem 0;
      border-bottom: 1px solid #e9ecef;

      &:last-child {
        border-bottom: none;
      }

      .subject-name {
        font-weight: 500;
        color: #495057;
      }

      .subject-details {
        display: flex;
        gap: 1rem;

        .score,
        .rank {
          font-size: 0.9rem;
          color: #6c757d;
          strong {
            color: #212529;
            font-weight: 600;
          }
        }
      }
    }
  }
}
</style>
