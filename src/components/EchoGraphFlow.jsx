import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { adaptGraphToFlow } from '../lib/graphAdapter'

const fitViewOptions = { padding: 0.24, duration: 420 }

function EchoGraphFlowInner({ nodes = [], links = [], onFocusNode, onSelectionChange, selectedIds = [] }) {
  const wrapperRef = useRef(null)
  const resizeFallbackAppliedRef = useRef(false)
  const { fitView } = useReactFlow()

  const [size, setSize] = useState({ width: 360, height: 360 })

  const nodeLookup = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])

  const sanitizedSelection = useMemo(
    () => selectedIds.filter((id) => nodeLookup.has(id)),
    [nodeLookup, selectedIds],
  )

  const flowGraph = useMemo(() => adaptGraphToFlow(nodes, links, size), [links, nodes, size.height, size.width])

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(flowGraph.nodes)
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(flowGraph.edges)

  useEffect(() => setRfNodes(flowGraph.nodes), [flowGraph.nodes, setRfNodes])
  useEffect(() => setRfEdges(flowGraph.edges), [flowGraph.edges, setRfEdges])

  useEffect(() => {
    if (!wrapperRef.current) return undefined

    if (typeof ResizeObserver === 'undefined') {
      const rect = wrapperRef.current.getBoundingClientRect()
      setSize({ width: rect.width, height: rect.height })
      resizeFallbackAppliedRef.current = true
      return undefined
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setSize({ width, height })
      }
    })

    resizeObserver.observe(wrapperRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (fitView && rfNodes.length) {
      fitView(fitViewOptions)
    }
  }, [fitView, rfNodes.length])

  const toggleSelection = (nodeId) => {
    if (!nodeLookup.has(nodeId)) return

    const exists = sanitizedSelection.includes(nodeId)
    const updatedIds = exists
      ? sanitizedSelection.filter((id) => id !== nodeId)
      : [...sanitizedSelection, nodeId].slice(-2)

    const nextNodes = updatedIds.map((id) => nodeLookup.get(id)).filter(Boolean)
    onSelectionChange?.(nextNodes)
  }

  const handleNodeClick = (event, node) => {
    event?.preventDefault?.()
    const original = nodeLookup.get(node.id) || node.data?.original
    onFocusNode?.(original || node.data)
  }

  const handleNodeDoubleClick = (event, node) => {
    event?.preventDefault?.()
    toggleSelection(node.id)
  }

  const handlePaneDoubleClick = () => {
    if (fitView) fitView(fitViewOptions)
  }

  const handlePaneClick = () => {
    onFocusNode?.(null)
  }

  const emptyState = !rfNodes.length && !rfEdges.length

  return (
    <div className="graph-wrapper" ref={wrapperRef}>
      <ReactFlow
        nodes={rfNodes.map((node) => ({
          ...node,
          selected: sanitizedSelection.includes(node.id),
        }))}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={fitViewOptions}
        panOnScroll
        panOnDrag
        zoomOnPinch
        zoomOnDoubleClick={false}
        selectionOnDrag={false}
        proOptions={{ hideAttribution: true }}
        minZoom={0.45}
        maxZoom={2.8}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneDoubleClick={handlePaneDoubleClick}
        onPaneClick={handlePaneClick}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background color="rgba(255,255,255,0.12)" gap={20} />
        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>

      <div className="graph-overlay">
        <div className="graph-state">
          {emptyState ? 'Dépose des mots pour tracer une constellation.' : 'Tap = focus · Double tap = sélectionner · Pinch = zoom · Double tap vide = recentrer'}
        </div>
        {resizeFallbackAppliedRef.current && (
          <div className="graph-state minor">ResizeObserver absent · taille figée</div>
        )}
      </div>
    </div>
  )
}

export function EchoGraphFlow(props) {
  return (
    <ReactFlowProvider>
      <EchoGraphFlowInner {...props} />
    </ReactFlowProvider>
  )
}

