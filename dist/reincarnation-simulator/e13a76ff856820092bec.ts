import './core/vue-loader';
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css';
import './styles/main.scss';
import { saveLoadService } from './services/saveLoadService';
import { commandService } from './services/CommandService';
import { tavernService } from './services/tavern';
import { npcService } from './services/NpcService';
// 初始化核心服务
async function initializeServices() {
    await npcService.initializeWorldAndLocationData();
    // 其他需要异步初始化的服务可以放在这里
}
saveLoadService;
commandService;
tavernService;
initializeServices().then(() => {
    console.log('All services initialized.');
});
console.log('Reincarnation Simulator UI loaded.');
