<template>
  <div class="mall-app">
    <component :is="activeView" />
    <TabBar @navigate="navigateTo" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef } from 'vue';
import TabBar from '../../../components/mall/TabBar.vue';
import MallHomeView from './MallHomeView.vue';
import CartView from './CartView.vue';
import MyMallView from './MyMallView.vue';

const activeTab = ref('MallHomeView');

const activeView = shallowRef(MallHomeView);

const viewMap = {
  MallHomeView,
  CartView,
  MyMallView,
};

function navigateTo(viewName: keyof typeof viewMap) {
  activeTab.value = viewName;
  activeView.value = viewMap[viewName];
}
</script>

<style lang="scss">
@import '../../../styles/apps/mall.scss';

.mall-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
}
</style>