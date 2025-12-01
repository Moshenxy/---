import * as toastr from 'toastr';
import { lorebookService } from './LorebookService';
import { store } from '../store';

const LOREBOOK_NAME = '轮回-诸天万界';
const SAVE_SLOT_PREFIX = '存档-';
const MAX_MANUAL_SAVES = 5;
const AUTO_SAVE_SLOTS = ['自动-A', '自动-B'];
const LOREBOOK_KEYS_TO_BACKUP: string[] = [
  '主世界',
  '化身世界',
  '主世界摘要',
  '化身世界摘要',
  '[系统]长期记忆',
  '[系统]短期记忆',
  '[系统]瞬时记忆',
  '本世历程',
  '往世涟漪',
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
  public turnCounter: number = 0;
  public isAutoSaveEnabled: boolean = true;
  private autoSaveInterval: any;

  constructor() {
    this.initializeSlots();
    this.loadAutoSaveState();
    this.loadTurnCounter();
  }

  private initializeSlots() {
    for (let i = 1; i <= MAX_MANUAL_SAVES; i++) {
      this.manualSlots.push({ id: `手动-${i}`, name: `手动存档 ${i}`, timestamp: null, data: null });
    }
    for (const id of AUTO_SAVE_SLOTS) {
      this.autoSlots.push({ id, name: `自动存档 ${id.split('-')[1]}`, timestamp: null, data: null });
    }
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
    } catch (error) {
      console.error('加载存档槽位时出错:', error);
      toastr.error('加载存档列表失败。');
    }
  }

  async saveGame(slotId: string, isAutoSave = false) {
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
        await TavernHelper.setLorebookEntries(LOREBOOK_NAME, [{ uid: existingEntry.uid, content: JSON.stringify(saveData, null, 2) }]);
      } else {
        await TavernHelper.createLorebookEntries(LOREBOOK_NAME, [{
          comment: comment,
          content: JSON.stringify(saveData, null, 2),
          keys: [comment],
          position: 'after_character_definition',
          order: 200,
        }]);
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

  async loadGame(slot: SaveSlot) {
    if (!slot.data || !slot.data.mvu_data) {
      toastr.error('无法读取空存档或损坏的存档。');
      return;
    }
    if (!confirm(`确定要读取存档 [${slot.name}] 吗？当前所有未保存的进度将会被覆盖。`)) {
      return;
    }
    toastr.info(`正在从 [${slot.name}] 读取存档...`);
    try {
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
    link.download = `[轮回模拟器]存档-${slot.name}-${new Date().toISOString()}.json`;
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
        await TavernHelper.setLorebookEntries(LOREBOOK_NAME, [{ uid: existingEntry.uid, content: JSON.stringify(saveData, null, 2) }]);
      } else {
        await TavernHelper.createLorebookEntries(LOREBOOK_NAME, [{
          comment: comment,
          content: JSON.stringify(saveData, null, 2),
          keys: [comment],
          position: 'after_character_definition',
          order: 200,
          enabled: false, // 默认禁用
        }]);
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
