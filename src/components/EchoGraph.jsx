import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export default function EchoGraph({ nodes }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    if (!nodes || nodes.length === 0) return

    const container = ref.current
    container.innerHTML = ''

    const width = container.offsetWidth || 320
    const height = 360

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    const simulation = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(36))

    const group = svg
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')

    group.append('circle')
      .attr('r', 26)
      .attr('fill', '#0f1224')
      .attr('stroke', '#7cf0ff')
      .attr('stroke-width', 1.5)

    group.append('text')
      .text(d => d.emoji || '•')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', 22)
      .attr('fill', '#fff')

    simulation.on('tick', () => {
      group.attr('transform', d => `translate(${d.x}, ${d.y})`)
    })

    return () => simulation.stop()
  }, [nodes])

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '360px',
        background: 'radial-gradient(circle at center, #0b0e1a, #05060a)'
      }}
    />
  )
}