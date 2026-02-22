<template>
  <div class="guixu-root-container" :class="{ 'web-fullscreen': isWebFullscreen }">
    <TopStatusBar />
    <div class="main-layout">
      <DockManager />
    </div>

    <!-- Global Modals -->
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
    <div v-if="detailModal.isVisible" class="modal-overlay" @click.self="detailModalService.hide()">
      <div class="modal-content detail-modal" :class="[detailModal.props?.modalClass]">
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
    <div v-if="inputModal.isVisible" class="modal-overlay input-modal-overlay">
      <div class="modal-content input-modal-content">
        <div class="input-area-container">
          <div class="input-area-with-buttons">
            <EnhancedInputBox @submit-action="handleSubmit" @toggle-history="toggleHistory" />
          </div>
          <InputHistoryPopup v-if="isHistoryVisible" @close="toggleHistory" @select-entry="selectHistoryEntry" />
          <div
            v-if="isQueueVisible"
            class="command-queue-popup"
            style="background-color: #0a0f1e; border: 1px solid #d4af37"
          >
            <div class="popup-header">
              <h3>指令队列</h3>
              <button class="close-popup-button" @click="toggleCommandQueue">×</button>
            </div>
            <div class="popup-body">
              <div v-if="commandCount > 0" class="command-list">
                <div v-for="(cmd, index) in commands" :key="index" class="command-item">{{ cmd }}</div>
              </div>
              <div v-else class="empty-queue">暂无待执行指令。</div>
            </div>
            <div class="popup-footer" v-if="commandCount > 0">
              <button class="clear-button" @click="clearCommands">清空所有指令</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <NotificationContainer />

    <!-- Smartphone UI -->
    <transition name="fade">
      <SmartphoneShell v-if="isSmartphoneOpen" @close-smartphone="toggleSmartphone" />
    </transition>

    <!-- Smartphone Toggle Button -->
    <button v-if="!isSmartphoneOpen" class="smartphone-toggle-btn" @click="toggleSmartphone">
      <i class="fas fa-mobile-alt"></i>
    </button>

    <!-- Floating Active Cards -->
    <div class="floating-cards-container">
      <FloatingCard v-for="card in activeCards" :key="card.ID" :card="card" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue';
import FloatingCard from './components/cards/FloatingCard.vue';
import ActionPanel from './components/common/ActionPanel.vue';
import EnhancedInputBox from './components/common/EnhancedInputBox.vue';
import InputHistoryPopup from './components/common/InputHistoryPopup.vue';
import NotificationContainer from './components/common/NotificationContainer.vue';
import SideMenuButton from './components/controls/SideMenuButton.vue';
import DockManager from './components/DockManager.vue';
import LoadingIndicator from './components/LoadingIndicator.vue';
import NpcListModal from './components/modals/NpcListModal.vue';
import SmartphoneShell from './components/smartphone/SmartphoneShell.vue';
import TopStatusBar from './components/TopStatusBar.vue';
import WorldTimeDisplay from './components/WorldTimeDisplay.vue';
import { commandService } from './services/CommandService';
import { confirmationService } from './services/ConfirmationService';
import { destinyCardService } from './services/DestinyCardService';
import { detailModalService } from './services/DetailModalService';
import { dockManagerService } from './services/DockManagerService';
import { eventBus } from './services/EventBus';
import { inputModalActions, inputModalState } from './services/InputModalService';
import { layoutService, PanelState } from './services/LayoutService';
import { npcModalService } from './services/NpcModalService';
import { usePanelManager } from './services/usePanelManager';
import { actions, store } from './store';
import { uiState } from './store/ui';

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
    NpcListModal,
    TopStatusBar,
    WorldTimeDisplay,
    SideMenuButton,
    NotificationContainer,
    ActionPanel,
    InputHistoryPopup,
    SmartphoneShell,
    FloatingCard,
  },
  setup() {
    const { openPanel } = usePanelManager();
    const activeCards = destinyCardService.activeCards;

    const isSmartphoneOpen = ref(false);
    const toggleSmartphone = () => {
      isSmartphoneOpen.value = !isSmartphoneOpen.value;
    };

    const confirmation = computed(() => confirmationService.state);
    const detailModal = computed(() => detailModalService.state);
    const npcModal = computed(() => npcModalService.state);
    const isWebFullscreen = computed(() => uiState.isWebFullscreen);
    const inputModal = computed(() => inputModalState);

    const isActionPanelVisible = ref(false); // 移除 ActionPanel, 设为 false
    const isHistoryVisible = ref(false);
    const isQueueVisible = ref(false);
    const commands = ref<string[]>([]);
    const commandCount = computed(() => commands.value.length);

    const allOptions: MenuOption[] = [
      {
        id: 'inventory',
        icon: '物',
        text: '背包',
        action: () => openPanel('world', 'inventory'),
        disabled: () => !store.isReady,
      },
      {
        id: 'skills',
        icon: '技',
        text: '技能',
        action: () => openPanel('world', 'skills'),
        disabled: () => !store.isReady,
      },
      {
        id: 'destiny',
        icon: '命',
        text: '命运',
        action: () => openPanel('world', 'destiny'),
        disabled: () => !store.isReady,
      },
      {
        id: 'review',
        icon: '记',
        text: '回顾',
        action: () => openPanel('system', 'review'),
        disabled: () => !store.isReady,
      },
      {
        id: 'npcDirectory',
        icon: '众',
        text: '名录',
        action: () => openPanel('system', 'npcDirectory'),
        disabled: () => !store.isReady,
      },
      {
        id: 'worldDetails',
        icon: '世',
        text: '世界',
        action: () => openPanel('world', 'worldDetails'),
        disabled: () => !store.isReady,
      },
      {
        id: 'timeline',
        icon: '预',
        text: '预言',
        action: () => dockManagerService.openPanel('timeline', '未来预言', 'timeline-panel'),
        disabled: () => !store.isReady,
      },
      {
        id: 'debug',
        icon: '虫',
        text: '调试',
        action: () => openPanel('system', 'debug'),
        disabled: () => !store.isReady,
      },
    ];

    const handleOverlayClick = () => {
      if (inputModal.value.isVisible) {
        inputModalActions.hide();
        return;
      }
    };

    const handleAction = async (actionContent: string) => {
      console.log('Submitting to AI:', actionContent);
      await actions.handleAction(actionContent);
    };

    const handleSubmit = async (actionContent: string) => {
      const rawInput = inputModal.value.inputValue;
      inputModalActions.setLastSubmittedValue(rawInput);
      await handleAction(actionContent);
      inputModalActions.hide();
      inputModalActions.clearValue();
    };

    const toggleActionPanel = () => {
      // isActionPanelVisible.value = !isActionPanelVisible.value; // No-op
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
      const dockHost = document.getElementById('app');
      if (dockHost) {
        dockManagerService.initialize(dockHost);
      } else {
        console.error('Dock host element not found.');
      }
      actions.loadAllData();
      dockManagerService.onAction = handleAction;
      commandService.subscribe(updateCommands);
      updateCommands();

      eventBus.on('restoreLayout', (panels: PanelState[]) => {
        const { openPanel } = usePanelManager();
        dockManagerService.closeAllPanels();
        panels.forEach(panelState => {
          try {
            const category =
              panelState.world === 'mainWorld' || panelState.world === 'avatarWorld' ? 'world' : 'system';
            openPanel(category as any, panelState.panel, panelState.props || {});
          } catch (e) {
            console.error(`Failed to restore panel: ${panelState.world}-${panelState.panel}`, e);
          }
        });
      });

      layoutService.setCurrentFullscreenState(uiState.isWebFullscreen);
      layoutService.restoreLayout();
    });

    return {
      confirmation,
      detailModal,
      npcModal,
      isWebFullscreen,
      inputModal,
      inputModalActions,
      allOptions,
      handleAction,
      handleSubmit,
      handleOverlayClick,
      store,
      confirmationService,
      detailModalService,
      npcModalService,
      isActionPanelVisible,
      isHistoryVisible,
      toggleHistory,
      selectHistoryEntry,
      isQueueVisible,
      toggleCommandQueue,
      commands,
      commandCount,
      clearCommands,
      isSmartphoneOpen,
      toggleSmartphone,
      activeCards,
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
  max-width: 1400px;
  margin: auto;
  overflow: hidden;
  aspect-ratio: 16 / 12;
  min-height: 900px;
  max-height: 90vh;
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
  overflow: visible !important;
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
  width: 800px;
  max-width: 90vw;
  height: 600px;
  max-height: 80vh;
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
    padding-right: $spacing-sm;
    color: $color-white-moon;
    flex-grow: 1;
    min-height: 0;
  }
}

.small-detail-modal {
  max-width: 400px !important;
  height: auto !important;
  max-height: 80vh;
}

.card-detail-modal {
  width: auto;
  max-width: 400px; /* Or a suitable width for the card */
  height: auto;
  max-height: 90vh;
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;

  :deep(.modal-header) {
    display: none; /* Hide modal header for cards */
  }

  :deep(.modal-body) {
    padding: 0;
    overflow: visible;
  }
}

.input-modal-overlay {
  align-items: flex-end;
  padding-bottom: 5vh;
  background-color: transparent;
  backdrop-filter: none;
  pointer-events: none;
}

.input-modal-content {
  pointer-events: auto;
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
  border-radius: $border-radius-md;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid rgba($color-gold-liu, 0.2);

    h3 {
      color: $color-gold-pale;
      font-family: $font-family-title;
      font-size: $font-size-h3;
      margin: 0;
    }

    .close-popup-button {
      background: none;
      border: none;
      color: $color-grey-stone;
      font-size: 22px;
      cursor: pointer;
      line-height: 1;

      &:hover {
        color: $color-white-moon;
      }
    }
  }

  .popup-body {
    .command-list {
      max-height: 200px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;
      padding-right: $spacing-sm;
    }

    .command-item {
      background-color: rgba($color-black-void, 0.3);
      padding: $spacing-sm $spacing-md;
      border-radius: $border-radius-sm;
      font-family: $font-family-main;
      color: $color-white-moon;
      word-break: break-all;
    }

    .empty-queue {
      text-align: center;
      color: $color-grey-stone;
      padding: $spacing-lg 0;
    }
  }

  .popup-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: $spacing-sm;
    border-top: 1px solid rgba($color-gold-liu, 0.2);
  }
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

.floating-cards-container {
  position: absolute;
  top: 60px; /* Adjust based on TopStatusBar height */
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: -80px; // Negative gap to stack cards
}

.smartphone-toggle-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: $color-gold-liu;
  color: $color-black-void;
  border: none;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 80000;
  transition:
    background-color 0.3s ease,
    transform 0.3s ease;

  &:hover {
    background-color: lighten($color-gold-liu, 10%);
    transform: scale(1.1);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .smartphone-shell,
.fade-leave-active .smartphone-shell {
  transition: transform 0.4s ease-out;
}

.fade-enter-from .smartphone-shell,
.fade-leave-to .smartphone-shell {
  transform: translateY(20px) scale(0.95);
}
</style>
