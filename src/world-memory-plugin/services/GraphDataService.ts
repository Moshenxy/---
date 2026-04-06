import { TavernService } from './tavern.service';
import { NatureSchema, CognitionSchema } from '../types';
import type { NatureTrait, CognitiveStatement, EpisodicMemoryUnit } from '../types';

// 定义D3节点和连接的数据结构
export interface GraphNode {
  id: string; // 唯一ID，可以是条目名
  type: 'NATURE' | 'COGNITION' | 'MEMORY';
  label: string; // 节点显示的文本
  data: any;
}

export interface GraphLink {
  source: string; // 源节点ID
  target: string; // 目标节点ID
}

export class GraphDataService {
  public static async getGraphData(): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const memoryNodeMap = new Map<string, GraphNode>();

    // 1. 获取所有解析好的数据
    const natureEntry = await TavernService.findNatureEntry();
    const natureData = natureEntry ? NatureSchema.parse(JSON.parse(natureEntry.content || '[]')) : null;
    const cognitionEntries = await TavernService.getCognitionEntries();
    const allCognitions = await TavernService.getAllCognitions();
    const allMemoryEntries = await TavernService.getEpisodicEntries();

    // 2. 创建所有“记忆”节点
    for (const entry of allMemoryEntries) {
      if (!entry.name || !entry.extra?.memoryData) continue;
      const node: GraphNode = {
        id: entry.name,
        type: 'MEMORY',
        label: entry.extra.memoryData.summary.text.substring(0, 15) + '...',
        data: entry.extra.memoryData,
      };
      nodes.push(node);
      memoryNodeMap.set(entry.name, node);
    }

    // 3. 创建“本性”和“认知”的层次结构
    const natureTraitNodes: GraphNode[] = [];
    const cognitionStatementNodes: GraphNode[] = [];

    // 中心“本性”核心节点
    const natureCoreNode: GraphNode = {
      id: 'NATURE_CORE',
      type: 'NATURE',
      label: '本性核心',
      data: { id: 'NATURE_CORE', trait: '核心', description: '所有本性特质的汇集点' },
    };
    nodes.push(natureCoreNode);

    if (natureData) {
      for (const trait of natureData) {
        const traitNode: GraphNode = {
          id: `nature-${trait.id}`,
          type: 'NATURE',
          label: trait.trait,
          data: { ...trait, parentEntryName: natureEntry!.name },
        };
        nodes.push(traitNode);
        natureTraitNodes.push(traitNode);
        links.push({ source: natureCoreNode.id, target: traitNode.id });
      }
    }

    for (const statement of allCognitions) {
      const parentEntry = cognitionEntries.find(entry => {
        try {
          return (JSON.parse(entry.content || '[]') as CognitiveStatement[]).some(s => s.id === statement.id);
        } catch {
          return false;
        }
      });

      const statementNode: GraphNode = {
        id: `cognition-${statement.id}`,
        type: 'COGNITION',
        label: statement.statement.substring(0, 20) + '...',
        data: { ...statement, parentEntryName: parentEntry?.name },
      };
      nodes.push(statementNode);
      cognitionStatementNodes.push(statementNode);
    }

    // 4. 创建链接
    // 4.1 本性 -> 记忆 (双向)
    for (const traitNode of natureTraitNodes) {
      const trait = traitNode.data as NatureTrait;
      for (const memId of trait.supporting_memories) {
        if (memoryNodeMap.has(memId)) {
          links.push({ source: traitNode.id, target: memId });
          links.push({ source: memId, target: traitNode.id }); // Reverse link
        }
      }
    }

    // 4.2 认知 -> 记忆 (双向)
    for (const statementNode of cognitionStatementNodes) {
      const statement = statementNode.data as CognitiveStatement;
      for (const memId of statement.supporting_memories) {
        if (memoryNodeMap.has(memId)) {
          links.push({ source: statementNode.id, target: memId });
          links.push({ source: memId, target: statementNode.id }); // Reverse link
        }
      }
    }

    return { nodes, links };
  }
}
