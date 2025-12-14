import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, pointer } from '../lib/d3-lite'
import { adaptGraphToFlow } from '../lib/graphAdapter'

function GraphCanvas({
  nodes = [],
  links = [],
  onFocusNode,
  onSelectionChange,
  selectedIds = [],
}) {
  const wrapperRef = useRef(null)
  const svgRef = useRef(null)
  const resizeFallbackAppliedRef = useRef(false)
  const simulationRef = useRef(null)
  const panRef = useRef({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 })

  const [size, setSize] = useState({ width: 360, height: 360 })
  const [positions, setPositions] = useState([])
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })

  const nodeLookup = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])

  const sanitizedSelection = useMemo(
    () => selectedIds.filter((id) => nodeLookup.has(id)),
    [nodeLookup, selectedIds],
  )

  const flowGraph = useMemo(
    () => adaptGraphToFlow(nodes, links, size),
    [links, nodes, size.height, size.width],
  )

  const positionMap = useMemo(() => {
    const map = new Map()
    positions.forEach((entry) => map.set(entry.id, entry))
    if (!positions.length) {
      flowGraph.nodes.forEach((node) => map.set(node.id, node.position || { x: 0, y: 0 }))
    }
    return map
  }, [flowGraph.nodes, positions])

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
    if (!flowGraph.nodes.length) {
      setPositions([])
      simulationRef.current?.stop()
      return undefined
    }

    const initialNodes = flowGraph.nodes.map((node) => ({
      ...node,
      x: node.position?.x ?? size.width / 2,
      y: node.position?.y ?? size.height / 2,
      vx: 0,
      vy: 0,
    }))

    const linkPayload = flowGraph.edges.map((edge) => ({
      ...edge,
      distance: 90 + (edge.data?.weight || 0) * 12,
      strength: 0.14 + (edge.data?.weight || 0) * 0.04,
    }))

    setPositions(initialNodes.map(({ id, x, y }) => ({ id, x, y })))

    const simulation = forceSimulation(initialNodes)
      .force(
        'link',
        forceLink(linkPayload)
          .id((d) => d.id)
          .distance((edge) => edge.distance)
          .strength((edge) => edge.strength),
      )
      .force('charge', forceManyBody(-120))
      .force('center', forceCenter(size.width / 2, size.height / 2).strength(0.25))
      .force('collision', forceCollide((node) => 24 + (node.data?.weight || 0) * 2).strength(0.9))
      .alpha(1)

    simulation.on('tick', () => {
      const nextPositions = simulation
        .nodes()
        .map(({ id, x, y }) => ({ id, x: x || 0, y: y || 0 }))
      setPositions(nextPositions)
    })

    simulationRef.current = simulation
    simulation.restart()

    return () => simulation.stop()
  }, [flowGraph.edges, flowGraph.nodes, size.height, size.width])

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

  const handleWheel = (event) => {
    event.preventDefault()
    const factor = event.deltaY < 0 ? 1.05 : 0.95
    const nextK = Math.max(0.6, Math.min(1.8, transform.k * factor))
    const [px, py] = pointer(event.nativeEvent, wrapperRef.current)
    const offsetX = px - (px - transform.x) * (nextK / transform.k)
    const offsetY = py - (py - transform.y) * (nextK / transform.k)
    setTransform({ x: offsetX, y: offsetY, k: nextK })
  }

  const handleBackgroundPointerDown = (event) => {
    if (event.target !== svgRef.current) return
    panRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: transform.x,
      originY: transform.y,
    }
  }

  const handleBackgroundPointerMove = (event) => {
    if (!panRef.current.dragging) return
    const dx = event.clientX - panRef.current.startX
    const dy = event.clientY - panRef.current.startY
    setTransform((prev) => ({ ...prev, x: panRef.current.originX + dx, y: panRef.current.originY + dy }))
  }

  const handleBackgroundPointerUp = () => {
    panRef.current.dragging = false
  }

  const handleDragStart = (event, nodeId) => {
    event.preventDefault()
    const sim = simulationRef.current
    if (!sim) return
    const node = sim.nodes().find((item) => item.id === nodeId)
    if (!node) return
    node.fx = node.x
    node.fy = node.y
    sim.alphaTarget(0.35).restart()
  }

  const handleDragMove = (event, nodeId) => {
    const sim = simulationRef.current
    if (!sim) return
    const node = sim.nodes().find((item) => item.id === nodeId)
    if (!node || node.fx == null || node.fy == null) return
    const [x, y] = pointer(event.nativeEvent, svgRef.current)
    node.fx = (x - transform.x) / transform.k
    node.fy = (y - transform.y) / transform.k
  }

  const handleDragEnd = (event, nodeId) => {
    event.preventDefault()
    const sim = simulationRef.current
    if (!sim) return
    const node = sim.nodes().find((item) => item.id === nodeId)
    if (!node) return
    node.fx = null
    node.fy = null
    sim.alphaTarget(0)
  }

  const emptyState = !flowGraph.nodes.length && !flowGraph.edges.length
  const viewBox = `0 0 ${Math.max(size.width, 1)} ${Math.max(size.height, 1)}`

  return (
    <div className="graph-wrapper" ref={wrapperRef} onClick={handlePaneClick}>
      <svg
        className="graph-canvas"
        ref={svgRef}
        viewBox={viewBox}
        role="presentation"
        onWheel={handleWheel}
        onPointerDown={handleBackgroundPointerDown}
        onPointerMove={handleBackgroundPointerMove}
        onPointerUp={handleBackgroundPointerUp}
        onPointerLeave={handleBackgroundPointerUp}
      >
        <g
          className="graph-stage"
          transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}
        >
          <g className="graph-edges" strokeLinecap="round" strokeLinejoin="round">
            {flowGraph.edges.map((edge) => {
              const source = positionMap.get(edge.source)
              const target = positionMap.get(edge.target)
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
              const { x = 0, y = 0 } = positionMap.get(node.id) || node.position || { x: 0, y: 0 }
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
                  onPointerDown={(event) => handleDragStart(event, node.id)}
                  onPointerMove={(event) => handleDragMove(event, node.id)}
                  onPointerUp={(event) => handleDragEnd(event, node.id)}
                  onPointerLeave={(event) => handleDragEnd(event, node.id)}
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
