import { readFromLorebook } from './lorebook';

export interface Location {
    id: string;
    name: string;
    type: string;
    parentId: string | null;
    children: Location[];
    description?: string;
    gridX?: number;
    gridY?: number;
    gridWidth?: number;
    gridHeight?: number;
}

export function parseLocations(text: string | null): Map<string, Location> {
    const locations = new Map<string, Location>();
    if (!text) return locations;

    const lines = text.split('\n').filter(Boolean);
    let currentData: any = {};

    lines.forEach(line => {
        if (line.startsWith('#')) return;
        const [key, ...valueParts] = line.split('|');
        const value = valueParts.join('|').trim();

        if (key.toUpperCase() === 'ID') {
            if (currentData.id) {
                locations.set(currentData.id, { ...currentData, children: [] });
            }
            currentData = { id: value };
        } else {
            const keyMap: { [key: string]: string } = {
                '名称': 'name',
                '类型': 'type',
                '父级ID': 'parentId',
                '描述': 'description',
                '网格坐标': 'gridCoords',
                '网格尺寸': 'gridSize',
            };
            const mappedKey = keyMap[key];
            if (mappedKey === 'gridCoords' && value) {
                const [x, y] = value.split(',').map(Number);
                currentData.gridX = x;
                currentData.gridY = y;
            } else if (mappedKey === 'gridSize' && value) {
                const [w, h] = value.split(',').map(Number);
                currentData.gridWidth = w;
                currentData.gridHeight = h;
            } else if (mappedKey) {
                currentData[mappedKey] = value === 'null' ? null : value;
            }
        }
    });
    if (currentData.id) {
        locations.set(currentData.id, { ...currentData, children: [] });
    }

    return locations;
}

function buildTree(locationsMap: Map<string, Location>): Location[] {
    const rootNodes: Location[] = [];
    locationsMap.forEach(location => {
        if (location.parentId) {
            const parent = locationsMap.get(location.parentId);
            if (parent) {
                parent.children.push(location);
            } else {
                rootNodes.push(location);
            }
        } else {
            rootNodes.push(location);
        }
    });
    return rootNodes;
}

let cachedLocations: Map<string, Location> | null = null;

export async function getAllLocationsMap(): Promise<Map<string, Location>> {
    if (cachedLocations) return cachedLocations;
    const locationText = await readFromLorebook('[世界观]地点列表');
    cachedLocations = parseLocations(locationText);
    buildTree(cachedLocations);
    return cachedLocations;
}

export async function getLocationsByType(type: string): Promise<Location[]> {
    const all = await getAllLocationsMap();
    const result: Location[] = [];
    all.forEach(location => {
        if (location.type === type) {
            result.push(location);
        }
    });
    return result;
}

export async function getLocationsByParentId(parentId: string | null): Promise<Location[]> {
    const all = await getAllLocationsMap();
    if (!parentId) {
        return Array.from(all.values()).filter(loc => !loc.parentId);
    }
    const parent = all.get(parentId);
    return parent ? parent.children : [];
}