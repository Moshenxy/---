<template>
  <div class="game-text-container">
    <template v-for="(segment, index) in segments" :key="index">
      <span :class="segment.class">{{ segment.text }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue';

interface TextSegment {
  text: string;
  class: string;
}

const props = defineProps({
  text: {
    type: String as PropType<string>,
    required: true,
  },
});

const segments = computed((): TextSegment[] => {
  if (!props.text) return [];

  // Strip any potential HTML tags from the input string first.
  const cleanText = props.text.replace(/<[^>]*>/g, '');

  const parsedSegments: TextSegment[] = [];
  let remainingText = cleanText;

  const regex = /(【【.*?】】)|(【.*?】)|(「.*?」)|(\*.*?\*)/g;
  let match;

  while ((match = regex.exec(remainingText)) !== null) {
    const matchedText = match[0];
    const preMatchText = remainingText.substring(0, match.index);

    if (preMatchText) {
      parsedSegments.push({ text: preMatchText, class: '' });
    }

    if (match[1]) { // 【【...】】
      parsedSegments.push({ text: matchedText.slice(2, -2), class: 'text-system-highlight' });
    } else if (match[2]) { // 【...】
      parsedSegments.push({ text: matchedText.slice(1, -1), class: 'text-scenery' });
    } else if (match[3]) { // 「...」
      parsedSegments.push({ text: matchedText.slice(1, -1), class: 'text-dialogue' });
    } else if (match[4]) { // *...*
      parsedSegments.push({ text: matchedText.slice(1, -1), class: 'text-psychology' });
    }
    
    remainingText = remainingText.substring(match.index + matchedText.length);
    regex.lastIndex = 0; // Reset regex index
  }

  if (remainingText) {
    parsedSegments.push({ text: remainingText, class: '' });
  }

  return parsedSegments;
});
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

.game-text-container {
  font-size: 15px;
  line-height: 1.8;
  color: #000000; // As per user request
  white-space: pre-wrap;

  .text-dialogue {
    color: $color-gold-liu;
  }

  .text-psychology {
    color: $color-purple-mystery;
    font-style: italic;
  }

  .text-scenery {
    color: $color-cyan-tian;
  }

  .text-system-highlight {
    color: $color-gold-liu;
    font-weight: bold;
  }
}
</style>