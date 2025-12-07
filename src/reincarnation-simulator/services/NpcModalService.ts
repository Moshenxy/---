import { reactive, markRaw } from 'vue';
import NpcListModal from '../components/modals/NpcListModal.vue';

interface NpcModalState {
  isVisible: boolean;
  title: string;
  props: { worldId: string };
}

const state = reactive<NpcModalState>({
  isVisible: false,
  title: '',
  props: { worldId: '' },
});

const show = (worldId: string) => {
  state.title = 'NPC 列表';
  state.props = { worldId };
  // 虽然我们只有一个固定的组件，但为了与 DetailModalService 保持一致，我们还是在这里引用它
  // state.component = markRaw(NpcListModal); 
  state.isVisible = true;
};

const hide = () => {
  state.isVisible = false;
};

export const npcModalService = {
  state,
  show,
  hide,
};
