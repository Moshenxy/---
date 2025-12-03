<template>
  <div class="guixu-root-container" :class="{ 'web-fullscreen': isWebFullscreen }">
    <TopStatusBar />
    <div class="main-layout">
      <MainView />
      <DockManager />
    </div>

    <!-- Radial Menu Modal -->
    <div v-if="radialMenu.isVisible" class="modal-overlay" @click.self="closeRadialMenu">
      <RadialMenu :options="radialMenu.options" @close="closeRadialMenu" />
    </div>

    <!-- Global Confirmation Modal -->
    <div v-if="confirmation.isVisible" class="modal-overlay" @click.self="confirmationService.hide()">
      <div class="modal-content confirmation-modal">
        <h3 class="confirmation-title">{{ confirmation.title }}</h3>
        <p class="confirmation-message">{{ confirmation.message }}</p>
        <div class="confirmation-buttons">
          <button @click="confirmationService.hide()">取消</button>
          <button class="primary" @click="confirmationService.confirm()">确认</button>
        </div>
      </div>
    </div>

    <!-- Global Detail Modal -->
    <div v-if="detailModal.isVisible" class="modal-overlay" @click.self="detailModalService.hide()">
      <div class="modal-content detail-modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ detailModal.title }}</h3>
          <button class="close-button" @click="detailModalService.hide()">×</button>
        </div>
        <div class="modal-body">
          <component :is="detailModal.component" v-bind="detailModal.props" />
        </div>
      </div>
    </div>
    <LoadingIndicator v-if="store.isGenerating" :error="store.generationError" />

    <!-- Global NPC List Modal -->
    <div v-if="npcModal.isVisible" class="modal-overlay" @click.self="npcModalService.hide()">
      <div class="modal-content detail-modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ npcModal.title }}</h3>
          <button class="close-button" @click="npcModalService.hide()">×</button>
        </div>
        <div class="modal-body">
          <NpcListModal v-bind="npcModal.props" />
        </div>
      </div>
    </div>

    <!-- Global Input Modal -->
    <div v-if="inputModal.isVisible" class="modal-overlay input-modal-overlay" @click.self="inputModalActions.hide()">
      <div class="modal-content input-modal-content">
        <div class="input-area-container">
          <ActionPanel
            v-if="isActionPanelVisible"
            :command-count="commandCount"
            @open-main-menu="openRadialMenu('left')"
            @open-avatar-menu="openRadialMenu('right')"
            @toggle-history="toggleHistory"
            @toggle-commands="toggleCommandQueue"
          />
          <div class="input-area-with-buttons">
            <EnhancedInputBox @submit-action="handleSubmit" @toggle-action-panel="toggleActionPanel" />
          </div>
          <InputHistoryPopup v-if="isHistoryVisible" @close="toggleHistory" @select-entry="selectHistoryEntry" />
          <div v-if="isQueueVisible" class="command-queue-popup">
            <div v-if="commandCount > 0" class="command-list">
              <div v-for="(cmd, index) in commands" :key="index" class="command-item">
                {{ cmd }}
              </div>
            </div>
            <div v-else class="empty-queue">暂无待执行指令。</div>
            <button class="clear-button" @click="clearCommands" v-if="commandCount > 0">清空指令</button>
          </div>
        </div>
      </div>
    </div>
    <NotificationContainer />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref } from 'vue';
import ActionPanel from './components/common/ActionPanel.vue';
import EnhancedInputBox from './components/common/EnhancedInputBox.vue';
import InputHistoryPopup from './components/common/InputHistoryPopup.vue';
import NotificationContainer from './components/common/NotificationContainer.vue';
import RadialMenu from './components/controls/RadialMenu.vue';
import SideMenuButton from './components/controls/SideMenuButton.vue';
import DockManager from './components/DockManager.vue';
import LoadingIndicator from './components/LoadingIndicator.vue';
import NpcListModal from './components/modals/NpcListModal.vue';
import TopStatusBar from './components/TopStatusBar.vue';
import WorldTimeDisplay from './components/WorldTimeDisplay.vue';
import MainView from './MainView.vue';
import { commandService } from './services/CommandService';
import { confirmationService } from './services/ConfirmationService';
import { detailModalService } from './services/DetailModalService';
import { dockManagerService } from './services/DockManagerService';
import { inputModalActions, inputModalState } from './services/InputModalService';
import { npcModalService } from './services/NpcModalService';
import { saveLoadService } from './services/saveLoadService';
import { usePanelManager } from './services/usePanelManager';
import { actions, store } from './store';
import { isSimulationRunning } from './store/getters';
import { uiActions, uiState } from './store/ui';

interface MenuOption {
  id: string;
  icon: string;
  text: string;
  action: () => void;
  disabled?: () => boolean;
}

export default defineComponent({
  name: 'App',
  components: {
    DockManager,
    EnhancedInputBox,
    LoadingIndicator,
    MainView,
    NpcListModal,
    TopStatusBar,
    WorldTimeDisplay,
    SideMenuButton,
    RadialMenu,
    NotificationContainer,
    ActionPanel,
    InputHistoryPopup,
  },
  setup() {
    const { openPanel } = usePanelManager();

    const confirmation = computed(() => confirmationService.state);
    const detailModal = computed(() => detailModalService.state);
    const npcModal = computed(() => npcModalService.state);
    const isWebFullscreen = computed(() => uiState.isWebFullscreen);
    const inputModal = computed(() => inputModalState);

    const isActionPanelVisible = ref(false);
    const isHistoryVisible = ref(false);
    const isQueueVisible = ref(false);
    const commands = ref<string[]>([]);
    const commandCount = computed(() => commands.value.length);

    const radialMenu = reactive({
      isVisible: false,
      options: [] as MenuOption[],
    });

    const menuOptions: { left: MenuOption[]; right: MenuOption[] } = {
      left: [
        { id: 'character', icon: '人', text: '本体', action: () => openPanel('mainWorld', 'character') },
        { id: 'inventory', icon: '物', text: '背包', action: () => openPanel('mainWorld', 'inventory') },
        { id: 'skills', icon: '技', text: '技艺', action: () => openPanel('mainWorld', 'skills') },
        { id: 'imprints', icon: '印', text: '烙印', action: () => openPanel('mainWorld', 'imprints') },
        { id: 'worldDetails', icon: '世', text: '详情', action: () => openPanel('mainWorld', 'worldDetails') },
        { id: 'sandbox', icon: '盘', text: '沙盘', action: () => openPanel('mainWorld', 'sandbox') },
        { id: 'reincarnation', icon: '轮', text: '轮回', action: () => openPanel('reincarnation', 'main') },
        { id: 'unpin', icon: '固', text: '取消', action: () => uiActions.unpinAllPanels() },
      ],
      right: [
        {
          id: 'character',
          icon: '身',
          text: '化身',
          action: () => openPanel('avatarWorld', 'character'),
          disabled: () => !isSimulationRunning.value,
        },
        {
          id: 'inventory',
          icon: '囊',
          text: '背包',
          action: () => openPanel('avatarWorld', 'inventory'),
          disabled: () => !isSimulationRunning.value,
        },
        {
          id: 'tasks',
          icon: '命',
          text: '任务',
          action: () => openPanel('avatarWorld', 'tasks'),
          disabled: () => !isSimulationRunning.value,
        },
        {
          id: 'worldDetails',
          icon: '界',
          text: '详情',
          action: () => openPanel('avatarWorld', 'worldDetails'),
          disabled: () => !isSimulationRunning.value,
        },
        {
          id: 'sandbox',
          icon: '盘',
          text: '沙盘',
          action: () => openPanel('avatarWorld', 'sandbox'),
          disabled: () => !isSimulationRunning.value,
        },
        { id: 'npcDirectory', icon: '众', text: '名录', action: () => openPanel('allWorlds', 'npcDirectory') },
        { id: 'unpin', icon: '固', text: '取消', action: () => uiActions.unpinAllPanels() },
      ],
    };

    const handleOverlayClick = () => {
      if (radialMenu.isVisible) {
        closeRadialMenu();
        return;
      }
      if (inputModal.value.isVisible) {
        inputModalActions.hide();
        return;
      }
    };

    const openRadialMenu = (side: 'left' | 'right') => {
      radialMenu.options = menuOptions[side];
      radialMenu.isVisible = true;
    };

    const closeRadialMenu = () => {
      radialMenu.isVisible = false;
    };

    const handleAction = async (actionContent: string) => {
      console.log('Submitting to AI:', actionContent);
      await actions.handleAction(actionContent);
      await saveLoadService.performAutoSave();
    };

    const handleSubmit = async (actionContent: string) => {
      // Correctly save the raw input value before it gets cleared.
      const rawInput = inputModal.value.inputValue;
      inputModalActions.setLastSubmittedValue(rawInput);

      await handleAction(actionContent);

      inputModalActions.hide();
      inputModalActions.clearValue();
    };

    const toggleActionPanel = () => {
      isActionPanelVisible.value = !isActionPanelVisible.value;
    };

    const updateCommands = () => {
      commands.value = commandService.getCommands();
    };

    const clearCommands = () => {
      commandService.clearCommands();
    };

    const toggleHistory = () => {
      isHistoryVisible.value = !isHistoryVisible.value;
      if (isHistoryVisible.value) isQueueVisible.value = false;
    };

    const toggleCommandQueue = () => {
      isQueueVisible.value = !isQueueVisible.value;
      if (isQueueVisible.value) isHistoryVisible.value = false;
    };

    const selectHistoryEntry = (entry: string) => {
      inputModalActions.setValue(entry);
      isHistoryVisible.value = false;
    };

    onMounted(() => {
      actions.loadAllData();
      actions.initializeEventListeners();
      dockManagerService.onAction = handleAction;
      commandService.subscribe(updateCommands);
      updateCommands();
    });

    return {
      confirmation,
      detailModal,
      npcModal,
      isWebFullscreen,
      inputModal,
      inputModalActions,
      radialMenu,
      openRadialMenu,
      closeRadialMenu,
      handleAction,
      handleSubmit,
      handleOverlayClick,
      store,
      confirmationService,
      detailModalService,
      npcModalService,
      isActionPanelVisible,
      toggleActionPanel,
      isHistoryVisible,
      toggleHistory,
      selectHistoryEntry,
      isQueueVisible,
      toggleCommandQueue,
      commands,
      commandCount,
      clearCommands,
    };
  },
});
</script>

<style lang="scss">
@use './styles/theme/variables' as *;
@use './styles/theme/mixins' as *;

.guixu-root-container {
  display: grid;
  grid-template-rows: auto 1fr;
  width: 100%;
  max-height: 100%;
  aspect-ratio: 16 / 13;
  margin: auto;
  overflow: hidden;
  border: 1px solid rgba($color-gold-liu, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 35px rgba($color-black-void, 0.5);
  background: $color-black-void;
  position: relative;
}

.web-fullscreen {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  aspect-ratio: auto !important;
  overflow: visible !important; /* Allow inner content to scroll in fullscreen */
  border-radius: 0 !important;
  border: none !important;
  z-index: 1;
}

.main-layout {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  overflow: hidden;

  & > * {
    grid-column: 1 / -1;
    grid-row: 1 / -1;
  }
}

// Global Modal Styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba($color-black-void, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 90000;
}

.modal-content {
  @include frosted-glass(rgba($color-indigo-deep, 0.8), 12px);
  border: 1px solid rgba($color-gold-liu, 0.4);
  border-radius: $border-radius-md;
  padding: $spacing-lg;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  min-width: 320px;
  max-width: 500px;

  .confirmation-title {
    color: $color-gold-pale;
    font-family: $font-family-title;
    font-size: $font-size-h2;
    text-align: center;
    margin-bottom: $spacing-md;
  }

  .confirmation-message {
    color: $color-white-moon;
    font-size: $font-size-base;
    line-height: $line-height-base;
    margin-bottom: $spacing-xl;
    text-align: center;
  }

  .confirmation-buttons {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-md;
  }
}

.detail-modal {
  min-width: 400px;
  max-width: 80vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: $spacing-md;
    margin-bottom: $spacing-lg;
    border-bottom: 1px solid rgba($color-gold-liu, 0.3);

    .modal-title {
      color: $color-gold-pale;
      font-family: $font-family-title;
      font-size: $font-size-h2;
    }

    .close-button {
      background: none;
      border: none;
      color: $color-grey-stone;
      font-size: 24px;
      cursor: pointer;
      &:hover {
        color: $color-white-moon;
      }
    }
  }

  .modal-body {
    overflow-y: auto;
    padding-right: $spacing-sm; // for scrollbar
    color: $color-white-moon; // Ensure default text is readable
  }
}

.input-modal-overlay {
  align-items: flex-end;
  padding-bottom: 5vh;
  background-color: transparent;
  backdrop-filter: none;
}

.input-modal-content {
  @include frosted-glass(rgba($color-indigo-deep, 0.8), 12px);
  border: 1px solid rgba($color-gold-liu, 0.4);
  border-radius: $border-radius-md;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  padding: 0;
  width: 70%;
  max-width: 900px;
}

.input-area-container {
  position: relative;
}

.input-area-with-buttons {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

/* Activator button styles are now moved to EnhancedInputBox.vue */

.action-panel {
  position: absolute;
  bottom: calc(100% + #{$spacing-md});
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.command-queue-popup,
:deep(.input-history-popup) {
  position: absolute;
  bottom: calc(100% + #{$spacing-md});
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 600px;
  z-index: 20;
  // Further styling for command queue popup
}

:global(html.web-fullscreen-active),
:global(body.web-fullscreen-active) {
  overflow: hidden !important;
}

:global(body.web-fullscreen-active #chat) {
  padding: 0 !important;
  margin: 0 !important;
  height: 100vh !important;
  max-height: 100vh !important;
}

:global(body.web-fullscreen-active #chat > div) {
  padding: 0 !important;
  margin: 0 !important;
}

:global(body.web-fullscreen-active .mes_block) {
  padding: 0 !important;
  margin: 0 !important;
}

:global(body.web-fullscreen-active .mes_text) {
  padding: 0 !important;
  margin: 0 !important;
}
</style>
