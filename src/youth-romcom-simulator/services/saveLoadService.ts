import * as toastr from 'toastr';
import { lorebookService } from './LorebookService';
import { serviceLocator } from './service-locator';

const LOREBOOK_NAME = '综漫-春物';
const SAVE_SLOT_PREFIX = '存档-';
const MAX_MANUAL_SAVES = 5;
const AUTO_SAVE_SLOTS = ['自动-A', '自动-B'];
const REROLL_SAVE_SLOT_ID = '自动-重来';
const LOREBOOK_KEYS_TO_BACKUP: string[] = [
  '[系统]长期记忆',
  '[系统]短期记忆',
  '[系统]瞬时记忆',
  '本世历程',
  // 根据需要可以添加更多需要备份的世界书条目
];

export interface SaveSlot {
  id: string;
  name: string;
  timestamp: string | null;
  data: any | null;
  entryUid?: number;
  worldLogDate?: string | null;
  worldLogTitle?: string | null;
}

class SaveLoadService {
  public manualSlots: SaveSlot[] = [];
  public autoSlots: SaveSlot[] = [];
  public rerollSlot: SaveSlot | null = null;
  public turnCounter: number = 0;
  public isAutoSaveEnabled: boolean = true;
  private autoSaveInterval: any;
  private areSlotsLoaded = false;

  constructor() {
    this.initializeSlots();
    this.loadAutoSaveState();
    this.loadTurnCounter();
    // 构造函数中不再立即加载，改为按需加载
  }

  private async ensureSlotsLoaded() {
    if (!this.areSlotsLoaded) {
      await this.loadAllSaveSlots();
      this.areSlotsLoaded = true;
    }
  }

  private initializeSlots() {
    for (let i = 1; i <= MAX_MANUAL_SAVES; i++) {
      this.manualSlots.push({ id: `手动-${i}`, name: `手动存档 ${i}`, timestamp: null, data: null });
    }
    for (const id of AUTO_SAVE_SLOTS) {
      this.autoSlots.push({ id, name: `自动存档 ${id.split('-')[1]}`, timestamp: null, data: null });
    }
    this.rerollSlot = { id: REROLL_SAVE_SLOT_ID, name: '重来存档', timestamp: null, data: null };
  }

  async loadAllSaveSlots() {
    try {
      const allEntries = await TavernHelper.getLorebookEntries(LOREBOOK_NAME);
      if (!allEntries) return;

      const updateSlot = (slot: SaveSlot) => {
        const entry = allEntries.find((e: any) => e.comment === `${SAVE_SLOT_PREFIX}${slot.id}`);
        if (entry && entry.content) {
          try {
            slot.data = JSON.parse(entry.content);
            slot.timestamp = slot.data.timestamp;
            slot.worldLogDate = slot.data.worldLogDate;
            slot.worldLogTitle = slot.data.worldLogTitle;
            slot.entryUid = entry.uid;
          } catch (e) {
            console.error(`解析存档 ${slot.id} 失败:`, e);
            slot.timestamp = '数据损坏';
            slot.data = null;
          }
        } else {
          slot.timestamp = null;
          slot.data = null;
          slot.entryUid = undefined;
        }
      };

      this.manualSlots.forEach(updateSlot);
      this.autoSlots.forEach(updateSlot);
      if (this.rerollSlot) {
        updateSlot(this.rerollSlot);
      }
    } catch (error) {
      console.error('加载存档槽位时出错:', error);
      toastr.error('加载存档列表失败。');
    }
  }

  async saveGame(slotId: string, isAutoSave = false) {
    await this.ensureSlotsLoaded(); // 在保存前确保槽位数据已加载
    if (!isAutoSave) {
      toastr.info(`正在保存到槽位 [${slotId}]...`);
    }

    try {
      const messages = await TavernHelper.getChatMessages('0');
      if (!messages || messages.length === 0) {
        throw new Error('无法获取当前聊天状态，无法保存。');
      }
      const messageZero = messages[0];
      const timestamp = new Date().toISOString();

      const lorebookBackup: { [key: string]: string } = {};
      for (const key of LOREBOOK_KEYS_TO_BACKUP) {
        const content = await lorebookService.readFromLorebook(key);
        lorebookBackup[key] = content ?? '';
      }

      const store = serviceLocator.get('store');
      const lastLogEntry = store.worldLog.length > 0 ? store.worldLog[store.worldLog.length - 1] : null;

      const saveData = {
        timestamp,
        mvu_data: messageZero.data,
        message_content: messageZero.message,
        lorebook_backup: lorebookBackup,
        worldLogDate: lastLogEntry?.日期,
        worldLogTitle: lastLogEntry?.标题,
      };

      const comment = `${SAVE_SLOT_PREFIX}${slotId}`;
      const allEntries = await TavernHelper.getLorebookEntries(LOREBOOK_NAME);
      const existingEntry = allEntries.find((e: any) => e.comment === comment);

      if (existingEntry) {
        await TavernHelper.setLorebookEntries(LOREBOOK_NAME, [
          { uid: existingEntry.uid, content: JSON.stringify(saveData, null, 2) },
        ]);
      } else {
        await TavernHelper.createLorebookEntries(LOREBOOK_NAME, [
          {
            comment: comment,
            content: JSON.stringify(saveData, null, 2),
            keys: [comment],
            position: 'after_character_definition',
            order: 200,
          },
        ]);
      }

      await this.loadAllSaveSlots();
      if (!isAutoSave) {
        toastr.success(`游戏已成功保存至 [${slotId}]！`);
      } else {
        console.log(`[AutoSave] 成功自动存档至 ${slotId}`);
      }
    } catch (error) {
      const errorMessage = `保存失败: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`保存游戏到槽位 ${slotId} 时出错:`, error);
      if (!isAutoSave) {
        toastr.error(errorMessage);
      }
    }
  }

  private async _internalLoadGame(slot: SaveSlot) {
    if (!slot.data || !slot.data.mvu_data) {
      throw new Error('无法读取空存档或损坏的存档。');
    }
    if (slot.data.lorebook_backup) {
      for (const key in slot.data.lorebook_backup) {
        await lorebookService.writeToLorebook(key, slot.data.lorebook_backup[key]);
      }
    }
    const messages = await TavernHelper.getChatMessages('0');
    const messageZero = messages[0] || {};
    messageZero.data = slot.data.mvu_data;
    messageZero.message = slot.data.message_content;
    await TavernHelper.setChatMessages([messageZero], { refresh: 'all' });
  }

  async loadGame(slot: SaveSlot) {
    if (!confirm(`确定要读取存档 [${slot.name}] 吗？当前所有未保存的进度将会被覆盖。`)) {
      return;
    }
    toastr.info(`正在从 [${slot.name}] 读取存档...`);
    try {
      await this._internalLoadGame(slot);
      toastr.success(`已成功从 [${slot.name}] 读取存档！游戏即将刷新...`);
    } catch (error) {
      const errorMessage = `读档失败: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`读取游戏存档 ${slot.name} 时出错:`, error);
      toastr.error(errorMessage);
    }
  }

  async deleteSave(slot: SaveSlot) {
    if (!slot.entryUid) {
      toastr.warning('这是一个空槽位，无需删除。');
      return;
    }
    if (!confirm(`你确定要永久删除存档 [${slot.name}] 吗？\n此操作不可撤销。`)) {
      return;
    }
    toastr.info(`正在删除存档 [${slot.name}]...`);
    try {
      await TavernHelper.deleteLorebookEntries(LOREBOOK_NAME, [slot.entryUid]);
      await this.loadAllSaveSlots();
      toastr.success(`存档 [${slot.name}] 已被删除。`);
    } catch (error) {
      console.error(`删除存档 ${slot.name} 时出错:`, error);
      toastr.error(`删除失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async performAutoSave() {
    if (!this.isAutoSaveEnabled) return;

    this.turnCounter++;
    localStorage.setItem('tianhua_turn_counter', this.turnCounter.toString());
    const slotId = this.turnCounter % 2 === 1 ? AUTO_SAVE_SLOTS[0] : AUTO_SAVE_SLOTS[1];
    await this.saveGame(slotId, true);
  }

  async saveStateForReroll() {
    console.log('[Reroll] Saving state for potential reroll...');
    await this.saveGame(REROLL_SAVE_SLOT_ID, true);
  }

  async loadRerollState() {
    await this.ensureSlotsLoaded(); // 在加载前确保槽位数据已加载

    if (!this.rerollSlot || !this.rerollSlot.data) {
      toastr.error('没有可用于“重来”的存档点。');
      throw new Error('No reroll save state found.');
    }
    console.log('[Reroll] Loading state for reroll and setting restore flag...');

    // 设置一个标志，以便在页面重新加载后恢复输入
    localStorage.setItem('reincarnation-simulator-restore-input', 'true');

    // 直接调用内部加载函数，跳过用户确认
    await this._internalLoadGame(this.rerollSlot);
    // 短暂延迟后刷新页面，确保状态完全应用
    setTimeout(() => window.location.reload(), 500);
  }

  exportSave(slot: SaveSlot) {
    if (!slot.data) {
      toastr.warning('无法导出空存档。');
      return;
    }
    const dataStr = JSON.stringify(slot.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `[综漫-春物]存档-${slot.name}-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toastr.success(`存档 [${slot.name}] 已导出。`);
  }

  async importSave(jsonContent: string) {
    try {
      const saveData = JSON.parse(jsonContent);
      if (!saveData.timestamp || !saveData.mvu_data) {
        throw new Error('存档文件格式不正确。');
      }

      const emptySlot = this.manualSlots.find(slot => !slot.data);
      if (!emptySlot) {
        toastr.error('没有空的手动存档槽位可用于导入。');
        return;
      }

      toastr.info(`正在导入存档到槽位 [${emptySlot.name}]...`);

      const comment = `${SAVE_SLOT_PREFIX}${emptySlot.id}`;
      const allEntries = await TavernHelper.getLorebookEntries(LOREBOOK_NAME);
      const existingEntry = allEntries.find((e: any) => e.comment === comment);

      if (existingEntry) {
        await TavernHelper.setLorebookEntries(LOREBOOK_NAME, [
          { uid: existingEntry.uid, content: JSON.stringify(saveData, null, 2) },
        ]);
      } else {
        await TavernHelper.createLorebookEntries(LOREBOOK_NAME, [
          {
            comment: comment,
            content: JSON.stringify(saveData, null, 2),
            keys: [comment],
            position: 'after_character_definition',
            order: 200,
            enabled: false, // 默认禁用
          },
        ]);
      }

      await this.loadAllSaveSlots();
      toastr.success(`存档已成功导入至 [${emptySlot.name}]！`);
    } catch (error) {
      const errorMessage = `导入失败: ${error instanceof Error ? error.message : String(error)}`;
      console.error('导入存档时出错:', error);
      toastr.error(errorMessage);
    }
  }

  toggleAutoSave(enabled: boolean) {
    this.isAutoSaveEnabled = enabled;
    localStorage.setItem('tianhua_auto_save_enabled', JSON.stringify(enabled));
    toastr.info(`自动存档已${enabled ? '开启' : '关闭'}`);
  }

  private loadAutoSaveState() {
    const savedState = localStorage.getItem('tianhua_auto_save_enabled');
    if (savedState !== null) {
      this.isAutoSaveEnabled = JSON.parse(savedState);
    }
  }

  private loadTurnCounter() {
    const savedCounter = localStorage.getItem('tianhua_turn_counter');
    if (savedCounter !== null) {
      this.turnCounter = parseInt(savedCounter, 10) || 0;
    }
  }
}

export const saveLoadService = new SaveLoadService();
