import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const defaultNodes = [
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'lenteur', label: 'Lenteur' },
  { id: 'nuit', label: 'Nuit' },
  { id: 'souffle', label: 'Souffle' },
]

const defaultLinks = [
  { source: 'fatigue', target: 'lenteur' },
  { source: 'fatigue', target: 'nuit' },
  { source: 'souffle', target: 'lenteur' },
]

function EchoGraphD3({ nodes = defaultNodes, links = defaultLinks, onNodeTap }) {
  const svgRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const svgEl = svgRef.current
    const wrapperEl = wrapperRef.current
    if (!svgEl || !wrapperEl) return undefined

    // Clone data so the simulation can adjust positions freely.
    const nodesData = nodes.map((node) => ({ ...node }))
    const linksData = links.map((link) => ({ ...link }))

    const svg = d3.select(svgEl)
    svg.selectAll('*').remove()

    const initialRect = wrapperEl.getBoundingClientRect()
    let width = initialRect.width || 360
    let height = initialRect.height || 360
    svg.attr('width', width).attr('height', height)

    const container = svg.append('g')

    const simulation = d3
      .forceSimulation(nodesData)
      .force('link', d3.forceLink(linksData).id((d) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))

    const link = container
      .append('g')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-opacity', 0.9)
      .selectAll('line')
      .data(linksData)
      .join('line')
      .attr('stroke-width', 1.2)

    const node = container
      .append('g')
      .selectAll('circle')
      .data(nodesData)
      .join('circle')
      .attr('r', 16)
      .attr('fill', '#60a5fa')
      .attr('stroke', '#0ea5e9')
      .attr('stroke-width', 1.5)
      .call(drag(simulation))
      .on('click', (_, d) => {
        // Simple trace to confirm interaction is working.
        if (onNodeTap) onNodeTap(d.id)
      })

    const labels = container
      .append('g')
      .selectAll('text')
      .data(nodesData)
      .join('text')
      .text((d) => d.label)
      .attr('font-size', 12)
      .attr('fill', '#0f172a')
      .attr('text-anchor', 'middle')
      .attr('dy', 30)

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)

      node.attr('cx', (d) => d.x).attr('cy', (d) => d.y)
      labels.attr('x', (d) => d.x).attr('y', (d) => d.y)
    })

    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform)
      })

    svg.call(zoom)

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width: nextWidth, height: nextHeight } = entry.contentRect
      if (!nextWidth || !nextHeight) return

      width = nextWidth
      height = nextHeight
      svg.attr('width', width).attr('height', height)
      simulation.force('center', d3.forceCenter(width / 2, height / 2))
      simulation.alpha(0.5).restart()
    })

    resizeObserver.observe(wrapperEl)

    const handleWindowResize = () => {
      const rect = wrapperEl.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      width = rect.width
      height = rect.height
      svg.attr('width', width).attr('height', height)
      simulation.force('center', d3.forceCenter(width / 2, height / 2))
      simulation.alpha(0.5).restart()
    }

    window.addEventListener('resize', handleWindowResize)

    return () => {
      window.removeEventListener('resize', handleWindowResize)
      resizeObserver.disconnect()
      simulation.stop()
      svg.selectAll('*').remove()
    }
  }, [nodes, links, onNodeTap])

  return (
    <div className="graph-wrapper" ref={wrapperRef}>
      <svg
        ref={svgRef}
        role="img"
        aria-label="Graphe D3 minimal"
        tabIndex={0}
      />
    </div>
  )
}

function drag(simulation) {
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    event.subject.fx = event.subject.x
    event.subject.fy = event.subject.y
  }

  function dragged(event) {
    event.subject.fx = event.x
    event.subject.fy = event.y
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0)
    event.subject.fx = null
    event.subject.fy = null
  }

  return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended)
}

export default EchoGraphD3
