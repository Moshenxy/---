<template>
  <div class="item-detail-panel">
    <div v-if="item" class="item-details">
      <h3 class="item-name" :style="getTypeStyle(item)">{{ item.名称 }}</h3>
      <div class="item-tags">
        <span class="tag" :style="getTypeTagStyle(item)">{{ item.类型 }}</span>
      </div>
      <p class="item-description">{{ item.描述 }}</p>
      <div v-if="item.效果" class="item-effects">
        <h4>效果</h4>
        <p>{{ item.效果 }}</p>
      </div>
    </div>
    <div v-else class="placeholder">
      <p>选择一个物品查看详情</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Define a local interface based on the provided schema information
interface Item {
  ID: string;
  名称: string;
  类型: '日常用品' | '书籍资料' | '个人物品' | '剧情道具' | '赠礼' | '服装饰品';
  描述: string;
  效果?: string;
  可堆叠: boolean;
  数量?: number;
}

const props = defineProps<{
  item: Item | null;
}>();

const typeColorMap: Record<string, { bg: string; text: string }> = {
  日常用品: { bg: 'rgba(108, 117, 125, 0.2)', text: '#6c757d' },
  书籍资料: { bg: 'rgba(58, 143, 157, 0.2)', text: '#3a8f9d' },
  个人物品: { bg: 'rgba(212, 175, 55, 0.2)', text: '#d4af37' },
  剧情道具: { bg: 'rgba(138, 93, 181, 0.2)', text: '#8a5db5' },
  赠礼: { bg: 'rgba(220, 53, 69, 0.2)', text: '#dc3545' },
  服装饰品: { bg: 'rgba(255, 193, 7, 0.2)', text: '#ffc107' },
};

const defaultColor = { bg: 'rgba(108, 117, 125, 0.2)', text: '#6c757d' };

const getTypeTagStyle = (item: Item) => {
  const colors = typeColorMap[item.类型] || defaultColor;
  return {
    backgroundColor: colors.bg,
    color: colors.text,
  };
};

const getTypeStyle = (item: Item) => {
  const color = typeColorMap[item.类型]?.text || defaultColor.text;
  return { color };
};
</script>

<style lang="scss" scoped>
.item-detail-panel {
  background-color: rgba(21, 26, 48, 0.6);
  border-radius: 12px;
  padding: 20px;
  color: #e0e0e0;
  height: 100%;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.item-details {
  .item-name {
    font-family: 'Noto Serif SC', serif;
    font-size: 22px;
    margin: 0 0 10px 0;
  }
  .item-tags {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    .tag {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
  }
  .item-description {
    font-size: 14px;
    line-height: 1.6;
    color: #c0c0c0;
    margin-bottom: 20px;
    white-space: pre-wrap;
  }
  .item-effects {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    h4 {
      font-family: 'Noto Serif SC', serif;
      font-size: 16px;
      color: #fafad2;
      margin: 0 0 8px 0;
    }
    p {
      font-size: 14px;
      color: #c0c0c0;
      margin: 0;
      white-space: pre-wrap;
    }
  }
}

.placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #a0a0a0;
  font-style: italic;
}
</style>
