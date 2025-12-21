import { reactive } from 'vue';
import { lorebookService } from './LorebookService';

export interface Location {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  children: Location[];
}

class LocationService {
  public locations = reactive<Location[]>([]);

  constructor() {
    this.loadLocations();
  }

  async loadLocations() {
    try {
      const locationContent = await lorebookService.readFromLorebook('[世界观]地点列表');
      if (!locationContent) {
        console.warn('Could not find or load location list from lorebook.');
        return;
      }

      const lines = locationContent.split('\n').filter((line: string) => line.trim() && !line.startsWith('#'));
      const allLocations: Location[] = [];
      let currentLoc: Partial<Location> & { children: Location[] } = { children: [] };

      lines.forEach((line: string) => {
        const parts = line.split('|');
        const key = parts[0].trim();
        const value = parts[1] ? parts[1].trim() : '';

        if (key.toLowerCase() === 'id') {
          if (currentLoc.id) {
            allLocations.push(currentLoc as Location);
          }
          currentLoc = { id: value, children: [] };
        } else if (key.toLowerCase() === '名称') {
          currentLoc.name = value;
        } else if (key.toLowerCase() === '类型') {
          currentLoc.type = value;
        } else if (key.toLowerCase() === '父级id') {
          currentLoc.parentId = value;
        }
      });

      if (currentLoc.id) {
        allLocations.push(currentLoc as Location);
      }

      // Build the tree structure
      const locationMap = new Map<string, Location>();
      allLocations.forEach(loc => locationMap.set(loc.id, loc));

      const tree: Location[] = [];
      allLocations.forEach(loc => {
        if (loc.parentId && locationMap.has(loc.parentId)) {
          const parent = locationMap.get(loc.parentId);
          parent?.children.push(loc);
        } else {
          tree.push(loc);
        }
      });

      this.locations.splice(0, this.locations.length, ...tree);
      console.log('[LocationService] Location tree loaded:', this.locations);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  }

  public getChildren(parentId: string | null): Location[] {
    if (parentId === null) {
      return this.locations;
    }

    const findInChildren = (nodes: Location[], id: string): Location[] | null => {
      for (const node of nodes) {
        if (node.id === id) {
          return node.children;
        }
        const found = findInChildren(node.children, id);
        if (found) return found;
      }
      return null;
    };

    return findInChildren(this.locations, parentId) || [];
  }

  public getLocationNameById(id: string): string {
    const findName = (nodes: Location[], locId: string): string | null => {
      for (const node of nodes) {
        if (node.id === locId) {
          return node.name;
        }
        const found = findName(node.children, locId);
        if (found) return found;
      }
      return null;
    };
    return findName(this.locations, id) || id;
  }
}

export const locationService = new LocationService();
