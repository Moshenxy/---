import { reactive, ref } from 'vue';
import { lorebookService } from './LorebookService';

const LOREBOOK_ENTRY_NAME = '手机壁纸';

class SmartphoneService {
  private state = reactive({
    wallpaperContent: '',
    isLoading: false,
    error: null as string | null,
  });

  public readonly wallpaperContent = ref('');

  async fetchWallpaperContent() {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      let content = await lorebookService.readFromLorebook(LOREBOOK_ENTRY_NAME, true);
      // 清理URL，移除可能存在的BBCode标签
      if (content) {
        content = content.replace(/\[\/?img\]/g, '').trim();
      }
      this.wallpaperContent.value = content || '“即便如此，我还是想要真物。”';
      this.state.wallpaperContent = content || '“即便如此，我还是想要真物。”';
    } catch (e: any) {
      this.state.error = e.message || 'Failed to fetch wallpaper content.';
      console.error(this.state.error);
      this.wallpaperContent.value = '“即便如此，我还是想要真物。”'; // Fallback content
    } finally {
      this.state.isLoading = false;
    }
  }

  getState() {
    return this.state;
  }
}

export const smartphoneService = new SmartphoneService();
