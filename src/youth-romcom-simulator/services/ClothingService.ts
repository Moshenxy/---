import { lorebookService } from './LorebookService';
import { get } from 'lodash';
import { AppState, 角色 as Character } from '../types';

class ClothingService {
  private clothingData: any = null;

  private async _loadClothingData(): Promise<any> {
    if (this.clothingData) {
      return this.clothingData;
    }
    const content = await lorebookService.readFromLorebook('[数据] 服装库');
    if (content) {
      try {
        const cleanedContent = this._cleanJsonString(content);
        this.clothingData = JSON.parse(cleanedContent);
        return this.clothingData;
      } catch (error) {
        console.error('[ClothingService] Failed to parse clothing data:', error);
        return null;
      }
    }
    return null;
  }

  public async getCharacterAppearance(character: Character, worldState: AppState['worldState']): Promise<string> {
    const db = await this._loadClothingData();
    if (!db || !character || !worldState) {
      return character?.个人信息?.衣着 || '穿着普通的衣服。';
    }

    const season = this._getSeason(new Date(worldState.世界状态.时间));
    const locationType = this._getLocationType(character.位置); // e.g., 'school', 'home'
    
    let outfit = this._findBestMatch(db, character, season, locationType);

    // Fallback to default outfit if no specific match found
    if (!outfit) {
        outfit = character.个人信息.衣着 || '穿着普通的衣服。';
    }

    return outfit;
  }

  private _getSeason(date: Date): 'Winter' | 'Summer' {
    const month = date.getMonth() + 1;
    // Simple season logic: 4-9 is summer, 10-3 is winter
    return month >= 4 && month <= 9 ? 'Summer' : 'Winter';
  }

  private _getLocationType(locationId: string): string {
    if (locationId.includes('school')) return 'school';
    if (locationId.includes('apartment') || locationId.includes('room')) return 'home';
    if (locationId.includes('station') || locationId.includes('city')) return 'street';
    return 'default';
  }

  private _findBestMatch(db: any, character: Character, season: string, locationType: string): string {
    const characterName = character.名称;
    const anchor = db.character_anchors && Object.values(db.character_anchors).find((anc: any) => anc.core.includes(characterName)) as any;

    // 优先使用 smart_match_logic
    if (db.smart_match_logic && db.smart_match_logic[characterName]) {
        const logicString: string = db.smart_match_logic[characterName];
        const rules = logicString.split(';').map(s => s.trim());
        const locationRule = rules.find(r => r.toLowerCase().startsWith(locationType));

        if (locationRule) {
            const match = locationRule.match(/\[(.*?)\]/);
            if (match) {
                const tag = match[1];
                for (const category in db.wardrobe_pool) {
                    const item = (db.wardrobe_pool[category] as any[]).find(i => i.tag === tag);
                    if (item) {
                        console.log(`[ClothingService] Smart match found for ${characterName} at ${locationType}: ${item.detail}`);
                        return item.detail;
                    }
                }
            }
        }
    }

    // 如果 smart_match_logic 未命中，则使用通用逻辑
    if (anchor) {
        if (locationType === 'school') {
            const pool = character.个人信息.性别 === '男' ? db.wardrobe_pool.school_uniform_male : db.wardrobe_pool.school_uniform_female;
            const uniform = pool.find((item: any) => item.tag.includes(season));
            if (uniform) return uniform.detail;
        } else if (locationType === 'home') {
            const homeWear = db.wardrobe_pool.home_private[0]; // Simplified
            if (homeWear) return homeWear.detail;
        }
    }
    
    // 最终回退
    const fallbackPool = character.个人信息.性别 === '男' ? db.wardrobe_pool.casual_daily_male : db.wardrobe_pool.casual_daily_female;
    return fallbackPool[0]?.detail || '穿着普通的衣服。';
  }

  private _cleanJsonString(str: string): string {
    const firstBrace = str.indexOf('{');
    const lastBrace = str.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
      return str; // Return original string if it's not a valid JSON object structure
    }
    return str.substring(firstBrace, lastBrace + 1);
  }
}

export const clothingService = new ClothingService();