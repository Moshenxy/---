import { ref } from 'vue';

export interface Club {
  id: string;
  name: string;
  advisor: string;
  leader: string;
  deputyLeader?: string[];
  members: string[];
  coreSkills: string[];
  activityDays: string;
  location: string;
  description: string;
}

class ClubService {
  public clubs = ref<Club[]>([]);

  constructor() {
    this.loadClubs();
  }

  private async loadClubs() {
    try {
      const entries = await TavernHelper.getLorebookEntries('天华校园');
      if (!entries) {
        console.warn('[ClubService] Could not fetch entries for "天华校园".');
        return;
      }
      const clubEntry = entries.find((e: any) => e.comment === '[世界观]社团列表');
      if (clubEntry && clubEntry.content) {
        this.clubs.value = this.parseRawClubs(clubEntry.content);
      } else {
        console.warn('[ClubService] Club list entry not found in lorebook.');
      }
    } catch (error) {
      console.error('Failed to load clubs from lorebook:', error);
    }
  }

  private parseRawClubs(rawText: string): Club[] {
    const clubs: Club[] = [];
    const clubBlocks = rawText.trim().split(/\n\n(?=ID\|)/);

    for (const block of clubBlocks) {
      const lines = block.trim().split('\n');
      const club: Partial<Club> = {
        deputyLeader: [],
        members: [],
        coreSkills: [],
      };

      for (const line of lines) {
        const [key, ...valueParts] = line.split('|');
        const value = valueParts.join('|');

        switch (key) {
          case 'ID':
            club.id = value;
            break;
          case '名称':
            club.name = value;
            break;
          case '指导老师':
            club.advisor = value;
            break;
          case '部长':
            club.leader = value;
            break;
          case '副部长':
            if (value) club.deputyLeader = value.split(',');
            break;
          case '部员':
            if (value) club.members = value.split(',');
            break;
          case '核心技能':
            if (value) club.coreSkills = value.split(',').map(s => s.trim());
            break;
          case '活动日':
            club.activityDays = value;
            break;
          case '所在地点':
            club.location = value;
            break;
          case '描述':
            club.description = value;
            break;
        }
      }
      if (club.id) {
        clubs.push(club as Club);
      }
    }
    return clubs;
  }
}

export const clubService = new ClubService();
