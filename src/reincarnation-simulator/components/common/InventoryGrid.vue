<template>
  <div class="inventory-grid">
    <div v-if="items.length > 0" class="grid-container">
      <div v-for="(item, index) in items" :key="index" class="item-cell">
        <span class="item-name">{{ item.名称 }}</span>
        <span v-if="item.数量" class="item-quantity">x{{ item.数量 }}</span>
      </div>
    </div>
    <div v-else class="empty-inventory">
      <p>空无一物</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  items: any[];
}>();
</script>

<style lang="scss" scoped>
@use '../../styles/theme/variables' as *;

.inventory-grid {
  width: 100%;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: $spacing-md;
}

.item-cell {
  position: relative;
  background-color: rgba($color-black-void, 0.4);
  border: 1px solid rgba($color-gold-liu, 0.2);
  border-radius: $border-radius-md;
  padding: $spacing-sm;
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: $font-size-small;
}

.item-name {
  color: $color-white-moon;
  font-weight: bold;
}

.item-quantity {
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-size: 10px;
  color: $color-grey-stone;
}

.empty-inventory {
  color: $color-grey-stone;
  text-align: center;
  padding: $spacing-lg 0;
}
</style>
