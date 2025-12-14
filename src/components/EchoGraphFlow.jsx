import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { adaptGraphToFlow } from '../lib/graphAdapter'

function GraphCanvas({
  nodes = [],
  links = [],
  onFocusNode,
  onSelectionChange,
  selectedIds = [],
}) {
  const wrapperRef = useRef(null)
  const resizeFallbackAppliedRef = useRef(false)

  const [size, setSize] = useState({ width: 360, height: 360 })

  const nodeLookup = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])

  const sanitizedSelection = useMemo(
    () => selectedIds.filter((id) => nodeLookup.has(id)),
    [nodeLookup, selectedIds],
  )

  const flowGraph = useMemo(
    () => adaptGraphToFlow(nodes, links, size),
    [links, nodes, size.height, size.width],
  )

  const positions = useMemo(
    () => new Map(flowGraph.nodes.map((node) => [node.id, node.position || { x: 0, y: 0 }])),
    [flowGraph.nodes],
  )

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
    if (!sanitizedSelection.length) return
    const focusedNode = nodeLookup.get(sanitizedSelection[0])
    if (focusedNode) {
      onFocusNode?.(focusedNode)
    }
  }, [nodeLookup, onFocusNode, sanitizedSelection])

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
    event?.stopPropagation?.()
    const original = nodeLookup.get(node.id) || node.data?.original
    onFocusNode?.(original || node.data)
  }

  const handleNodeDoubleClick = (event, node) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    toggleSelection(node.id)
  }

  const handlePaneClick = () => {
    onFocusNode?.(null)
  }

  const emptyState = !flowGraph.nodes.length && !flowGraph.edges.length
  const viewBox = `0 0 ${Math.max(size.width, 1)} ${Math.max(size.height, 1)}`

  return (
    <div className="graph-wrapper" ref={wrapperRef} onClick={handlePaneClick}>
      <svg className="graph-canvas" viewBox={viewBox} role="presentation">
        <g className="graph-edges" strokeLinecap="round" strokeLinejoin="round">
          {flowGraph.edges.map((edge) => {
            const source = positions.get(edge.source)
            const target = positions.get(edge.target)
            if (!source || !target) return null

            const weight = edge.data?.weight || 1
            return (
              <line
                key={edge.id}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                strokeWidth={1 + weight * 0.4}
                stroke="rgba(15, 23, 42, 0.55)"
                opacity={0.78}
              />
            )
          })}
        </g>

        <g className="graph-nodes">
          {flowGraph.nodes.map((node) => {
            const selected = sanitizedSelection.includes(node.id)
            const { x, y } = node.position || { x: 0, y: 0 }
            const label = node.data?.label || ''
            const emoji = node.data?.emoji || '⟡'
            const kind = node.data?.kind || 'node'

            return (
              <g
                key={node.id}
                className={`graph-node kind-${kind}${selected ? ' selected' : ''}`}
                transform={`translate(${x}, ${y})`}
                onClick={(event) => handleNodeClick(event, node)}
                onDoubleClick={(event) => handleNodeDoubleClick(event, node)}
              >
                <circle r={18 + (node.data?.weight || 0) * 2} />
                <text className="graph-emoji" y={-2}>
                  {emoji}
                </text>
                <text className="graph-label" y={12}>
                  {label}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      <div className="graph-overlay">
        <div className="graph-state">
          {emptyState
            ? 'Dépose des mots pour tracer une constellation.'
            : 'Tap = focus · Double tap = sélectionner · Tap vide = désélectionner'}
        </div>
        {resizeFallbackAppliedRef.current && (
          <div className="graph-state minor">ResizeObserver absent · taille figée</div>
        )}
      </div>
    </div>
  )
}

function GraphFallback({ status }) {
  return (
    <div className="graph-wrapper graph-loader">
      <div className="graph-loader-ring" aria-hidden />
      <p className="graph-loader-text">
        {status === 'error'
          ? 'Chargement du graphe indisponible. Vérifie la connexion.'
          : 'Chargement du moteur de graphe...'}
      </p>
    </div>
  )
}

class GraphBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Graph rendering failed', error)
  }

  render() {
    if (this.state.hasError) {
      return <GraphFallback status="error" />
    }

    return this.props.children
  }
}

export function EchoGraphFlow(props) {
  return (
    <GraphBoundary>
      <GraphCanvas {...props} />
    </GraphBoundary>
  )
}
