import { useEffect, useRef } from 'react'

const ORBITS = {
  metaphor: 0,
  tag: 80,
  word: 130,
  echo: 190,
}

const TYPE_STYLE = {
  metaphor: { radius: 34, color: '#fbbf24' },
  tag: { radius: 16, color: '#60a5fa' },
  word: { radius: 5, color: '#94a3b8' },
  echo: { radius: 14, color: '#bae6fd' },
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

export function drawLinks(layer, links) {
  const linkGroup = createSvgElement('g', { stroke: '#cbd5e1', 'stroke-opacity': 0.45 }, layer)

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

export function drawNodes(layer, nodes, handlers = {}) {
  const nodeGroup = createSvgElement('g', {}, layer)

  const nodeElements = nodes.map((node) => {
    const group = createSvgElement('g', {}, nodeGroup)
    const baseRadius = TYPE_STYLE[node.level]?.radius || 10
    const circle = createSvgElement(
      'circle',
      {
        r: baseRadius,
        fill: TYPE_STYLE[node.level]?.color || '#cbd5e1',
        'fill-opacity': node.level === 'echo' ? 0.5 : 0.95,
        'data-node-id': node.id,
        stroke: node.level === 'metaphor' ? 'rgba(251,191,36,0.55)' : 'rgba(226,232,240,0.12)',
        'stroke-width': node.level === 'metaphor' ? 6 : 2,
      },
      group
    )
    circle.dataset.nodeId = node.id
    circle.dataset.baseRadius = String(baseRadius)
    circle.dataset.baseStrokeWidth = circle.getAttribute('stroke-width')
    circle.dataset.baseStroke = circle.getAttribute('stroke')

    if (node.level === 'metaphor') {
      createSvgElement(
        'text',
        {
          'text-anchor': 'middle',
          dy: '0.35em',
          'font-size': '24px',
          fill: '#0f172a',
        },
        group
      ).textContent = node.emoji || '✨'
    }

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

  const focusNode = (nodeId) => {
    nodeElements.forEach(({ circle, node }) => {
      const isTarget = node.id === nodeId
      circle.setAttribute('opacity', isTarget ? '1' : '0.2')
      circle.setAttribute('stroke-width', isTarget ? '8' : circle.dataset.baseStrokeWidth)
      circle.setAttribute('stroke', isTarget ? 'rgba(255,255,255,0.35)' : circle.dataset.baseStroke)
    })
  }

  const resetHighlight = () => {
    nodeElements.forEach(({ circle, node }) => {
      circle.setAttribute('opacity', node.level === 'echo' ? '0.65' : '0.95')
      circle.setAttribute('stroke-width', node.level === 'metaphor' ? '6' : '2')
      circle.setAttribute('stroke', node.level === 'metaphor' ? 'rgba(251,191,36,0.55)' : 'rgba(226,232,240,0.12)')
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
      if (node.level === 'metaphor') {
        const delta = Math.sin(time * 0.002) * 2.5
        circle.setAttribute('r', String(baseRadius + delta))
      } else {
        circle.setAttribute('r', String(baseRadius))
      }
    })
  }

  return { updatePositions, focusNode, resetHighlight, pulse }
}

export default function CosmoGraph({
  nodes = [],
  links = [],
  onEchoLongPress,
  onEmptyTap,
  onReset,
  debug = false,
}) {
  const containerRef = useRef(null)
  const rafRef = useRef(null)
  const activeMetaphorRef = useRef(null)
  const scaleRef = useRef(1)
  const pinchStartRef = useRef(null)
  const pointerPositions = useRef(new Map())

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
        'touch-action': 'none',
        style: 'background:#0b1221; border-radius:12px;',
      },
      el
    )

    const scene = createSvgElement('g', {}, svg)

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

    const linkAPI = drawLinks(scene, links)
    const nodeAPI = drawNodes(scene, nodes, {
      onTap: (node) => {
        window.clearTimeout(highlightTimeout)
        activeMetaphorRef.current = node.level === 'metaphor' ? node.id : null
        nodeAPI.resetHighlight()
        linkAPI.reset()
        nodeAPI.focusNode(node.id)
        linkAPI.highlightNode(node.id)
      },
      onLongPress: (node) => {
        nodeAPI.focusNode(node.id)
        linkAPI.highlightNode(node.id)
        if (node.level === 'echo') onEchoLongPress?.(node.label)
      },
    })

    const resetScene = () => {
      activeMetaphorRef.current = null
      nodeAPI.resetHighlight()
      linkAPI.reset()
      onReset?.()
    }

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

    const updateScale = (scale) => {
      const clamped = Math.min(Math.max(scale, 0.65), 2.2)
      scaleRef.current = clamped
      scene.setAttribute(
        'transform',
        `translate(${(1 - clamped) * (width / 2)}, ${(1 - clamped) * (height / 2)}) scale(${clamped})`
      )
    }

    const handlePointerDown = (event) => {
      pointerPositions.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (!event.target.closest('[data-node-id]')) {
        resetScene()
        onEmptyTap?.()
      }

      if (pointerPositions.current.size === 2) {
        const points = Array.from(pointerPositions.current.values())
        const dx = points[0].x - points[1].x
        const dy = points[0].y - points[1].y
        pinchStartRef.current = { distance: Math.hypot(dx, dy), scale: scaleRef.current }
      }
    }

    const handlePointerMove = (event) => {
      if (!pointerPositions.current.has(event.pointerId)) return
      pointerPositions.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

      if (pointerPositions.current.size === 2 && pinchStartRef.current) {
        const points = Array.from(pointerPositions.current.values())
        const dx = points[0].x - points[1].x
        const dy = points[0].y - points[1].y
        const distance = Math.hypot(dx, dy)
        const ratio = distance / pinchStartRef.current.distance
        updateScale(pinchStartRef.current.scale * ratio)
      }
    }

    const handlePointerUp = (event) => {
      pointerPositions.current.delete(event.pointerId)
      if (pointerPositions.current.size < 2) {
        pinchStartRef.current = null
      }
    }

    svg.addEventListener('pointerdown', handlePointerDown)
    svg.addEventListener('pointermove', handlePointerMove)
    svg.addEventListener('pointerup', handlePointerUp)
    svg.addEventListener('pointercancel', handlePointerUp)

    loop(0)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      svg.removeEventListener('pointerdown', handlePointerDown)
      svg.removeEventListener('pointermove', handlePointerMove)
      svg.removeEventListener('pointerup', handlePointerUp)
      svg.removeEventListener('pointercancel', handlePointerUp)
      svg.replaceChildren()
      window.clearTimeout(highlightTimeout)
    }
  }, [nodes, links, onEchoLongPress, onEmptyTap, onReset])

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
