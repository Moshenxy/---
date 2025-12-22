import type { WorldDefinition, Area } from '../types/world';
import type { MapNode, MapTree, ProcessedPlate, ProcessedRegion, ProcessedGeomorphy, ProcessedLocation, AreaUnit, DistanceUnit } from '../types/map';

export type { MapNode };

const KM_PER_LI = 0.5;
const KM_PER_AU = 149597870.7;
const KM_PER_LIGHT_YEAR = 9460730472580.8;

const AREA_CONVERSION_FACTORS: Record<AreaUnit, number> = {
  'km²': 1,
  '里²': KM_PER_LI * KM_PER_LI,
  '天文单位²': KM_PER_AU * KM_PER_AU,
  '光年²': KM_PER_LIGHT_YEAR * KM_PER_LIGHT_YEAR,
};

export const DISTANCE_CONVERSION_FACTORS: Record<DistanceUnit, number> = {
  'km': 1,
  '里': KM_PER_LI,
  '天文单位': KM_PER_AU,
  '光年': KM_PER_LIGHT_YEAR,
};

export class MapDataProcessor {
  private worldData: WorldDefinition;
  private nodes: Map<string, MapNode>;
  private tree: MapTree;
  public globalScale: number; // Represents km per pixel

  constructor(worldData: WorldDefinition) {
    this.worldData = worldData;
    this.nodes = new Map();
    this.tree = [];
    this.globalScale = 1.0;
  }

  public buildGraph() {
    if (!this.worldData?.内容?.地理) return;
    const geography = this.worldData.内容.地理;
    
    this.nodes.clear();
    this.tree = [];

    geography.疆域板块?.forEach(plate => {
      const areaInKm2 = this.convertAreaToBaseUnit(plate.面积);
      const node: ProcessedPlate = {
        id: plate.ID, name: plate.名称, type: 'Territory', data: plate,
        displayRadius: 0, x: 0, y: 0, parentId: plate.所属板块ID || null, children: [],
        level: plate.层级, area: areaInKm2,
      };
      this.nodes.set(node.id, node);
    });

    geography.行政区?.forEach(region => {
      const areaInKm2 = this.convertAreaToBaseUnit(region.面积);
      const node: ProcessedRegion = {
        id: region.ID, name: region.名称, type: 'Region', data: region,
        displayRadius: 0, x: 0, y: 0, parentId: region.所属板块ID, children: [],
        level: 1, area: areaInKm2,
      };
      this.nodes.set(node.id, node);
    });

    geography.地貌?.forEach(topo => {
        const areaInKm2 = this.convertAreaToBaseUnit(topo.面积);
        const node: ProcessedGeomorphy = {
            id: topo.ID, name: topo.名称, type: 'Topography', data: topo,
            displayRadius: 0, x: 0, y: 0, parentId: topo.所属板块ID, 
            children: [], level: 1, area: areaInKm2
        };
        this.nodes.set(node.id, node);
    });

    geography.地点?.forEach(location => {
        const node: ProcessedLocation = {
            id: location.ID, name: location.名称, type: 'Location', data: location,
            displayRadius: 5, x: 0, y: 0, parentId: location.所属行政区ID,
            children: [], level: 0,
        };
        this.nodes.set(node.id, node);
    });

    this.nodes.forEach(node => {
      if (node.parentId && this.nodes.has(node.parentId)) {
        this.nodes.get(node.parentId)!.children.push(node);
      } else {
        this.tree.push(node);
      }
    });
  }

  public calculateLayout(width: number, height: number) {
    const rootTerritories = this.tree.filter(n => n.type === 'Territory') as ProcessedPlate[];
    let benchmarkNode: ProcessedPlate | undefined;
    
    if (rootTerritories.length > 0) {
        benchmarkNode = rootTerritories.sort((a, b) => b.level - a.level)[0];
    } else {
        const allTerritories = Array.from(this.nodes.values()).filter(n => n.type === 'Territory') as ProcessedPlate[];
        if (allTerritories.length > 0) {
            benchmarkNode = allTerritories.sort((a, b) => b.area - a.area)[0];
        }
    }

    if (!benchmarkNode || benchmarkNode.area === 0) { return; }

    this.globalScale = Math.sqrt(benchmarkNode.area) / (Math.min(width, height) * 0.9);
    benchmarkNode.x = width / 2;
    benchmarkNode.y = height / 2;

    this.calculateAllDisplayMetrics();
    this.layoutChildren(width, height);
  }

  public getLayout() {
    return { nodes: Array.from(this.nodes.values()) };
  }

  private convertAreaToBaseUnit(area: Area | undefined): number {
    if (!area) return 0;
    const [value, unit] = area as [number, AreaUnit];
    return value * (AREA_CONVERSION_FACTORS[unit] || 1);
  }
  
  private calculateAllDisplayMetrics() {
    this.nodes.forEach(node => {
      const nodeWithArea = node as ProcessedPlate | ProcessedRegion | ProcessedGeomorphy;
      if (nodeWithArea.area && nodeWithArea.area > 0) {
        nodeWithArea.displayRadius = Math.sqrt(nodeWithArea.area) / this.globalScale;
      }
      
      if (node.type === 'Topography') {
        const topoNode = node as ProcessedGeomorphy;
        const parent = topoNode.parentId ? this.nodes.get(topoNode.parentId) as ProcessedPlate : null;

        if (parent && parent.area > 0 && topoNode.area > 0) {
            const areaRatio = topoNode.area / parent.area;
            const minRatio = 0.001; 
            const maxRatio = 0.2;  
            let adjustmentFactor = 1.0;

            if (areaRatio < minRatio) {
                adjustmentFactor = Math.pow(minRatio / areaRatio, 0.3);
            } else if (areaRatio > maxRatio) {
                adjustmentFactor = Math.pow(maxRatio / areaRatio, 0.5);
            }
            topoNode.displayRadius *= adjustmentFactor;
        }

        const data = topoNode.data;
        const relativeCoord = data.相对坐标;
        let rotation = 0;
        if (relativeCoord) {
          const [direction, angleDeg] = relativeCoord.方位;
           const directionMap: Record<string, number> = { 
              '东': 0, '东南': 45, '南': 90, '西南': 135, '西': 180, '西北': 225, '北': 270, '东北': 315
          };
          const baseAngle = directionMap[direction] || 0;
          rotation = baseAngle + (Number(angleDeg) || 0);
        }
        topoNode.rotation = rotation;
      }
    });
  }

  private layoutChildren(width: number, height: number) {
    this.tree.forEach(rootNode => {
      if ((rootNode.x === 0 && rootNode.y === 0) && this.nodes.get(rootNode.id)?.x === 0) {
         rootNode.x = Math.random() * width;
         rootNode.y = Math.random() * height;
      }
      this.layoutNodeAndItsChildren(rootNode);
    });
  }

  private layoutNodeAndItsChildren(parentNode: MapNode) {
    parentNode.children.forEach(childNode => {
      const relativeCoord = (childNode.data as any).相对坐标;
      
      const refNode = relativeCoord?.参考ID 
        ? this.nodes.get(relativeCoord.参考ID) 
        : parentNode;

      if (refNode && (refNode.x !== 0 || refNode.y !== 0)) {
         if (relativeCoord) {
            this.calculatePositionByRelativeCoord(childNode, refNode);
         } else {
            this.calculatePositionRandomlyInParent(childNode, refNode);
         }
      }
      
      if (childNode.children.length > 0) {
        this.layoutNodeAndItsChildren(childNode);
      }
    });
  }

  private calculatePositionByRelativeCoord(node: MapNode, refNode: MapNode) {
      const relativeCoord = (node.data as any).相对坐标;
      if (!relativeCoord) {
        this.calculatePositionRandomlyInParent(node, refNode);
        return;
      }

      const distanceData = relativeCoord.距离 as [number, DistanceUnit];
      let distanceInKm = distanceData ? distanceData[0] * (DISTANCE_CONVERSION_FACTORS[distanceData[1]] || 1) : 0;
      
      const [direction, angleDeg] = relativeCoord.方位;
      const directionMap: Record<string, number> = { 
          '东': 0, '东南': 45, '南': 90, '西南': 135, '西': 180, '西北': 225, '北': 270, '东北': 315, '中心': 0 
      };
      
      if (direction === '中心' && distanceInKm === 0) {
          node.x = refNode.x;
          node.y = refNode.y;
          return;
      }

      if (distanceInKm === 0) {
        const refArea = (refNode as ProcessedPlate).area;
        if(refArea) {
            distanceInKm = Math.sqrt(refArea) * 0.1;
        }
      }

      const distanceInPixels = distanceInKm / this.globalScale;
      const baseAngle = directionMap[direction] || 0;
      const finalAngle = baseAngle + (Number(angleDeg) || 0);
      const angleRad = finalAngle * (Math.PI / 180);

      node.x = refNode.x + distanceInPixels * Math.cos(angleRad);
      node.y = refNode.y + distanceInPixels * Math.sin(angleRad);
  }

  private calculatePositionRandomlyInParent(node: MapNode, parentNode: MapNode) {
      const randomAngle = Math.random() * 2 * Math.PI;
      const parentRadius = parentNode.displayRadius > 0 ? parentNode.displayRadius : 20;
      const randomRadius = Math.random() * parentRadius * 0.8;
      node.x = parentNode.x + randomRadius * Math.cos(randomAngle);
      node.y = parentNode.y + randomRadius * Math.sin(randomAngle);
  }
}

export const mapDataProcessor = new MapDataProcessor({} as WorldDefinition);
