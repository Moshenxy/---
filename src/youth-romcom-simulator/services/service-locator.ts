import type { saveLoadService } from './saveLoadService';
import type { inputModalActions, inputModalState } from './InputModalService';
import type { store, actions } from '../store';
import type { diarySynthesisService } from './DiarySynthesisService';

// 从导出的服务实例中推断其类型
export type SaveLoadService = typeof saveLoadService;
export type InputModalActions = typeof inputModalActions;
export type InputModalState = typeof inputModalState;
export type Store = typeof store;
export type Actions = typeof actions;
export type DiarySynthesisService = typeof diarySynthesisService;

interface ServiceRegistry {
  saveLoadService: SaveLoadService;
  inputModalActions: InputModalActions;
  inputModalState: InputModalState;
  store: Store;
  actions: Actions;
  diarySynthesisService: DiarySynthesisService;
}

const registry: Partial<ServiceRegistry> = {};

export const serviceLocator = {
  register<K extends keyof ServiceRegistry>(key: K, instance: ServiceRegistry[K]): void {
    registry[key] = instance;
  },
  get<K extends keyof ServiceRegistry>(key: K): NonNullable<ServiceRegistry[K]> {
    const instance = registry[key];
    if (!instance) {
      throw new Error(`Service with key "${key}" has not been registered.`);
    }
    return instance as NonNullable<ServiceRegistry[K]>;
  },
};
