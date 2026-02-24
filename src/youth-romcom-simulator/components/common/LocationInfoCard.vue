<template>
  <div class="location-info-card" v-if="locationDetails">
    <div class="info-grid">
      <div class="info-item">
        <strong>类型</strong>
        <span>{{ cleanValue(locationDetails.层级类型) }}</span>
      </div>
      <div class="info-item">
        <strong>所属</strong>
        <span>{{ parentLocationName }}</span>
      </div>
      <div class="info-item">
        <strong>面积</strong>
        <span>{{ formatArea(locationDetails.面积) }}</span>
      </div>
      <div class="info-item">
        <strong>相对坐标</strong>
        <span>{{ formatCoordinates(locationDetails.相对坐标) }}</span>
      </div>
      <div class="info-item full-width">
        <strong>描述</strong>
        <span>{{ cleanValue(locationDetails.描述) }}</span>
      </div>
    </div>
  </div>
  <div v-else class="loading-placeholder">正在获取地点信息...</div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue';
import { npcService } from '../../services/NpcService';
import { store } from '../../store';
import { get } from 'lodash';

const props = defineProps({
  locationId: {
    type: String as PropType<string>,
    required: true,
  },
});

const locationDetails = computed(() => {
  if (!props.locationId || !store.worldState) return null;
  return get(store.worldState, `地点.${props.locationId}`) as any;
});

const parentLocationName = computed(() => {
  if (!locationDetails.value) return '未知';
  return npcService.getParentLocationName(props.locationId);
});

const cleanValue = (value: any) => {
  if (typeof value !== 'string') return value;
  return value.replace(/["'\[\]]/g, '');
};

const formatArea = (area: any) => {
  if (!area) return '未知';
  if (Array.isArray(area)) {
    return area.join(' ');
  }
  const cleaned = cleanValue(String(area));
  const parts = cleaned.split(',');
  return parts.join(' ');
};

const formatCoordinates = (coords: any) => {
  if (!coords) return '未知';
  try {
    const refId = cleanValue(coords.参考ID);
    const refName = npcService.getLocationName(refId);

    const bearingString = cleanValue(coords.方位);
    const bearingParts = bearingString.split(',');
    const direction = bearingParts[0] || '';
    const angle = bearingParts[1] || '';

    const distanceString = cleanValue(String(coords.距离));
    const distanceParts = distanceString.split(',');
    const value = distanceParts[0] || '';
    const unit = distanceParts[1] || '';

    return `距 ${refName} ${value}${unit} ${direction}${angle}°`;
  } catch (e) {
    console.error('Error formatting coordinates:', e);
    return '解析错误';
  }
};
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

.location-info-card {
  padding: $spacing-md;
  min-width: 300px;

  h4 {
    color: $color-gold-pale;
    font-family: $font-family-title;
    font-size: $font-size-h3;
    margin-top: 0;
    margin-bottom: $spacing-lg;
    border-bottom: 1px solid rgba($color-gold-liu, 0.2);
    padding-bottom: $spacing-md;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-lg;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;

    strong {
      font-family: $font-family-main;
      color: $color-gold-pale;
      font-size: 12px; // Use direct value instead of variable
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.7;
    }

    span {
      font-size: 14px; // Use direct value instead of variable
      color: $color-white-moon;
      line-height: 1.6;
    }

    &.full-width {
      grid-column: 1 / -1;
    }
  }
}

.loading-placeholder {
  padding: $spacing-xl;
  color: $color-grey-stone;
  text-align: center;
}
</style>
