import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from './d3-lite'

const typeColors = {
  word: '#8fd0ff',
  tag: '#9ef0e6',
  metaphor: '#f6c2ff',
  echo: '#ffd7a6',
  style: '#c1c8ff',
  usage: '#b3e0ff',
}

const defaultColor = '#d9e0ff'

export function EchoGraph({ nodes, links, onSelectNode, onGenerateEcho }) {
  const svgRef = useRef(null)
  const wrapperRef = useRef(null)
  const pressTimerRef = useRef()
  const tapRef = useRef(0)
  const [size, setSize] = useState({ width: 360, height: 540 })
  const [activeId, setActiveId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])

  const layoutNodes = useMemo(
    () => nodes.map((node) => ({ ...node })),
    [nodes],
  )

  const layoutLinks = useMemo(
    () => links.map((link) => ({ ...link })),
    [links],
  )

  useEffect(() => {
    if (!wrapperRef.current) return undefined

    // Some environments (SSR / older browsers) don’t expose ResizeObserver. In that
    // case, we fall back to a one-off size read so the graph can still render
    // instead of throwing a ReferenceError at startup.
    if (typeof ResizeObserver === 'undefined') {
      const rect = wrapperRef.current.getBoundingClientRect()
      setSize({ width: rect.width, height: rect.height })
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
    if (!svgRef.current) return undefined

    if (typeof window === 'undefined') return undefined

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg.append('g')
    const linkGroup = g.append('g').attr('class', 'links')
    const nodeGroup = g.append('g').attr('class', 'nodes')

    const linkElements = linkGroup
      .selectAll('line')
      .data(layoutLinks)
      .enter()
      .append('line')
      .attr('stroke', '#6a6f8b')
      .attr('stroke-opacity', 0.35)
      .attr('stroke-width', (d) => 1 + (d.weight || 0) * 0.8)

    const nodeElements = nodeGroup
      .selectAll('g.node')
      .data(layoutNodes)
      .enter()
      .append('g')
      .attr('class', 'node')

    const circles = nodeElements
      .append('circle')
      .attr('r', (d) => 12 + (d.weight || 1) * 6)
      .attr('fill', (d) => typeColors[d.type] || defaultColor)
      .attr('fill-opacity', 0.28)
      .attr('stroke', (d) => typeColors[d.type] || defaultColor)
      .attr('stroke-width', 1.4)

    nodeElements
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('class', 'node-label')
      .text((d) => `${d.emoji ? `${d.emoji} ` : ''}${d.label}`)

    const simulation = d3
      .forceSimulation(layoutNodes)
      .force(
        'link',
        d3
          .forceLink(layoutLinks)
          .id((d) => d.id)
          .distance((d) => 80 + (d.weight || 0) * 20),
      )
      .force('charge', d3.forceManyBody().strength(-140))
      .force('center', d3.forceCenter(size.width / 2, size.height / 2))
      .force('collision', d3.forceCollide().radius((d) => 16 + (d.weight || 1) * 8))

    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)

      nodeElements.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    const zoomBehavior = d3
      .zoom()
      .scaleExtent([0.6, 3])
      .on('zoom', (event) => {
        const { x = 0, y = 0, k = 1 } = event.transform || {}
        g.attr('transform', `translate(${x},${y}) scale(${k})`)
      })

    svg.call(zoomBehavior).on('dblclick.zoom', null)

    svg.on('dblclick', () => {
      svg
        .transition()
        .duration(320)
        .call(zoomBehavior.transform, d3.zoomIdentity())
    })

    const resetPressTimer = () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current)
        pressTimerRef.current = undefined
      }
    }

    const handleTap = (event, node) => {
      event.stopPropagation()
      setActiveId(node.id)
      onSelectNode?.(node)
    }

    const handleLongPress = (event, node) => {
      event.stopPropagation()
      setSelectedIds((current) => {
        const exists = current.includes(node.id)
        const updated = exists ? current.filter((id) => id !== node.id) : [...current, node.id].slice(-2)

        if (updated.length === 2) {
          const pair = layoutNodes.filter((item) => updated.includes(item.id))
          onGenerateEcho?.(pair)
        }

        return updated
      })
    }

    const registerPointer = (selection) => {
      selection
        .on('pointerdown', (event, node) => {
          const now = event.timeStamp
          const delta = now - tapRef.current
          tapRef.current = now

          pressTimerRef.current = setTimeout(() => handleLongPress(event, node), 520)

          const onPointerUp = (pointerEvent) => {
            resetPressTimer()
            if (pointerEvent.pointerId !== event.pointerId) return
            const isDoubleTap = delta > 50 && delta < 280
            if (isDoubleTap && svgRef.current) {
              svg
                .transition()
                .duration(280)
                .call(zoomBehavior.transform, d3.zoomIdentity)
              return
            }
            handleTap(pointerEvent, node)
          }

          const onPointerCancel = () => {
            resetPressTimer()
          }

          window.addEventListener('pointerup', onPointerUp, { once: true })
          window.addEventListener('pointercancel', onPointerCancel, { once: true })
        })
        .call(
          d3
            .drag()
            .on('start', (event, node) => {
              resetPressTimer()
              if (!event.active) simulation.alphaTarget(0.15).restart()
              node.fx = node.x
              node.fy = node.y
            })
            .on('drag', (event, node) => {
              node.fx = event.x
              node.fy = event.y
            })
            .on('end', (event, node) => {
              if (!event.active) simulation.alphaTarget(0)
              node.fx = null
              node.fy = null
            }),
        )
    }

    registerPointer(nodeElements)

    return () => {
      resetPressTimer()
      simulation.stop()
      svg.selectAll('*').remove()
    }
  }, [layoutLinks, layoutNodes, onGenerateEcho, onSelectNode, size.height, size.width])

  return (
    <div className="graph-wrapper" ref={wrapperRef}>
      <svg ref={svgRef} width="100%" height="100%" role="presentation" aria-hidden viewBox={`0 0 ${size.width} ${size.height}`}>
        <title>Graphe acteurs-réseaux</title>
      </svg>
      <div className="graph-overlay">
        <div className="graph-state">{layoutNodes.length ? 'Tap = focus · Tap long = sélectionner · Pinch = zoom' : 'L’écho reste discret. Rien n’insiste pour l’instant.'}</div>
        {activeId && (
          <div className="active-label">
            {layoutNodes.find((node) => node.id === activeId)?.label}
          </div>
        )}
        {selectedIds.length > 0 && (
          <div className="selection-label">
            {selectedIds.length === 1
              ? '1 nœud sélectionné'
              : `2 nœuds sélectionnés — un nouvel écho se tisse`}
          </div>
        )}
      </div>
    </div>
  )
}
