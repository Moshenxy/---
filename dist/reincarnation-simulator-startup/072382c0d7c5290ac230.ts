import { createApp } from 'vue';
import App from './app.vue';
import './styles/index.scss';
// @ts-ignore
if (typeof TavernHelper === 'undefined') {
    document.body.innerHTML =
        '<h1 style="color: red; text-align: center;">错误：此页面必须在 SillyTavern 扩展环境中运行。</h1>';
}
else {
    async function initializeApp() {
        try {
            // 确保 stat_data 被加载
            await TavernHelper.getChatMessages('0');
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
