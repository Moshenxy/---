import { createApp } from 'vue';
import { createMemoryHistory, createRouter, RouteRecordRaw } from 'vue-router';
import App from '../app.vue';
import CharacterView from '../views/CharacterView.vue';
import InventoryView from '../views/InventoryView.vue';
import MainContentView from '../views/MainContentView.vue';
import NpcListView from '../views/NpcListView.vue';
import WorldStateView from '../views/WorldStateView.vue';

// 路由配置
const routes: RouteRecordRaw[] = [
  { path: '/', component: MainContentView },
  { path: '/character', component: CharacterView },
  { path: '/npc-list', component: NpcListView },
  { path: '/inventory', component: InventoryView },
  { path: '/world-state', component: WorldStateView },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

// 默认路由
router.replace('/');

$(() => {
  createApp(App).use(router).mount('#app');
});
