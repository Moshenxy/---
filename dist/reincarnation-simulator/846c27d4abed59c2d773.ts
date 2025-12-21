import './core/vue-loader';
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css';
import './styles/main.scss';
import { saveLoadService } from './services/saveLoadService';
import { commandService } from './services/CommandService';
import { tavernService } from './services/tavern';
import { npcService } from './services/NpcService';
import { entityIndexService } from './services/EntityIndexService';
import { store, actions } from './store';
import { watch } from 'vue';
import { serviceLocator } from './services/service-locator';
import { inputModalActions, inputModalState } from './services/InputModalService';
// 初始化核心服务
async function initializeServices() {
    // 注册所有服务
    serviceLocator.register('saveLoadService', saveLoadService);
    serviceLocator.register('inputModalState', inputModalState);
    serviceLocator.register('inputModalActions', inputModalActions);
    serviceLocator.register('store', store);
    serviceLocator.register('actions', actions);
    await npcService.initializeWorldAndLocationData();
    // 等待 worldState 加载完毕
    if (!store.worldState) {
        await new Promise(resolve => {
            const unwatch = watch(() => store.worldState, newValue => {
                if (newValue) {
                    unwatch();
                    resolve(true);
                }
            });
        });
    }
    await entityIndexService.buildIndex(store.worldState);
    // 其他需要异步初始化的服务可以放在这里
}
initializeServices().then(() => {
    console.log('All services initialized.');
});
// 这几个服务实例只需要被导入以确保其构造函数被执行
saveLoadService;
commandService;
tavernService;
