import { watch } from 'vue';
import { get } from 'lodash';
import { store, actions } from '../store';
import * as getters from '../store/getters';
import { Character } from '../types/character';
import { lorebookService } from './LorebookService';
import { applyMvuUpdateFallback } from './mvu-parser';

const CORE_NPC_LIMIT = 5; // 同时进行深度模拟的NPC数量上限
const INACTIVE_THRESHOLD = 1000 * 60 * 60 * 24 * 7; // 7天未互动则可能降级

class NpcSimulationService {
  private intervalId: number | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    console.log('[NpcSimulationService] Initializing...');
    this.intervalId = window.setInterval(() => {
      this.runSimulation();
    }, 1000 * 30); // 每30秒运行一次模拟
  }

  private async runSimulation() {
    console.log('[NpcSimulationService] Running simulation cycle...');
    await this.updateNpcLodStatus();
    const coreNpcs = this.getCoreNpcs();

    for (const npc of coreNpcs) {
      this.simulateNpcBehavior(npc);
    }
  }

  private getCoreNpcs(): Character[] {
    const allNpcs = get(store.worldState, '角色', {}) as Record<string, Character>;
    return Object.values(allNpcs).filter(npc => get(npc, '$meta.lod') === 1 && npc.id !== store.userId);
  }

  private async updateNpcLodStatus() {
    // This is a simplified logic. A real implementation would need to track interaction timestamps.
    const coreNpcs = this.getCoreNpcs();
    if (coreNpcs.length > CORE_NPC_LIMIT) {
      // Demote the least recently interacted NPC
      const npcToDemote = coreNpcs[0]; // Placeholder for more complex logic
      await this.demoteNpc(npcToDemote.id);
    }
  }

  public async promoteNpc(npcId: string) {
    console.log(`[NpcSimulationService] Promoting NPC ${npcId} to LOD 1.`);
    // In a real scenario, we would load detailed data from a lorebook entry
    const command = `_.set('角色.${npcId}.$meta.lod', 1)`;
    await applyMvuUpdateFallback(command, store.worldState);
  }

  private async demoteNpc(npcId: string) {
    console.log(`[NpcSimulationService] Demoting NPC ${npcId} to LOD 2.`);
    // Here we would save a snapshot of the NPC's state before demoting.
    const command = `_.set('角色.${npcId}.$meta.lod', 2)`;
    // In a real implementation, we would also strip down the character data.
    await applyMvuUpdateFallback(command, store.worldState);
  }

  private simulateNpcBehavior(npc: Character) {
    // Placeholder for complex behavior simulation
    console.log(`[NpcSimulationService] Simulating behavior for ${npc.名}`);
    // Example: 5% chance to post something on social media
    if (Math.random() < 0.05) {
      const postContent = this.generateNpcPost(npc);
      actions.addActionToQueue({
        action: 'social',
        command: `[动态|${npc.id}|${new Date().toLocaleTimeString('it-IT')}|${postContent}|friends]`,
      });
    }
  }

  private generateNpcPost(npc: Character): string {
    const thoughts = [
      '今天天气真好，想出去走走。',
      '最近的课程有点难啊...',
      '好想喝奶茶。',
      `不知道 ${get(store, 'character.名', '那家伙')} 在做什么呢？`,
      '学生会的工作好忙...',
    ];
    return thoughts[Math.floor(Math.random() * thoughts.length)];
  }
}

export const npcSimulationService = new NpcSimulationService();
