<template>
  <div class="relationship-graph-container">
    <svg ref="svgRef"></svg>
    <RelationshipTimeline
      :visible="isTimelineVisible"
      :events="timelineEvents"
      :character-name="selectedNodeName"
      @close="isTimelineVisible = false"
      @event-hover="handleTimelineHover"
    />
  </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import { get } from 'lodash';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { getters } from '../../../../store';
import { getCharacterById } from '../../../../store/getters';
import { store } from '../../../../store/state';
import { safeGetValue } from '../../../../utils/character-utils';
import RelationshipTimeline from './RelationshipTimeline.vue';

const props = defineProps<{
  characterId: string;
}>();

const emit = defineEmits(['node-selected']);

const svgRef = ref<SVGSVGElement | null>(null);
const isTimelineVisible = ref(false);
const timelineEvents = ref<string[]>([]);
const selectedNodeName = ref('');
let simulation: d3.Simulation<any, any> | null = null;

const graphData = computed(() => {
  // We will enhance this later to accept a date for timeline scrubbing
  return getters.getCharacterRelationshipsForGraph(props.characterId).value;
});

function renderGraph() {
  if (!svgRef.value || !graphData.value) return;

  const { nodes, links } = graphData.value;
  const svg = d3.select(svgRef.value);
  svg.selectAll('*').remove();

  const width = svg.node()!.parentElement!.clientWidth;
  const height = svg.node()!.parentElement!.clientHeight;
  svg.attr('width', width).attr('height', height);

  // Define arrowheads
  svg
    .append('defs')
    .selectAll('marker')
    .data(['arrow-positive', 'arrow-negative', 'arrow-neutral'])
    .enter()
    .append('marker')
    .attr('id', d => d)
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 15)
    .attr('refY', -0.5)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', d => {
      if (d === 'arrow-positive') return '#28a745';
      if (d === 'arrow-negative') return '#6f42c1';
      return '#6c757d';
    });

  simulation = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3
        .forceLink(links)
        .id((d: any) => d.id)
        .distance(120),
    )
    .force('charge', d3.forceManyBody().strength(-500))
    .force('center', d3.forceCenter(width / 2, height / 2));

  const link = svg
    .append('g')
    .attr('class', 'links')
    .selectAll('path')
    .data(links)
    .join('path')
    .attr('stroke-width', d => d.lineStyle.width || 1)
    .attr('stroke', d => d.lineStyle.color || '#999')
    .attr('stroke-dasharray', d => (d.lineStyle.type === 'dashed' ? '5,5' : 'none'))
    .attr('marker-end', d => {
      if (d.lineStyle.color.includes('111, 66, 193')) return 'url(#arrow-negative)';
      if (d.lineStyle.color.includes('25, 135, 84')) return 'url(#arrow-positive)';
      return 'url(#arrow-neutral)';
    });

  const linkLabel = svg
    .append('g')
    .attr('class', 'link-labels')
    .selectAll('text')
    .data(links)
    .join('text')
    .text(d => d.label.formatter)
    .attr('dy', -5)
    .style('font-size', '10px')
    .style('fill', '#555');

  const nodeGroup = svg
    .append('g')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .call(drag(simulation) as any);

  // Avatar handling logic will be complex, for now, circle
  nodeGroup
    .append('circle')
    .attr('r', d => d.symbolSize / 2 || 20)
    .attr('fill', d => d.itemStyle?.color || '#666')
    .attr('stroke', '#fff')
    .attr('stroke-width', 2);

  nodeGroup
    .append('text')
    .text(d => d.name)
    .attr('x', d => (d.symbolSize / 2 || 20) + 5)
    .attr('y', '0.31em')
    .style('font-size', '13px')
    .style('font-weight', '500');

  // --- V6 Interaction Logic ---

  // 1. Node Interactions
  nodeGroup
    .on('click', (event, d) => {
      // Single click on node shows timeline
      showTimeline(d);
    })
    .on('dblclick', (event, d) => {
      // Double click on node navigates to detail page
      emit('node-selected', d.id);
    });

  // 2. Link Interactions
  const linkAndLabel = svg.selectAll('.links path, .link-labels text');
  linkAndLabel.on('click', (event, d) => {
      // Find the source node data to get the impression tags
      const sourceNodeData = nodes.find(n => n.id === (d as any).source.id || n.id === (d as any).source);
      const targetNodeData = nodes.find(n => n.id === (d as any).target.id || n.id === (d as any).target);
      if(sourceNodeData && targetNodeData) {
          showImpressionTags(event, sourceNodeData, targetNodeData);
      }
  });

  simulation.on('tick', () => {
    link.attr(
      'd',
      d => `M${(d.source as any).x},${(d.source as any).y} L${(d.target as any).x},${(d.target as any).y}`,
    );
    linkLabel
      .attr('x', d => ((d.source as any).x + (d.target as any).x) / 2)
      .attr('y', d => ((d.source as any).y + (d.target as any).y) / 2);
    nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);
  });
}

function showImpressionTags(event: MouseEvent, sourceNode: any, targetNode: any) {
  // V3修正：使用 safeGetValue 并设置 accessFirstElement: false 来获取整个数组
  if (!sourceNode.fullData) return;

  const impressionTagsRaw = safeGetValue(sourceNode.fullData, `人际关系.${targetNode.id}.印象标签`, [], false);

  // V4修正：更健壮地处理数据，兼容被字符串覆盖的错误情况
  let validTags: string[] = [];
  if (Array.isArray(impressionTagsRaw)) {
    validTags = impressionTagsRaw.flat().filter(tag => tag && typeof tag === 'string' && !tag.startsWith('$__META'));
  } else if (typeof impressionTagsRaw === 'string' && impressionTagsRaw.trim() !== '') {
    validTags = [impressionTagsRaw];
  }

  if (validTags.length === 0) return;

  const existingBubbles = d3.select(svgRef.value).selectAll('.impression-bubble-group');
  existingBubbles.remove();

  // Position the bubbles at the midpoint of the link
  const x = (sourceNode.x + targetNode.x) / 2;
  const y = (sourceNode.y + targetNode.y) / 2;

  const bubbleGroup = d3.select(svgRef.value).append('g')
    .attr('class', 'impression-bubble-group')
    .attr('transform', `translate(${x}, ${y})`);

  const bubbles = bubbleGroup.selectAll('g.impression-bubble')
    .data(validTags)
    .enter().append('g')
    .attr('class', 'impression-bubble');

  bubbles
    .append('rect')
    .attr('rx', 10)
    .attr('ry', 10)
    .attr('fill', 'rgba(0, 0, 0, 0.7)')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1);

  bubbles
    .append('text')
    .text(d => d as string)
    .attr('fill', 'white')
    .attr('font-size', '10px')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.3em');

  // Position bubbles around the node
  bubbles.each(function (d, i) {
    const textNode = d3.select(this).select('text').node() as SVGTextElement;
    if (!textNode) return;
    const textBBox = textNode.getBBox();
    d3.select(this)
      .select('rect')
      .attr('x', textBBox.x - 5)
      .attr('y', textBBox.y - 3)
      .attr('width', textBBox.width + 10)
      .attr('height', textBBox.height + 6);

    const angle = (i / validTags.length) * 2 * Math.PI;
    const radius = 30; // Bubbles are now around the link's midpoint, not a node
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    d3.select(this).attr('transform', `translate(${x}, ${y})`);
  });

  // Fade out and remove after a delay
  bubbleGroup.transition().delay(2500).duration(500).style('opacity', 0).remove();
}

function showTimeline(nodeData: any) {
  // V4修正：更健壮地处理数据，兼容被字符串覆盖的错误情况
  const centralNode = graphData.value.nodes.find(n => n.id === props.characterId);
  if (!centralNode || !centralNode.fullData) return;

  const eventsRaw = safeGetValue(centralNode.fullData, `人际关系.${nodeData.id}.关系事件`, [], false);
  
  let validEvents: string[] = [];
  if (Array.isArray(eventsRaw)) {
    validEvents = eventsRaw.flat().filter(e => e && typeof e === 'string' && !e.startsWith('$__META'));
  } else if (typeof eventsRaw === 'string' && eventsRaw.trim() !== '') {
    validEvents = [eventsRaw];
  }

  timelineEvents.value = validEvents;
  selectedNodeName.value = nodeData.name;
  isTimelineVisible.value = true;
}

function handleTimelineHover(date: string | null) {
  // This is where we would re-calculate the graph for a specific time
  console.log('Hovering on timeline event at date:', date);
}

function drag(simulation: d3.Simulation<any, any>) {
    function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

onMounted(() => {
  nextTick(renderGraph);
});

watch(
  () => props.characterId,
  () => {
    nextTick(renderGraph);
  },
);
</script>

<style scoped>
.relationship-graph-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
