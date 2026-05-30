import { reactive } from 'vue';

export const appNavigator = reactive({
  activeApp: null as string | null,
  activeChatId: null as string | null,

  openApp(appId: string, context?: any) {
    this.activeApp = appId;
    if (appId === 'tianhuachat' && context?.chatId) {
      this.activeChatId = context.chatId;
    }
  },

  closeApp() {
    this.activeApp = null;
    this.activeChatId = null;
  },
});
