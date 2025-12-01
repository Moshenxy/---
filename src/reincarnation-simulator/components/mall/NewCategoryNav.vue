<template>
  <div class="category-nav-container">
    <div class="category-nav">
      <button 
        v-for="category in categories" 
        :key="category" 
        @click="$emit('selectCategory', category)"
        :class="{ active: selectedCategory === category }"
      >
        {{ category }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  categories: {
    type: Array as () => string[],
    required: true,
  },
  selectedCategory: {
    type: String,
    required: true,
  }
});
defineEmits(['selectCategory']);
</script>

<style scoped lang="scss">
.category-nav-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
}

.category-nav {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.75rem; /* 12px */
  padding: 0.5rem 0;
  
  button {
    white-space: nowrap;
    padding: 0.5rem 1rem; /* 8px 16px */
    border-radius: 9999px;
    border: 1px solid #e5e7eb; /* cool-gray-200 */
    background-color: #f9fafb; /* cool-gray-50 */
    color: #374151; /* cool-gray-700 */
    font-size: 0.875rem; /* 14px */
    cursor: pointer;
    transition: all 0.2s ease-in-out;

    &:hover {
      background-color: #f3f4f6; /* cool-gray-100 */
    }
    
    &.active {
      background-color: #4f46e5; /* indigo-600 */
      color: white;
      border-color: #4f46e5; /* indigo-600 */
      font-weight: 600;
    }
  }
}
</style>