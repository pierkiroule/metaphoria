import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const defaultEmojiNodes = [
  {
    id: 'emoji-🫧',
    emoji: '🫧',
    count: 12,
    tags: ['transformation', 'fragilité', 'passage', 'lent'],
  },
  {
    id: 'emoji-🌫️',
    emoji: '🌫️',
    count: 6,
    tags: ['flou', 'lenteur', 'crépuscule'],
  },
  {
    id: 'emoji-🌱',
    emoji: '🌱',
    count: 4,
    tags: ['éveil', 'germer', 'départ'],
  },
  {
    id: 'emoji-✨',
    emoji: '✨',
    count: 3,
    tags: ['éclat', 'impulsion'],
  },
]

const defaultEmojiLinks = [
  { source: 'emoji-🫧', target: 'emoji-🌫️', weight: 7 },
  { source: 'emoji-🫧', target: 'emoji-🌱', weight: 3 },
  { source: 'emoji-🌫️', target: 'emoji-🌱', weight: 2 },
  { source: 'emoji-🫧', target: 'emoji-✨', weight: 2 },
]

function EchoGraphD3({
  emojiNodes = defaultEmojiNodes,
  emojiLinks = defaultEmojiLinks,
  tagNodes: providedTagNodes,
  onNodeTap,
}) {
  const svgRef = useRef(null)
  const wrapperRef = useRef(null)
  const focusRef = useRef(null)

  // Build tag nodes if the caller does not pass any.
  const tagNodes =
    providedTagNodes ||
    emojiNodes.flatMap((emoji) =>
      (emoji.tags || []).map((tag, index) => ({
        id: `tag-${emoji.emoji}-${tag}`,
        label: `#${tag}`,
        emojiParent: emoji.id,
        count: Math.max(1, (emoji.count || 1) - index),
      })),
    )

  useEffect(() => {
    const svgEl = svgRef.current
    const wrapperEl = wrapperRef.current
    if (!svgEl || !wrapperEl) return undefined

    // Clone data so the simulation can adjust positions freely.
    const emojiData = emojiNodes.map((node) => ({ ...node, type: 'emoji' }))
    const tagData = tagNodes.map((node) => ({ ...node, type: 'tag' }))

    const nodesData = [...emojiData, ...tagData]

    const linksData = [
      ...emojiLinks.map((link) => ({ ...link, type: 'emoji-link' })),
      ...tagData.map((tag) => ({
        source: tag.emojiParent,
        target: tag.id,
        weight: Math.max(1, tag.count || 1),
        type: 'tag-link',
      })),
    ]

    const svg = d3.select(svgEl)
    svg.selectAll('*').remove()

    const initialRect = wrapperEl.getBoundingClientRect()
    let width = initialRect.width || 360
    let height = initialRect.height || 360
    svg.attr('width', width).attr('height', height)

    const container = svg.append('g')

    const radiusScale = d3
      .scaleSqrt()
      .domain([1, d3.max(emojiData, (d) => d.count || 1) || 1])
      .range([44, 82])

    const tagRadiusScale = d3
      .scaleSqrt()
      .domain([1, d3.max(tagData, (d) => d.count || 1) || 1])
      .range([12, 22])

    const simulation = d3
      .forceSimulation(nodesData)
      .force(
        'link',
        d3
          .forceLink(linksData)
          .id((d) => d.id)
          .distance((d) => (d.type === 'tag-link' ? 90 : 140))
          .strength((d) => (d.type === 'tag-link' ? 0.6 : 0.4)),
      )
      .force(
        'charge',
        d3
          .forceManyBody()
          .strength((d) => (d.type === 'tag' ? -20 : -320)),
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) =>
        d.type === 'emoji' ? radiusScale(d.count || 1) + 8 : tagRadiusScale(d.count || 1) + 12,
      ))

    const link = container
      .append('g')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-opacity', 0.85)
      .selectAll('line')
      .data(linksData)
      .join('line')
      .attr('stroke-width', (d) => (d.type === 'emoji-link' ? 1.5 + (d.weight || 1) * 0.2 : 0.8))
      .attr('stroke-dasharray', (d) => (d.type === 'tag-link' ? '4 3' : null))

    const emojiNodesSelection = container
      .append('g')
      .selectAll('g')
      .data(emojiData)
      .join('g')
      .call(drag(simulation))
      .on('click', (_, d) => {
        focusRef.current = d.id
        updateTagVisibility(currentZoom)
        if (onNodeTap) onNodeTap(d.id)
        console.log('tap', d.id)
      })

    emojiNodesSelection
      .append('circle')
      .attr('r', (d) => radiusScale(d.count || 1))
      .attr('fill', '#e2f3ff')
      .attr('stroke', '#0ea5e9')
      .attr('stroke-width', 2)

    emojiNodesSelection
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', (d) => Math.max(18, Math.min(32, radiusScale(d.count || 1))))
      .text((d) => d.emoji)

    const tagNodesSelection = container
      .append('g')
      .selectAll('g')
      .data(tagData)
      .join('g')
      .call(drag(simulation))
      .on('click', (_, d) => {
        focusRef.current = d.emojiParent
        updateTagVisibility(currentZoom)
        if (onNodeTap) onNodeTap(d.id)
        console.log('tap', d.id)
      })

    tagNodesSelection
      .append('circle')
      .attr('r', (d) => tagRadiusScale(d.count || 1))
      .attr('fill', '#f8fafc')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1.4)

    tagNodesSelection
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', 11)
      .attr('fill', '#334155')
      .text((d) => d.label)

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)

      emojiNodesSelection.attr('transform', (d) => `translate(${d.x},${d.y})`)
      tagNodesSelection.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    let currentZoom = 1

    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        currentZoom = event.transform.k
        container.attr('transform', event.transform)
        updateTagVisibility(currentZoom)
      })

    svg.call(zoom)

    function updateTagVisibility(zoomLevel) {
      const showAllTags = zoomLevel >= 1.2
      const focusedEmoji = focusRef.current

      tagNodesSelection.attr('display', (d) => {
        if (showAllTags) return null
        if (focusedEmoji && d.emojiParent === focusedEmoji) return null
        return 'none'
      })

      link.attr('opacity', (d) => {
        if (d.type === 'emoji-link') return 0.85
        if (showAllTags) return 0.6
        if (focusedEmoji && d.source.id === focusedEmoji) return 0.45
        return 0.15
      })
    }

    updateTagVisibility(currentZoom)

    let resizeObserver

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
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
    }

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
      if (resizeObserver) resizeObserver.disconnect()
      simulation.stop()
      svg.selectAll('*').remove()
    }
  }, [emojiNodes, emojiLinks, tagNodes, onNodeTap])

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
