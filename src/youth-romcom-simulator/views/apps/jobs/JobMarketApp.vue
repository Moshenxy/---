<template>
  <div class="job-market-app">
    <div class="app-header">
      <h1>兼职平台</h1>
    </div>
    <div class="app-content">
      <div v-if="jobs.length === 0" class="loading">正在加载兼职信息...</div>
      <div v-else class="job-list">
        <div v-for="job in jobs" :key="job.id" class="job-item">
          <div class="job-item-header">
            <span class="job-title">{{ job.title }}</span>
            <span class="job-salary">{{ calculateAdjustedSalary(job.salary) }}</span>
          </div>
          <div class="job-item-body">
            <p class="job-description">{{ job.description }}</p>
            <div class="job-meta">
              <span class="job-location"><strong>地点:</strong> {{ job.location }}</span>
            </div>
            <div class="job-requirements">
              <strong>要求:</strong>
              <ul>
                <li v-for="(req, index) in job.requirements" :key="index">{{ req }}</li>
              </ul>
            </div>
          </div>
          <div class="job-item-footer">
            <button class="apply-btn" @click="applyToJob(job)" :disabled="isJobApplying(job.id)">
              {{ getApplyButtonText(job.id) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { jobService, type Job } from '../../../services/JobService';
import { actions, getters } from '../../../store';

const jobs = computed(() => jobService.jobs.value);
const applyingJobIds = ref<string[]>([]);
const economicIndex = computed(() => getters.economicIndex.value);

function calculateAdjustedSalary(baseSalary: string): string {
  const baseValue = parseInt(baseSalary.split('/')[0], 10);
  if (isNaN(baseValue)) return baseSalary;
  
  const adjustedValue = Math.round(baseValue * (economicIndex.value / 100));
  return `${adjustedValue}/小时`;
}

function isJobApplying(jobId: string): boolean {
  return applyingJobIds.value.includes(jobId);
}

function getApplyButtonText(jobId: string): string {
  return isJobApplying(jobId) ? '申请中...' : '申请岗位';
}

function applyToJob(job: Job) {
  if (isJobApplying(job.id)) return;

  actions.addCachedCommand(`[行动指令|申请兼职|${job.title}]`);
  applyingJobIds.value.push(job.id);
  actions.showToastr(`已申请【${job.title}】的兼职，申请将在下次与AI交互时处理。`);
}
</script>

<style lang="scss">
@import '../../../styles/apps/jobs.scss';
</style>