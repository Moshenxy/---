import * as d3 from 'd3';

/**
 * @file ColorService.ts
 * @description 根据字符串（如节点类型）生成稳定颜色的服务。
 */
class ColorService {
  private colorCache: Map<string, string> = new Map();
  private colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  /**
   * 一个简单的字符串哈希函数。
   * @param str - 输入字符串。
   * @returns - 一个非负整数哈希值。
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * 根据节点类型获取一个稳定的颜色。
   * @param type - 节点的层级类型字符串。
   * @returns - 一个十六进制颜色字符串。
   */
  public getColor(type: string): string {
    if (this.colorCache.has(type)) {
      return this.colorCache.get(type)!;
    }

    // 使用哈希值从序数比例尺中获取一个稳定的颜色
    // 注意：d3.schemeCategory10 只有 10 种颜色，如果类型很多，颜色会重复。
    // 在实际应用中，可以考虑使用更大的颜色方案或更复杂的生成逻辑。
    const hash = this.simpleHash(type);
    const color = this.colorScale(String(hash % 10));

    this.colorCache.set(type, color);
    return color;
  }
}

export const colorService = new ColorService();
