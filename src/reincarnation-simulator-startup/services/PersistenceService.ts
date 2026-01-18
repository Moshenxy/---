import { Selections, PotentialPoints } from '../types/world';

const CUSTOM_DATA_KEY = 'reincarnation_custom_data';
const SELECTIONS_STORAGE_KEY = 'reincarnation_user_selections';

type CustomDataType = {
  blueprints: any[];
  tones: any[];
  tags: any[];
  relics: any[];
  identities: any[];
  talents: any[];
};

export function loadCustomData(): Partial<CustomDataType> {
  try {
    const data = localStorage.getItem(CUSTOM_DATA_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('加载自定义数据失败:', error);
  }
  return {};
}

export function saveCustomData(data: Partial<CustomDataType>) {
  try {
    localStorage.setItem(CUSTOM_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('保存自定义数据失败:', error);
  }
}

/**
 * 保存用户的选择到本地存储。
 * @param selections - 用户的选择对象。
 * @param potentialPoints - 用户的潜力点分配。
 */
export function saveUserSelections(selections: Selections, potentialPoints: PotentialPoints) {
  try {
    const dataToSave = {
      selections,
      potentialPoints,
    };
    localStorage.setItem(SELECTIONS_STORAGE_KEY, JSON.stringify(dataToSave));
    console.log('[PersistenceService] User selections saved to localStorage.');
  } catch (error) {
    console.error('Failed to save user selections to localStorage:', error);
  }
}

/**
 * 从本地存储中加载用户之前的选择。
 * @returns 加载的数据，如果不存在或出错则返回 null。
 */
export function loadUserSelections(): { selections: Selections; potentialPoints: PotentialPoints } | null {
  try {
    const savedData = localStorage.getItem(SELECTIONS_STORAGE_KEY);
    if (savedData) {
      console.log('[PersistenceService] User selections loaded from localStorage.');
      return JSON.parse(savedData);
    }
  } catch (error) {
    console.error('Failed to load user selections from localStorage:', error);
  }
  return null;
}
