import * as d3 from 'd3';
import type { MapNode, RelativeCoordinate } from '../types';

/**
 * @file CoordinateService.ts
 * @description V7.2 - 负责解析实体间的相对坐标，并计算其在2D星图上的精确位置。
 *
 * @职责:
 * 1. 解析描述性的方位角（如 "['北', 15]"），将其转换为数学上的弧度。
 * 2. 根据全局缩放比例，将不同单位的距离（km, AU, 光年）归一化为屏幕像素。
 * 3. 结合父节点位置、方位角和距离，计算出子节点的笛卡尔坐标 (x, y)。
 */
class CoordinateService {
  private baseAngleMap: Map<string, number>;

  constructor() {
    // 定义基础方位与弧度的映射 (Y轴向上为北, X轴向右为东)
    // SVG/Canvas 坐标系: X轴向右为正, Y轴向下为正
    // 0度(弧度0) -> 东
    // 90度(PI/2) -> 南
    // 180度(PI) -> 西
    // 270度(-PI/2) -> 北
    this.baseAngleMap = new Map([
      ['东', 0],
      ['E', 0],
      ['东南', Math.PI / 4],
      ['SE', Math.PI / 4],
      ['南', Math.PI / 2],
      ['S', Math.PI / 2],
      ['西南', (Math.PI * 3) / 4],
      ['SW', (Math.PI * 3) / 4],
      ['西', Math.PI],
      ['W', Math.PI],
      ['西北', (Math.PI * 5) / 4],
      ['NW', (Math.PI * 5) / 4],
      ['北', (Math.PI * 3) / 2],
      ['N', (Math.PI * 3) / 2],
      ['东北', (Math.PI * 7) / 4],
      ['NE', (Math.PI * 7) / 4],
      ['中', 0],
      ['C', 0],
      ['上', -Math.PI / 2],
      ['Up', -Math.PI / 2],
      ['下', Math.PI / 2],
      ['Down', Math.PI / 2],
    ]);
  }

  /**
   * 解析方位描述，返回弧度。
   * @param方位 - 如 "['北', 15]" 或 "['东北', -10]"
   * @returns 最终计算出的弧度值。
   */
  private parseAzimuth(azimuthValue: string | (string | number)[]): number | null {
    try {
      let baseDirection: string;
      let offsetDegrees = 0;

      if (Array.isArray(azimuthValue)) {
        baseDirection = String(azimuthValue[0]).trim();
        offsetDegrees = azimuthValue.length > 1 ? Number(azimuthValue[1]) : 0;
      } else if (typeof azimuthValue === 'string') {
        // Handle cases like "['东南', 10]" or just "东南"
        const cleanedValue = azimuthValue.replace(/[[\]'"]/g, '').trim();
        const parts = cleanedValue.split(',');
        baseDirection = parts[0].trim();
        offsetDegrees = parts.length > 1 ? Number(parts[1]) : 0;
      } else {
        console.warn('[CoordinateService] 无效的方位角输入类型:', azimuthValue);
        return null;
      }

      if (!baseDirection) {
        console.warn('[CoordinateService] 无法从输入中解析出基本方向:', azimuthValue);
        return null;
      }

      if (isNaN(offsetDegrees)) {
        console.warn(`[CoordinateService] 方位中的角度值不是一个有效的数字:`, azimuthValue);
        // 即使角度无效，也尝试仅使用基础方向进行渲染
        const baseAngle = this.baseAngleMap.get(baseDirection);
        return baseAngle !== undefined ? baseAngle : null;
      }

      const baseAngle = this.baseAngleMap.get(baseDirection);

      if (baseAngle === undefined) {
        console.warn(`[CoordinateService] 未知的基本方位: '${baseDirection}'`);
        return null;
      }

      const offsetRadians = (offsetDegrees * Math.PI) / 180;
      return baseAngle + offsetRadians;
    } catch (error) {
      console.error(`[CoordinateService] 解析方位值时发生不可预知的错误:`, { value: azimuthValue, error });
      return null;
    }
  }

  /**
   * 将不同单位的距离统一转换为一个巨大的“理论像素值”。
   * 这个值与真实世界距离成正比，不关心屏幕大小。
   * @param distance - 距离数组，如 [100, "km"]
   * @returns 理论像素距离
   */
  private normalizeDistance(distance: [number | string, string]): number {
    // 最终修复：强制将距离值转换为数字
    const value = Number(distance[0]);
    const unit = distance[1];

    if (isNaN(value)) {
      return 0;
    }

    switch (unit.toLowerCase()) {
      case 'km':
        return value;
      case 'au': // 天文单位
        return value * 149597870.7; // km
      case '光年':
        return value * 9460730472580.8; // km
      default:
        return value; // 默认视为km
    }
  }

  /**
   * 计算子节点相对于其父节点的精确笛卡尔坐标。
   * @param parentNode - 父节点，必须包含 x, y 坐标。
   * @param relativeCoord - 子节点的相对坐标定义。
   * @param scaleFactor - 距离缩放因子
   * @returns 返回 { x, y } 坐标对象，如果无法计算则返回 null。
   */
  public getCartesianCoordinates(
    parentNode: MapNode,
    relativeCoord: RelativeCoordinate,
  ): { x: number; y: number } | null {
    if (parentNode.x === undefined || parentNode.y === undefined || !relativeCoord) {
      return null;
    }

    const azimuth = this.parseAzimuth(relativeCoord.方位 as string | [string, number]);
    if (azimuth === null) {
      return null;
    }

    // 如果方位是“中”，直接返回父节点坐标
    // 最终修复：使用更健壮的方式提取基础方向
    let baseDirection = '';
    if (Array.isArray(relativeCoord.方位)) {
      baseDirection = String(relativeCoord.方位[0]);
    } else if (typeof relativeCoord.方位 === 'string') {
      const matches = relativeCoord.方位.match(/'[^']*'|"[^"]*"|[^,\s]+/g);
      if (matches && matches.length > 0) {
        baseDirection = matches[0].replace(/['"[\]]/g, '').trim();
      }
    }

    if (baseDirection === '中' || baseDirection.toUpperCase() === 'C') {
      return { x: parentNode.x, y: parentNode.y };
    }

    const theoreticalDistance = this.normalizeDistance(relativeCoord.距离);

    const childX = parentNode.x + theoreticalDistance * Math.cos(azimuth);
    const childY = parentNode.y + theoreticalDistance * Math.sin(azimuth);

    return { x: childX, y: childY };
  }
  /**
   * 计算一组子节点相对于其父节点的相对位置。
   * 它会根据子节点间的最大和最小“真实”距离，将它们映射到一个固定的视觉距离范围内。
   * @param parent - 父节点。
   * @param children - 需要布局的子节点数组。
   */
  public calculateRelativePositions(parent: MapNode, children: MapNode[]): void {
    if (!children || children.length === 0) {
      return;
    }

    const allDistances = children
      .map(child => (child.data.相对坐标 ? this.normalizeDistance(child.data.相对坐标.距离) : 0))
      .filter(d => d > 0);

    let distanceScale: d3.ScaleLinear<number, number>;
    const visualMin = 150;
    const visualMax = 400;

    if (allDistances.length > 0) {
      const min = Math.min(...allDistances);
      const max = Math.max(...allDistances);
      distanceScale = d3.scaleLinear().domain([min, max]).range([visualMin, visualMax]).clamp(true);
    } else {
      // 如果没有任何有效距离，创建一个默认的比例尺
      distanceScale = d3.scaleLinear().domain([0, 1]).range([visualMin, visualMin]);
    }

    children.forEach(child => {
      const coord = child.data.相对坐标;
      if (!coord) {
        child.x = parent.x;
        child.y = parent.y;
        return;
      }

      const isOverlapping = coord.方位.includes('中') && this.normalizeDistance(coord.距离) === 0;
      const isVertical = coord.方位.includes('上') || coord.方位.includes('下');

      if (isOverlapping || isVertical) {
        child.x = parent.x;
        child.y = parent.y;
        if (isVertical) {
          const azimuth = this.parseAzimuth(coord.方位 as string | [string, number]);
          if (azimuth !== null) {
            const visualDistance = distanceScale(this.normalizeDistance(coord.距离));
            child.y = (child.y ?? 0) + visualDistance * Math.sin(azimuth);
          }
        }
        return;
      }

      const azimuth = this.parseAzimuth(coord.方位 as string | [string, number]);
      if (azimuth === null) {
        child.x = parent.x;
        child.y = parent.y;
        return;
      }

      const theoreticalDistance = this.normalizeDistance(coord.距离);
      const visualDistance = distanceScale(theoreticalDistance);

      child.x = parent.x! + visualDistance * Math.cos(azimuth);
      child.y = parent.y! + visualDistance * Math.sin(azimuth);
    });
  }
}

export const coordinateService = new CoordinateService();
