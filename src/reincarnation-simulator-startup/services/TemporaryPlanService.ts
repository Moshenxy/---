const STORAGE_KEY = 'reincarnation_temporary_plans';

export function saveTemporaryPlans(plans: any[]) {
  try {
    const plansJson = JSON.stringify(plans);
    localStorage.setItem(STORAGE_KEY, plansJson);
  } catch (error) {
    console.error('保存临时方案失败:', error);
  }
}

export function loadTemporaryPlans(): any[] | null {
  try {
    const plansJson = localStorage.getItem(STORAGE_KEY);
    if (plansJson) {
      return JSON.parse(plansJson);
    }
    return null;
  } catch (error) {
    console.error('加载临时方案失败:', error);
    return null;
  }
}

export function clearTemporaryPlans() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('清除临时方案失败:', error);
  }
}
