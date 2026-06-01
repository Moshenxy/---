import { get } from 'lodash';
import { watch } from 'vue';
import { getters, store } from '../store';
import { Character } from '../types/character';
import { applyMvuUpdateFallback } from './mvu-parser';
import { scheduleService } from './schedule';

class CampusScheduleService {
  private lastCheckedHour: number = -1;

  constructor() {
    this.initialize();
  }

  private initialize() {
    console.log('[CampusScheduleService] Initializing...');
    watch(
      () => getters.worldTime.value,
      newTime => {
        if (newTime && newTime.时 !== this.lastCheckedHour) {
          this.lastCheckedHour = newTime.时;
          this.updateNpcLocations(newTime);
        }
      },
      { deep: true, immediate: true },
    );
  }

  private async updateNpcLocations(worldTime: any) {
    console.log(`[CampusScheduleService] Updating NPC locations for ${worldTime.时}h.`);
    const allNpcs = get(store.worldState, '角色', {}) as Record<string, Character>;
    const commands: string[] = [];

    for (const npcId in allNpcs) {
      if (npcId === store.userId || get(allNpcs[npcId], '$meta.lod') === 1) {
        continue;
      }

      const npcClass = get(allNpcs[npcId], '班级[0]');
      if (!npcClass) continue;

      const currentCourse = await scheduleService.getCourseForNpc(npcClass, worldTime);
      let newLocationId: string;

      if (currentCourse) {
        newLocationId = currentCourse.教室ID;
      } else if (worldTime.时 >= 12 && worldTime.时 < 13) {
        newLocationId = 'cafeteria';
      } else if (worldTime.时 >= 16 && worldTime.时 < 18) {
        newLocationId = 'club_building_A';
      } else {
        newLocationId = 'tianhua_high_school';
      }

      const currentLocation = get(allNpcs[npcId], '当前地点ID[0]');
      if (currentLocation !== newLocationId) {
        commands.push(`_.set('角色.${npcId}.当前地点ID[0]', '${newLocationId}')`);
      }
    }

    if (commands.length > 0) {
      console.log('[CampusScheduleService] Applying location updates:', commands);
      await applyMvuUpdateFallback(commands.join('\n'), store.worldState);
    }
  }
}

export const campusScheduleService = new CampusScheduleService();
