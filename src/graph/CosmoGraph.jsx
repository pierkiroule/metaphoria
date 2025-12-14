import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const nodes = [
  { id: 'fatigue', label: 'Fatigue', emoji: '🫧' },
  { id: 'lenteur', label: 'Lenteur', emoji: '🐢' },
  { id: 'nuit', label: 'Nuit', emoji: '🌘' },
  { id: 'souffle', label: 'Souffle', emoji: '🌬️' },
  { id: 'fleur', label: 'Fleur', emoji: '🌸' },
  { id: 'courage', label: 'Courage', emoji: '🔥' },
]

const links = [
  { source: 'fatigue', target: 'lenteur' },
  { source: 'fatigue', target: 'nuit' },
  { source: 'souffle', target: 'fleur' },
  { source: 'fleur', target: 'courage' },
  { source: 'nuit', target: 'souffle' },
]

export default function CosmoGraph() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = ''

    const width = el.clientWidth
    const height = el.clientHeight

    const svg = d3
      .select(el)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    const simulation = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))

    const link = svg
      .append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#3a3a4a')
      .attr('stroke-width', 2)
      .attr('opacity', 0.6)

    const node = svg
      .append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(
        d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      )

    node.append('circle')
      .attr('r', 28)
      .attr('fill', '#7cf0ff')
      .attr('opacity', 0.85)

    node.append('text')
      .text(d => d.emoji)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '22px')

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event, d) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }
  }, [])

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '100%',
        touchAction: 'none'
      }}
    />
  )
}