<template>
  <div class="weekly-review-panel">
    <h2>周记回顾</h2>
    <div v-if="reviews.length > 0" class="review-list">
      <div v-for="(review, index) in reviews" :key="index" class="review-entry">
        <h3>{{ review.本周标题 }}</h3>
        <p class="date-range">{{ review.起止日期 }}</p>
        <div class="summary">
          <h4>本周综述</h4>
          <p>{{ review.本周综述 }}</p>
        </div>
        <div class="character-arc">
          <h4>核心人物变化</h4>
          <p>{{ review.核心人物变化 }}</p>
        </div>
        <div class="relationships">
          <h4>人际关系流转</h4>
          <p><strong>主要进展:</strong> {{ review.人际关系流转.主要进展 }}</p>
          <p><strong>主要矛盾:</strong> {{ review.人际关系流转.主要矛盾 }}</p>
        </div>
        <div class="world-line">
          <h4>世界线变动</h4>
          <p><strong>主线推演:</strong> {{ review.世界线变动.主线推演 }}</p>
          <p><strong>新增伏笔:</strong> {{ review.世界线变动.新增伏笔 }}</p>
        </div>
      </div>
    </div>
    <div v-else>
      <p>暂无周记记录。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { lorebookService } from '../../services/LorebookService';

interface WeeklyReview {
  本周标题: string;
  起止日期: string;
  本周综述: string;
  核心人物变化: string;
  人际关系流转: {
    主要进展: string;
    主要矛盾: string;
  };
  世界线变动: {
    主线推演: string;
    新增伏笔: string;
  };
}

const reviews = ref<WeeklyReview[]>([]);

function parseReviewBlock(block: string): WeeklyReview {
  const lines = block.split('\n');
  const data: any = {};
  let currentSection = '';

  lines.forEach(line => {
    if (line.startsWith('---')) return;
    
    if (line.startsWith('【') && line.endsWith('】')) {
        currentSection = line.substring(1, line.length - 1);
        data[currentSection] = '';
    } else if (line.includes('|')) {
        const [key, ...valueParts] = line.split('|');
        data[key.trim()] = valueParts.join('|').trim();
    } else if (currentSection) {
        data[currentSection] += line + '\n';
    }
  });

  return {
    本周标题: data['本周标题'] || '',
    起止日期: data['起止日期'] || '',
    本周综述: data['本周综述']?.trim() || '',
    核心人物变化: data['核心人物变化']?.trim() || '',
    人际关系流转: {
      主要进展: data['人际关系流转']?.match(/主要进展:(.*)/)?.[1]?.trim() || '',
      主要矛盾: data['人际关系流转']?.match(/主要矛盾:(.*)/)?.[1]?.trim() || '',
    },
    世界线变动: {
      主线推演: data['世界线变动']?.match(/主线推演:(.*)/)?.[1]?.trim() || '',
      新增伏笔: data['世界线变动']?.match(/新增伏笔:(.*)/)?.[1]?.trim() || '',
    },
  };
}


</script>

<style lang="scss" scoped>
.weekly-review-panel {
  padding: 1em;
  color: #eee;
}
.review-entry {
  margin-bottom: 2em;
  padding-bottom: 1em;
  border-bottom: 1px solid #444;
}
h3 {
  color: #ffd700;
}
.date-range {
  font-size: 0.9em;
  color: #aaa;
  margin-bottom: 1em;
}
h4 {
    margin-top: 1em;
    color: #add8e6;
}
</style>