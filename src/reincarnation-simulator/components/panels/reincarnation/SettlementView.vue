<template>
  <div class="settlement-view">
    <div v-if="choices.length > 0" class="choices-grid">
      <SettlementChoiceCard
        v-for="(choice, index) in choices"
        :key="index"
        :choice="choice"
        :is-selected="selectedChoice === choice"
        @select="selectedChoice = $event"
      />
    </div>
    <div v-else class="no-choices">
      <p>暂无宿命抉择。</p>
      <p>完成一世轮回后，此地将揭示你可继承的命运烙印。</p>
    </div>

    <div class="actions-footer" v-if="choices.length > 0">
      <button class="confirm-button" @click="confirmChoice" :disabled="!selectedChoice">固化烙印</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { get } from 'lodash';
import { computed, ref } from 'vue';
import { confirmationService } from '../../../services/ConfirmationService';
import { commandService } from '../../../services/CommandService';
import { store, USER_ID, actions } from '../../../store';
import SettlementChoiceCard from './SettlementChoiceCard.vue';
import * as toastr from 'toastr';

const selectedChoice = ref<any | null>(null);

const choices = computed(() => {
  const choicesObj = get(store.worldState, '模拟器.结算.宿命抉择', {});
  if (typeof choicesObj === 'object' && choicesObj !== null) {
    return Object.values(choicesObj).filter((c: any) => c && c.选项类型 && c.描述 && !c.描述.includes('占位'));
  }
  return [];
});

const confirmChoice = async () => {
  if (!selectedChoice.value) return;

  const choice = selectedChoice.value;

  // Robustly find the main character by looking for the '灵魂本源' property
  const characters = get(store.worldState, '角色', {});
  const mainCharacter = Object.values(characters).find(
    (char: any) => char && char.hasOwnProperty('灵魂本源')
  );

  if (!mainCharacter) {
    toastr.error("无法确定玩家本体，操作失败。");
    console.error("Could not find the main character in the world state.");
    return;
  }

  const soulEssence = get(mainCharacter, '灵魂本源[0]', 0);

  if (soulEssence < choice.消耗) {
    await confirmationService.show(
      '灵魂本源不足',
      `固化此烙印需要 ${choice.消耗} 灵魂本源，你当前只有 ${soulEssence}。`,
      () => {},
      true, // hideCancel
    );
    return;
  }

  const confirmed = await confirmationService.show(
    '确认固化烙印?',
    `你确定要消耗 ${choice.消耗} 灵魂本源来固化【${choice.数据.名称}】吗？这可能会覆盖你现有的一个烙印。`,
    () => {},
  );

  if (confirmed) {
    // This is a placeholder for the action to confirm the choice.
    // You would typically call a store action here.
    console.log('Confirmed choice:', choice);
    const command = `<固化烙印 ${JSON.stringify(choice.数据)}>`;
    commandService.addCommand(command);
    confirmationService.hide();
    toastr.success(`指令【固化烙印: ${choice.数据.名称}】已添加到行动队列。`);
  }
};
</script>
