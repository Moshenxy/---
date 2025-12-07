const CUSTOM_DATA_KEY = 'reincarnation_custom_data';

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