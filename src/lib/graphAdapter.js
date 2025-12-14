import { buildConstellationLayout } from './layout'

export function adaptGraphToFlow(rawNodes = [], rawEdges = [], viewport) {
  try {
    if (!Array.isArray(rawNodes) || !Array.isArray(rawEdges)) {
      console.error('Graph adaptation failed: nodes/edges are not arrays')
      return { nodes: [], edges: [] }
    }

    if (!rawNodes.length) return { nodes: [], edges: [] }

    const safeNodes = rawNodes.map((node, index) => ({
      id: node.id || `node-${index}`,
      label: node.label || '∅',
      type: node.type || 'node',
      emoji: node.emoji || '⟡',
      weight: typeof node.weight === 'number' ? node.weight : 1,
      kind: node.kind || node.type || 'node',
    }))

    const positionedNodes = buildConstellationLayout(safeNodes, rawEdges, viewport)

    const nodeIds = new Set(positionedNodes.map((node) => node.id))

    const flowNodes = positionedNodes.map((node) => ({
      id: node.id,
      type: 'default',
      data: {
        label: node.label,
        emoji: node.emoji,
        kind: node.type || 'node',
        weight: node.weight || 1,
        original: rawNodes.find((item) => item.id === node.id) || node,
      },
      position: node.position || { x: 0, y: 0 },
      draggable: true,
      className: `flow-node kind-${node.type || 'node'}`,
    }))

    const flowEdges = rawEdges
      .map((edge, index) => ({
        id: edge.id || `edge-${edge.source}-${edge.target}-${index}`,
        source: edge.source,
        target: edge.target,
        data: { weight: edge.weight || 1, kind: edge.kind || 'link' },
        animated: false,
        style: {
          strokeWidth: 1.1 + (edge.weight || 0) * 0.4,
          opacity: 0.72,
        },
      }))
      .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))

    return { nodes: flowNodes, edges: flowEdges }
  } catch (error) {
    console.error('React Flow adaptation failed', error)
    return { nodes: [], edges: [] }
  }
}

