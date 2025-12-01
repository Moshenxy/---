import { reactive, computed, markRaw, Component } from 'vue';
import CharacterPanel from '../components/panels/CharacterPanel.vue';
import InventoryPanel from '../components/panels/InventoryPanel.vue';
import ImprintsPanel from '../components/panels/ImprintsPanel.vue';
import AvatarPanel from '../components/panels/avatar/AvatarCharacterPanel.vue';
import AvatarInventoryPanel from '../components/panels/avatar/AvatarInventoryPanel.vue';
import TasksPanel from '../components/panels/avatar/AvatarTasksPanel.vue';
import WorldDetailsPanel from '../components/panels/WorldDetailsPanel.vue';
import ReincarnationPanel from '../components/panels/ReincarnationPanel.vue';

interface ModalState {
  isVisible: boolean;
  view: {
    world: string;
    panel: string;
  } | null;
}

const panelMap: Record<string, Record<string, Component>> = {
  mainWorld: {
    character: CharacterPanel,
    inventory: InventoryPanel,
    imprints: ImprintsPanel,
    worldDetails: WorldDetailsPanel,
  },
  avatarWorld: {
    character: AvatarPanel,
    inventory: AvatarInventoryPanel,
    tasks: TasksPanel,
    worldDetails: WorldDetailsPanel,
  },
  reincarnation: {
    main: ReincarnationPanel,
  },
};

const state = reactive<ModalState>({
  isVisible: false,
  view: null,
});

export const modalService = {
  get state() {
    return state;
  },

  get component() {
    return computed(() => {
      if (!state.isVisible || !state.view) return null;
      const { world, panel } = state.view;
      const component = panelMap[world]?.[panel] ?? null;
      return component ? markRaw(component) : null;
    });
  },

  get worldType() {
      return computed(() => state.view?.world ?? '');
  },

  show(world: string, panel: string) {
    state.view = { world, panel };
    state.isVisible = true;
  },

  hide() {
    state.isVisible = false;
    // A small delay to allow for fade-out animations if added later
    setTimeout(() => {
        state.view = null;
    }, 300);
  },
};