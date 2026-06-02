import type { MapNode } from './MapDataProcessor';
import type { Territory, Region, Unit } from '../types/world';

export interface RenderedRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  level: number;
  name: string;
}

export class MapRenderingService {
  private nodes: MapNode[];
  private scale: number;

  constructor(nodes: MapNode[], scale: number) {
    this.nodes = nodes;
    this.scale = scale;
  }

  private getKmValue(value: [number, Unit]): number {
    const [num, unit] = value;
    const unitToKm: { [key in Unit]: number } = {
      'km': 1,
      '里': 0.5,
      '光年': 9.461e12,
      '天文单位': 149597870.7,
      'km²': 1,
      '里²': 0.25,
      '光年²': 8.95e25,
      '天文单位²': 2.237952291e16,
    };
    return num * (unitToKm[unit] || 1);
  }

  public generatePlateRects(plateColorMap: Map<string, number>): RenderedRect[] {
    const rects: RenderedRect[] = [];
    const plates = this.nodes.filter(n => n.type === 'Territory' && (n.data as Territory).面积);

    for (const plateNode of plates) {
      const plateData = plateNode.data as Territory;
      if (!plateNode.x || !plateNode.y) continue;

      const areaKm2 = this.getKmValue(plateData.面积 as [number, Unit]);
      const side = Math.sqrt(areaKm2) * this.scale;

      const baseHue = plateColorMap.get(plateData.ID) || 0;

      rects.push({
        id: plateData.ID,
        x: plateNode.x - side / 2,
        y: plateNode.y - side / 2,
        width: side,
        height: side,
        color: `hsla(${baseHue}, 30%, 20%, ${0.6 - plateData.层级 * 0.1})`,
        level: plateData.层级,
        name: plateData.名称,
      });
    }
    return rects.sort((a, b) => b.level - a.level); // Render higher levels first (as background)
  }

  public generateRegionRects(plateColorMap: Map<string, number>): RenderedRect[] {
    const rects: RenderedRect[] = [];
    const regions = this.nodes.filter(n => n.type === 'Region');

    for (const regionNode of regions) {
      const regionData = regionNode.data as Region;
      if (!regionNode.x || !regionNode.y) continue;

      const areaKm2 = this.getKmValue(regionData.面积 as [number, Unit]);
      const side = Math.sqrt(areaKm2) * this.scale;
      const baseHue = plateColorMap.get(regionData.所属板块ID) || Math.random() * 360;

      rects.push({
        id: regionData.ID,
        x: regionNode.x - side / 2,
        y: regionNode.y - side / 2,
        width: side,
        height: side,
        color: `hsla(${baseHue}, 50%, 40%, 0.5)`,
        level: 0,
        name: regionData.名称,
      });
    }
    return rects;
  }
}