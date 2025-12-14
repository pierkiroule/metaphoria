import { useEffect, useRef } from 'react'
import * as d3 from '../lib/d3-lite'

const TYPE_COLOR = {
  word: '#94a3b8',
  tag: '#60a5fa',
  metaphor: '#f59e0b',
  echo: '#bae6fd',
}

const BASE_ORBITS = {
  metaphor: 0,
  tag: 96,
  word: 140,
  echo: 170,
}

export default function CosmoGraph({ nodes = [], links = [] }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    if (!nodes.length) return

    const width = 360
    const height = 360
    const cx = width / 2
    const cy = height / 2
    const maxRadius = Math.min(width, height) / 2 - 10

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Graphe cosmobulle minimal')

    const positioned = new Map()

    const byLevel = (level) => nodes.filter((node) => (node.level || node.type) === level)

    const placeRing = (list, fallbackOrbit, jitter = 0) => {
      const total = Math.max(list.length, 1)
      list.forEach((node, index) => {
        const baseOrbit = BASE_ORBITS[node.level] ?? fallbackOrbit
        const orbit = Math.min(Math.max(node.orbit ?? baseOrbit, baseOrbit), maxRadius)
        const angle = (2 * Math.PI * index) / total - Math.PI / 2 + jitter
        positioned.set(node.id, {
          ...node,
          x: cx + orbit * Math.cos(angle),
          y: cy + orbit * Math.sin(angle),
        })
      })
    }

    const metaphors = byLevel('metaphor')
    if (metaphors.length === 1) {
      positioned.set(metaphors[0].id, { ...metaphors[0], x: cx, y: cy })
    } else if (metaphors.length > 1) {
      placeRing(metaphors, 22)
    }

    placeRing(byLevel('tag'), BASE_ORBITS.tag)
    placeRing(byLevel('word'), BASE_ORBITS.word, 0.08)
    placeRing(byLevel('echo'), BASE_ORBITS.echo, -0.12)

    const linkGroup = svg
      .append('g')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-opacity', 0.35)

    links.forEach((link) => {
      const source = positioned.get(link.source)
      const target = positioned.get(link.target)
      if (!source || !target) return
      linkGroup
        .append('line')
        .attr('x1', source.x)
        .attr('y1', source.y)
        .attr('x2', target.x)
        .attr('y2', target.y)
        .attr('stroke-width', Math.max(1, (link.strength || link.weight || 1) * 0.6))
    })

    const nodeGroup = svg.append('g')

    positioned.forEach((node) => {
      nodeGroup
        .append('circle')
        .attr('cx', node.x)
        .attr('cy', node.y)
        .attr('r', Math.max(4, (node.size || node.weight || 12) * 0.6))
        .attr('fill', TYPE_COLOR[node.level] || TYPE_COLOR[node.type] || '#cbd5e1')
        .attr('fill-opacity', node.level === 'echo' ? 0.6 : 0.9)
        .on('pointerdown', () => {
          // Minimal interaction: log the touched node without triggering reflow.
          console.log('CosmoGraph node', node)
        })
    })
  }, [nodes, links])

  return (
    <div className="cosmo-graph" aria-live="polite">
      <div className="cosmo-graph__head">
        <h3>CosmoGraph</h3>
        <p className="muted subtle">Graphe D3 minimal, prêt pour les métabulles.</p>
      </div>
      {!nodes.length && <p className="muted">Aucun nœud à afficher pour l’instant.</p>}
      <svg ref={svgRef} className="cosmo-graph__svg" role="presentation" />
      <p className="muted subtle">Tap sur un nœud → console log, aucun drag ni zoom.</p>
    </div>
  )
}
