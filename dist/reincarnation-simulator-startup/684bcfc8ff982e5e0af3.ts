import { createApp } from 'vue';
import App from './app.vue';
import { loadUserSelections } from './services/PersistenceService';
import { store } from './store';
import './styles/index.scss';
// @ts-ignore
if (typeof TavernHelper === 'undefined') {
    document.body.innerHTML =
        '<h1 style="color: red; text-align: center;">错误：此页面必须在 SillyTavern 扩展环境中运行。</h1>';
}
else {
    async function initializeApp() {
        try {
            // 尝试加载用户之前的选择
            const saved = loadUserSelections();
            if (saved) {
                if (saved.selections) {
                    Object.assign(store.selections, saved.selections);
                }
                if (saved.potentialPoints) {
                    Object.assign(store.potentialPoints, saved.potentialPoints);
                }
            }
            // 确保 stat_data 被加载，并根据其状态决定初始页面
            const messages = await TavernHelper.getChatMessages('0');
            const latestData = messages?.[0]?.data;
            if (latestData && latestData.stat_data && latestData.stat_data.世界) {
                const worlds = latestData.stat_data.世界;
                const mainWorldExists = Object.values(worlds).some(
                // @ts-ignore
                world => world?.定义?.元规则?.定位 === '主世界');
                if (mainWorldExists) {
                    console.log('检测到已存在的主世界，直接跳转至确认页面。');
                    store.currentPage = 7;
                }
            }
            console.log('Startup: Initial data loaded.');
            createApp(App).mount('#app-container');
        }
        catch (error) {
            console.error('Failed to initialize app:', error);
            document.body.innerHTML =
                '<h1 style="color: red; text-align: center;">错误：无法加载初始数据，请检查控制台。</h1>';
        }
    }
    initializeApp();
}
