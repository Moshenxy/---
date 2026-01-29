<template>
  <div class="mall-home-view">
    <input type="text" v-model="searchQuery" placeholder="搜索商品..." class="search-bar" />
    <div class="top-section">
      <NewCategoryNav
        :categories="categories"
        :selected-category="selectedCategory"
        @select-category="selectCategory"
      />
      <PromotionBanner />
    </div>
    <div v-if="filteredProducts.length > 0" class="product-grid">
      <ProductCard v-for="product in filteredProducts" :key="product.ID" :product="product" @add-to-cart="addToCart" />
    </div>
    <div v-else class="no-results">没有找到相关商品。</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import NewCategoryNav from '../../../components/mall/NewCategoryNav.vue';
import ProductCard from '../../../components/mall/ProductCard.vue';
import PromotionBanner from '../../../components/mall/PromotionBanner.vue';
import { getProducts, Product } from '../../../services/ProductService';
import { actions } from '../../../store';

const products = ref<Product[]>([]);
const searchQuery = ref('');
const categories = ref<string[]>(['全部']);
const selectedCategory = ref('全部');

const filteredProducts = computed(() => {
  let result = products.value;

  if (selectedCategory.value !== '全部') {
    result = result.filter(p => p.分类 && p.分类.includes(selectedCategory.value));
  }

  if (searchQuery.value) {
    result = result.filter(p => p.名称.toLowerCase().includes(searchQuery.value.toLowerCase()));
  }

  return result;
});

onMounted(async () => {
  const allProducts = await getProducts();
  products.value = allProducts;

  if (allProducts.length > 0) {
    const allCategories = allProducts.flatMap(p => (p.分类 ? p.分类.split('-') : []));
    const uniqueCategories = ['全部', ...new Set(allCategories)];
    categories.value = uniqueCategories;
  }
});

function selectCategory(category: string) {
  selectedCategory.value = category;
}

function addToCart(product: Product) {
  actions.addToCart(product);
}
</script>

<style scoped lang="scss">
// 样式已迁移到 /styles/apps/mall.scss

.mall-home-view {
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.top-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  flex-grow: 1;
  overflow-y: auto;
  grid-auto-rows: max-content;
}

.no-results {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: #6c757d;
  margin-top: 2rem;
}
</style>
