import { ref } from 'vue';

export interface Job {
  id: string;
  title: string;
  location: string;
  salary: string;
  requirements: string[];
  description: string;
}

class JobService {
  public jobs = ref<Job[]>([]);

  constructor() {
    this.loadJobs();
  }

  private async loadJobs() {
    try {
      const entries = await TavernHelper.getLorebookEntries('天华校园');
      if (!entries) {
        console.warn('[JobService] Could not fetch entries for "天华校园".');
        return;
      }
      const locationEntry = entries.find((e: any) => e.comment === '[世界观]地点列表');
      if (locationEntry && locationEntry.content) {
        this.jobs.value = this.generateJobsFromLocations(locationEntry.content);
      } else {
        console.warn('[JobService] Location list entry not found in lorebook.');
        // Fallback to some default jobs if lorebook is missing
        this.jobs.value = this.getDefaultJobs();
      }
    } catch (error) {
      console.error('Failed to load jobs from lorebook:', error);
      this.jobs.value = this.getDefaultJobs();
    }
  }

  private generateJobsFromLocations(rawText: string): Job[] {
    const jobs: Job[] = [];
    // 使用更可靠的分隔符来处理条目
    const locationBlocks = rawText.trim().split(/\n\s*ID\|/);

    for (const block of locationBlocks) {
      if (!block.trim()) continue;
      
      const lines = ('ID|' + block).trim().split('\n');
      const location: { [key: string]: string } = {};
      lines.forEach(line => {
        const separatorIndex = line.indexOf('|');
        if (separatorIndex !== -1) {
          const key = line.substring(0, separatorIndex).trim();
          const value = line.substring(separatorIndex + 1).trim();
          location[key] = value;
        }
      });

      if (location['兼职岗位']) {
        try {
          const jobData = JSON.parse(location['兼职岗位']);
          jobs.push({
            id: `job_${location['ID']}`,
            location: location['名称'],
            title: jobData.title,
            salary: jobData.salary,
            requirements: jobData.requirements,
            description: jobData.description,
          });
        } catch (e) {
          console.error(`Failed to parse job data for location ${location['ID']}:`, e);
        }
      }
    }

    if (jobs.length === 0) {
      return this.getDefaultJobs();
    }

    return jobs;
  }

  private getDefaultJobs(): Job[] {
    return [
      {
        id: 'job_default_001',
        title: '便利店店员',
        location: '站前商店街',
        salary: '1000/小时',
        requirements: ['情商 > 65', '心境 > 60'],
        description: '负责收银、补货和清洁工作。工作时间灵活，适合学生。',
      },
      {
        id: 'job_default_002',
        title: '初中生家教 (数学)',
        location: '山手住宅区',
        salary: '2500/小时',
        requirements: ['数学知识水平 > 50', '智商 > 80'],
        description: '为一名初中生辅导数学。需要有耐心和扎实的数学基础。',
      },
    ];
  }
}

export const jobService = new JobService();