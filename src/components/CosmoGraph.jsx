import { useEffect, useRef } from 'react'

const ORBITS = {
  metaphor: 0,
  tag: 80,
  word: 130,
  echo: 190,
}

const TYPE_STYLE = {
  metaphor: { radius: 34, color: '#f59e0b', label: '✨' },
  tag: { radius: 18, color: '#60a5fa', label: '✧' },
  word: { radius: 6, color: '#94a3b8', label: '•' },
  echo: { radius: 12, color: '#bae6fd', label: '🫧' },
}

const SVG_NS = 'http://www.w3.org/2000/svg'

function createSvgElement(name, attributes = {}, parent) {
  const element = document.createElementNS(SVG_NS, name)
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      element.setAttribute(key, value)
    }
  })
  if (parent) parent.appendChild(element)
  return element
}

export function computeOrbitalPositions(nodes, width, height, time = 0) {
  const cx = width / 2
  const cy = height / 2

  const grouped = {
    metaphor: [],
    tag: [],
    word: [],
    echo: [],
    other: [],
  }

  nodes.forEach((node) => {
    const level = node.level || node.type || 'other'
    if (grouped[level]) {
      grouped[level].push(node)
    } else {
      grouped.other.push(node)
    }
  })

  const positions = []

  const float = (index, baseRadius) => {
    const wobble = Math.sin(time * 0.0012 + index) + Math.cos(time * 0.0008 + index * 1.3)
    return baseRadius + wobble * 2.8
  }

  const placeRing = (list, radius) => {
    const total = Math.max(list.length, 1)
    list.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / total - Math.PI / 2
      const r = float(index, radius)
      positions.push({
        ...node,
        level: node.level || node.type,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      })
    })
  }

  if (grouped.metaphor.length) {
    grouped.metaphor.forEach((node, index) => {
      const r = float(index, ORBITS.metaphor)
      positions.push({
        ...node,
        level: node.level || node.type,
        x: cx + r,
        y: cy,
      })
    })
  } else if (nodes.length) {
    const fallback = nodes[0]
    positions.push({ ...fallback, level: fallback.level || fallback.type, x: cx, y: cy })
  }

  placeRing(grouped.tag, ORBITS.tag)
  placeRing(grouped.word, ORBITS.word)
  placeRing(grouped.echo, ORBITS.echo)
  placeRing(grouped.other, ORBITS.word)

  return positions
}

export function drawLinks(svg, links) {
  const linkGroup = createSvgElement('g', { stroke: '#cbd5e1', 'stroke-opacity': 0.45 }, svg)

  const linkElements = links.map((link) => {
    const line = createSvgElement(
      'line',
      { 'stroke-width': Math.max(1, (link.weight || link.strength || 1) * 0.8) },
      linkGroup
    )
    return { line, link }
  })

  const updatePositions = (posMap) => {
    linkElements.forEach(({ line, link }) => {
      const source = posMap.get(link.source)
      const target = posMap.get(link.target)
      line.setAttribute('x1', source?.x ?? 0)
      line.setAttribute('y1', source?.y ?? 0)
      line.setAttribute('x2', target?.x ?? 0)
      line.setAttribute('y2', target?.y ?? 0)
    })
  }

  const highlightNode = (nodeId) => {
    linkElements.forEach(({ line, link }) => {
      const connected = link.source === nodeId || link.target === nodeId
      line.setAttribute('stroke-opacity', connected ? '0.95' : '0.08')
      line.setAttribute('stroke-width', connected ? Math.max(1.4, (link.weight || 1) * 1.1) : '0.8')
    })
  }

  const reset = () => {
    linkElements.forEach(({ line, link }) => {
      line.setAttribute('stroke-opacity', '0.45')
      line.setAttribute('stroke-width', Math.max(1, (link.weight || link.strength || 1) * 0.8))
    })
  }

  return { updatePositions, highlightNode, reset }
}

export function drawNodes(svg, nodes, handlers = {}) {
  const nodeGroup = createSvgElement('g', {}, svg)

  const nodeElements = nodes.map((node) => {
    const group = createSvgElement('g', {}, nodeGroup)
    const baseRadius = TYPE_STYLE[node.level]?.radius || 10
    const circle = createSvgElement(
      'circle',
      {
        r: baseRadius,
        fill: TYPE_STYLE[node.level]?.color || '#cbd5e1',
        'fill-opacity': node.level === 'echo' ? 0.7 : 0.92,
        'data-node-id': node.id,
      },
      group
    )
    circle.dataset.nodeId = node.id
    circle.dataset.baseRadius = String(baseRadius)

    createSvgElement(
      'text',
      {
        'text-anchor': 'middle',
        dy: '0.35em',
        'font-size': node.level === 'metaphor' ? '24px' : '16px',
      },
      group
    ).textContent = node.emoji || TYPE_STYLE[node.level]?.label || '•'

    let pressTimer

    group.addEventListener('pointerdown', () => {
      pressTimer = window.setTimeout(() => handlers.onLongPress?.(node), 520)
    })

    group.addEventListener('pointerup', () => {
      window.clearTimeout(pressTimer)
      handlers.onTap?.(node)
    })

    group.addEventListener('pointerleave', () => {
      window.clearTimeout(pressTimer)
    })

    return { group, circle, node }
  })

  const highlightNode = (nodeId) => {
    nodeElements.forEach(({ circle, node }) => {
      const isTarget = node.id === nodeId
      circle.setAttribute('opacity', isTarget ? '1' : '0.25')
    })
  }

  const resetHighlight = () => {
    nodeElements.forEach(({ circle, node }) => {
      circle.setAttribute('opacity', node.level === 'echo' ? '0.82' : '0.92')
    })
  }

  const updatePositions = (posMap) => {
    nodeElements.forEach(({ group, node }) => {
      const pos = posMap.get(node.id)
      group.setAttribute('transform', `translate(${pos?.x ?? 0},${pos?.y ?? 0})`)
    })
  }

  const pulse = (time, activeId) => {
    nodeElements.forEach(({ circle, node }) => {
      const baseRadius = Number(circle.dataset.baseRadius) || 10
      if (node.id === activeId) {
        const delta = Math.sin(time * 0.003) * 3
        circle.setAttribute('r', String(baseRadius + delta))
      } else {
        circle.setAttribute('r', String(baseRadius))
      }
    })
  }

  return { updatePositions, highlightNode, resetHighlight, pulse }
}

export default function CosmoGraph({ nodes = [], links = [], onEchoSelect, debug = false }) {
  const containerRef = useRef(null)
  const rafRef = useRef(null)
  const activeMetaphorRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined

    const width = el.clientWidth || window.innerWidth || 360
    const height = Math.max(el.clientHeight, 320) || 360

    el.innerHTML = ''

    const svg = createSvgElement(
      'svg',
      {
        viewBox: `0 0 ${width} ${height}`,
        width: '100%',
        height: '100%',
        preserveAspectRatio: 'xMidYMid meet',
        role: 'img',
        'aria-label': 'CosmoGraph orbital',
        'touch-action': 'manipulation',
        style: 'background:#0b1221; border-radius:12px;',
      },
      el
    )

    const nodesAvailable = nodes.length > 0

    if (!nodesAvailable) {
      createSvgElement(
        'text',
        {
          x: width / 2,
          y: height / 2,
          'text-anchor': 'middle',
          fill: '#cbd5e1',
          'font-size': '16px',
        },
        svg
      ).textContent = 'Aucune métabulle'
      return () => {
        svg.replaceChildren()
      }
    }

    let highlightTimeout

    const linkAPI = drawLinks(svg, links)
    const nodeAPI = drawNodes(svg, nodes, {
      onTap: (node) => {
        window.clearTimeout(highlightTimeout)
        if (node.level === 'echo') {
          onEchoSelect?.(node.label)
        } else if (node.level === 'tag') {
          nodeAPI.highlightNode(node.id)
          linkAPI.highlightNode(node.id)
          highlightTimeout = window.setTimeout(() => {
            nodeAPI.resetHighlight()
            linkAPI.reset()
          }, 1200)
        } else if (node.level === 'metaphor') {
          activeMetaphorRef.current = node.id
          nodeAPI.highlightNode(node.id)
          highlightTimeout = window.setTimeout(() => {
            nodeAPI.resetHighlight()
            activeMetaphorRef.current = null
          }, 1600)
        } else {
          nodeAPI.resetHighlight()
          linkAPI.reset()
        }
      },
      onLongPress: (node) => {
        nodeAPI.highlightNode(node.id)
        linkAPI.highlightNode(node.id)
      },
    })

    const safeRender = (timestamp) => {
      try {
        const positioned = computeOrbitalPositions(nodes, width, height, timestamp)
        const posMap = new Map(positioned.map((node) => [node.id, node]))

        linkAPI.updatePositions(posMap)
        nodeAPI.updatePositions(posMap)
        nodeAPI.pulse(timestamp, activeMetaphorRef.current)
      } catch (error) {
        console.error('CosmoGraph render error', error)
        svg.replaceChildren()
        createSvgElement(
          'text',
          {
            x: width / 2,
            y: height / 2,
            'text-anchor': 'middle',
            fill: '#ef4444',
            'font-size': '16px',
          },
          svg
        ).textContent = 'Aucune métabulle'
      }
    }

    const loop = (time) => {
      safeRender(time)
      rafRef.current = requestAnimationFrame(loop)
    }

    loop(0)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      svg.replaceChildren()
      window.clearTimeout(highlightTimeout)
    }
  }, [nodes, links, onEchoSelect])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '320px',
        background: 'transparent',
        color: '#e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        touchAction: 'manipulation',
      }}
      aria-live="polite"
    >
      {debug && (
        <p style={{ margin: '8px 12px', color: '#94a3b8', fontSize: '13px' }}>
          Debug : {nodes.length} nœuds, {links.length} liens
        </p>
      )}
    </div>
  )
}
