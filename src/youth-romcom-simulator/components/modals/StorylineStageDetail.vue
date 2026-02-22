<template>
  <div class="storyline-stage-detail">
    <div v-if="stage.阶段背景 && stage.阶段背景.length > 0" class="detail-block">
      <strong>阶段背景</strong>
      <p>{{ stage.阶段背景.join(' ') }}</p>
    </div>
    <div v-if="stage.key_characters || stage.关键人物" class="detail-block">
      <strong>关键人物</strong>
      <p>{{ (stage.key_characters || stage.关键人物)?.join(', ') }}</p>
    </div>
    <div v-if="stage.key_locations || stage.关键地点" class="detail-block">
      <strong>关键地点</strong>
      <p>{{ (stage.key_locations || stage.关键地点)?.join(', ') }}</p>
    </div>
    <div v-if="stage.key_items || stage.关键道具" class="detail-block">
      <strong>关键道具</strong>
      <p>{{ (stage.key_items || stage.关键道具)?.join(', ') }}</p>
    </div>
    <div v-if="stage.关键情节 && stage.关键情节.length > 0" class="detail-block">
      <strong>关键情节</strong>
      <ul class="key-points-list">
        <li v-for="point in stage.关键情节" :key="point.id">{{ point.描述 }}</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { DisplayStoryStage } from '../../services/StorylineService';

export default defineComponent({
  name: 'StorylineStageDetail',
  props: {
    stage: {
      type: Object as PropType<DisplayStoryStage>,
      required: true,
    },
  },
});
</script>

<style lang="scss">
@use '../../styles/theme/variables' as *;

.storyline-stage-detail {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  .detail-block {
    strong {
      display: block;
      color: $color-gold-pale;
      font-weight: bold;
      font-family: $font-family-title;
      font-size: $font-size-large;
      margin-bottom: $spacing-sm;
      padding-bottom: $spacing-xs;
      border-bottom: 1px solid rgba($color-gold-liu, 0.3);
    }

    p,
    span {
      color: $color-white-moon;
      line-height: $line-height-base;
      margin: 0;
    }

    .key-points-list {
      list-style-type: disc;
      padding-left: $spacing-lg;
      margin: 0;
      color: $color-white-moon;
      li {
        margin-bottom: $spacing-sm;
      }
    }
  }
}
</style>
