import { useEffect, useMemo, useRef, useState } from 'react'

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

function craftResonanceEcho(nodeA, nodeB) {
  if (!nodeA || !nodeB) return ''
  const labelA = nodeA.label || nodeA.id
  const labelB = nodeB.label || nodeB.id
  const typeA = nodeA.level || nodeA.type || 'fragment'
  const typeB = nodeB.level || nodeB.type || 'fragment'

  const palette = [
    `Un souffle ${typeA}-${typeB} relie ${labelA} et ${labelB}.`,
    `${labelA} et ${labelB} scintillent en tandem, comme deux ${typeA}s complices.`,
    `Entre ${labelA} et ${labelB}, une onde douce murmure un nouvel écho.`,
  ]

  return palette[(labelA.length + labelB.length) % palette.length]
}

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

  const highlightPair = (ids) => {
    const setFocus = new Set(ids)
    linkElements.forEach(({ line, link }) => {
      const connectsPair = setFocus.has(link.source) && setFocus.has(link.target)
      const touches = setFocus.has(link.source) || setFocus.has(link.target)
      line.setAttribute('stroke-opacity', connectsPair ? '0.95' : touches ? '0.35' : '0.05')
      line.setAttribute(
        'stroke-width',
        connectsPair ? Math.max(1.8, (link.weight || 1) * 1.25) : touches ? Math.max(1.2, (link.weight || 1) * 0.9) : '0.6'
      )
    })
  }

  const reset = () => {
    linkElements.forEach(({ line, link }) => {
      line.setAttribute('stroke-opacity', '0.45')
      line.setAttribute('stroke-width', Math.max(1, (link.weight || link.strength || 1) * 0.8))
    })
  }

  return { updatePositions, highlightNode, highlightPair, reset }
}

export function drawNodes(layer, nodes, handlers = {}) {
  const nodeGroup = createSvgElement('g', {}, layer)

  const lastTap = { id: null, time: 0 }

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
    let longPressed = false

    group.addEventListener('pointerdown', () => {
      longPressed = false
      pressTimer = window.setTimeout(() => {
        longPressed = true
        handlers.onLongPress?.(node)
      }, 520)
    })

    group.addEventListener('pointerup', () => {
      window.clearTimeout(pressTimer)
      if (longPressed) return

      const now = Date.now()
      const isDoubleTap = lastTap.id === node.id && now - lastTap.time < 320
      if (isDoubleTap) {
        lastTap.id = null
        lastTap.time = 0
        handlers.onDoubleTap?.(node)
        return
      }

      lastTap.id = node.id
      lastTap.time = now
      handlers.onTap?.(node)
    })

    group.addEventListener('pointerleave', () => {
      window.clearTimeout(pressTimer)
    })

    return { group, circle, node }
  })

  const applyFocusView = ({ focusedId, visibleTags }) => {
    const tagSet = visibleTags ?? new Set()
    nodeElements.forEach(({ circle, node }) => {
      if (node.level === 'tag') {
        const isVisible = focusedId && tagSet.has(node.id)
        circle.setAttribute('opacity', isVisible ? '0.9' : focusedId ? '0.02' : '0.02')
        circle.setAttribute('stroke-width', isVisible ? '3' : circle.dataset.baseStrokeWidth)
        circle.setAttribute(
          'stroke',
          isVisible ? 'rgba(96,165,250,0.65)' : circle.dataset.baseStroke || 'rgba(226,232,240,0.12)'
        )
        return
      }

      if (focusedId) {
        const isTarget = node.id === focusedId
        circle.setAttribute('opacity', isTarget ? '1' : '0.2')
        circle.setAttribute('stroke-width', isTarget ? '8' : circle.dataset.baseStrokeWidth)
        circle.setAttribute('stroke', isTarget ? 'rgba(255,255,255,0.35)' : circle.dataset.baseStroke)
      } else {
        circle.setAttribute('opacity', node.level === 'echo' ? '0.65' : '0.95')
        circle.setAttribute('stroke-width', node.level === 'metaphor' ? '6' : '2')
        circle.setAttribute('stroke', node.level === 'metaphor' ? 'rgba(251,191,36,0.55)' : 'rgba(226,232,240,0.12)')
      }
    })
  }

  const focusNode = (nodeId) => {
    nodeElements.forEach(({ circle, node }) => {
      const isTarget = node.id === nodeId
      circle.setAttribute('opacity', isTarget ? '1' : '0.2')
      circle.setAttribute('stroke-width', isTarget ? '8' : circle.dataset.baseStrokeWidth)
      circle.setAttribute('stroke', isTarget ? 'rgba(255,255,255,0.35)' : circle.dataset.baseStroke)
    })
  }

  const focusPair = (pairIds) => {
    const setFocus = new Set(pairIds)
    nodeElements.forEach(({ circle, node }) => {
      const isTarget = setFocus.has(node.id)
      circle.setAttribute('opacity', isTarget ? '1' : '0.12')
      circle.setAttribute('stroke-width', isTarget ? '8' : circle.dataset.baseStrokeWidth)
      circle.setAttribute('stroke', isTarget ? 'rgba(255,255,255,0.45)' : circle.dataset.baseStroke)
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

  return { updatePositions, focusNode, focusPair, resetHighlight, pulse, applyFocusView }
}

export default function CosmoGraph({
  nodes = [],
  links = [],
  onMurmur,
  onEmptyTap,
  onReset,
}) {
  const containerRef = useRef(null)
  const rafRef = useRef(null)
  const activeMetaphorRef = useRef(null)
  const scaleRef = useRef(1)
  const pinchStartRef = useRef(null)
  const pointerPositions = useRef(new Map())
  const resonanceRef = useRef(null)
  const resonanceStateRef = useRef(null)
  const graphAPIRef = useRef({})
  const focusRef = useRef(null)
  const focusTagsRef = useRef([])
  const scaleControlRef = useRef(() => {})
  const [selection, setSelection] = useState([])
  const [resonance, setResonance] = useState(null)
  const [stableEchoes, setStableEchoes] = useState([])
  const [focusedEmoji, setFocusedEmoji] = useState(null)

  const combinedNodes = useMemo(() => [...nodes, ...stableEchoes], [nodes, stableEchoes])
  const nodeMap = useMemo(() => new Map(combinedNodes.map((node) => [node.id, node])), [combinedNodes])

  const focusTagIds = useMemo(() => {
    if (!focusedEmoji) return []
    const set = new Set()
    links.forEach((link) => {
      if (link.source === focusedEmoji) {
        const target = nodeMap.get(link.target)
        if (target?.level === 'tag') set.add(target.id)
      }
      if (link.target === focusedEmoji) {
        const source = nodeMap.get(link.source)
        if (source?.level === 'tag') set.add(source.id)
      }
    })
    return Array.from(set)
  }, [focusedEmoji, links, nodeMap])

  const craftMurmur = (node) => {
    const label = node.label || node.id
    if (node.level === 'metaphor') return `🪨 ${label} · Un centre respire doucement.`
    if (node.level === 'tag') return `✧ ${label} · Une nuance se dévoile.`
    if (node.level === 'echo') return `🫧 ${label}`
    return `• ${label}`
  }

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

    const nodesAvailable = combinedNodes.length > 0

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
    const nodeAPI = drawNodes(scene, combinedNodes, {
      onTap: (node) => {
        window.clearTimeout(highlightTimeout)
        activeMetaphorRef.current = node.level === 'metaphor' ? node.id : null
        nodeAPI.resetHighlight()
        linkAPI.reset()
        nodeAPI.focusNode(node.id)
        linkAPI.highlightNode(node.id)
        onMurmur?.(craftMurmur(node))
        if (node.level !== 'tag') setFocusedEmoji(node.id)
      },
      onLongPress: (node) => {
        if (node.level === 'metaphor' || node.level === 'tag') {
          setFocusedEmoji(node.id)
          scaleControlRef.current?.(1.18)
        }
        nodeAPI.focusNode(node.id)
        linkAPI.highlightNode(node.id)
      },
      onDoubleTap: (node) => {
        setSelection((previous) => {
          if (previous.includes(node.id)) return previous
          const next = [...previous.slice(-1), node.id]
          return next
        })
      },
    })

    const resonanceGroup = createSvgElement('g', { opacity: 0, 'pointer-events': 'auto' }, scene)
    const resonanceCircle = createSvgElement(
      'circle',
      { r: 18, fill: 'rgba(244, 244, 255, 0.65)', stroke: 'rgba(255,255,255,0.55)', 'stroke-width': 2 },
      resonanceGroup
    )
    const resonanceText = createSvgElement(
      'text',
      { 'text-anchor': 'middle', dy: '0.35em', fill: '#0f172a', 'font-size': '11px', 'font-weight': '600' },
      resonanceGroup
    )
    resonanceRef.current = { group: resonanceGroup, text: resonanceText, circle: resonanceCircle }
    graphAPIRef.current = { nodeAPI, linkAPI }

    focusRef.current = focusedEmoji
    focusTagsRef.current = focusTagIds
    nodeAPI.applyFocusView({ focusedId: focusRef.current, visibleTags: new Set(focusTagsRef.current) })

    let resonancePress

    resonanceGroup.addEventListener('pointerdown', () => {
      resonancePress = window.setTimeout(() => {
        if (!resonanceStateRef.current?.text) return
        setStableEchoes((prev) => [
          ...prev,
          {
            id: `resonance-${Date.now()}`,
            label: resonanceStateRef.current.text,
            level: 'echo',
            emoji: '🫧',
          },
        ])
      }, 560)
    })

    resonanceGroup.addEventListener('pointerup', () => {
      window.clearTimeout(resonancePress)
    })

    resonanceGroup.addEventListener('pointerleave', () => {
      window.clearTimeout(resonancePress)
    })

    const resetScene = () => {
      activeMetaphorRef.current = null
      nodeAPI.resetHighlight()
      linkAPI.reset()
      setSelection([])
      setResonance(null)
      setFocusedEmoji(null)
      scaleControlRef.current?.(1)
      onReset?.()
    }

    const safeRender = (timestamp) => {
      try {
        const positioned = computeOrbitalPositions(combinedNodes, width, height, timestamp)
        const posMap = new Map(positioned.map((node) => [node.id, node]))

        const focusedId = focusRef.current
        const visibleTags = focusTagsRef.current || []
        if (focusedId && visibleTags.length) {
          const focusPos = posMap.get(focusedId)
          if (focusPos) {
            const total = visibleTags.length
            visibleTags.forEach((tagId, index) => {
              const pos = posMap.get(tagId)
              if (!pos) return
              const angle = (2 * Math.PI * index) / total + timestamp * 0.0012
              const localRadius = 70 + Math.sin(timestamp * 0.001 + index) * 6
              pos.x = focusPos.x + localRadius * Math.cos(angle)
              pos.y = focusPos.y + localRadius * Math.sin(angle)
              posMap.set(tagId, pos)
            })
          }
        }

        linkAPI.updatePositions(posMap)
        nodeAPI.updatePositions(posMap)
        nodeAPI.pulse(timestamp, activeMetaphorRef.current)

        if (resonanceStateRef.current?.pair?.length === 2 && resonanceRef.current) {
          const [first, second] = resonanceStateRef.current.pair
          const a = posMap.get(first)
          const b = posMap.get(second)
          if (a && b) {
            const midX = (a.x + b.x) / 2
            const midY = (a.y + b.y) / 2
            resonanceRef.current.group.setAttribute('transform', `translate(${midX},${midY})`)
            resonanceRef.current.group.setAttribute('opacity', '1')
            resonanceRef.current.text.textContent = resonanceStateRef.current.text || ''
          } else {
            resonanceRef.current.group.setAttribute('opacity', '0')
          }
        } else if (resonanceRef.current) {
          resonanceRef.current.group.setAttribute('opacity', '0')
        }
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
      const clamped = Math.min(Math.max(scale, 0.75), 1.8)
      scaleRef.current = clamped
      scene.setAttribute(
        'transform',
        `translate(${(1 - clamped) * (width / 2)}, ${(1 - clamped) * (height / 2)}) scale(${clamped})`
      )
    }
    scaleControlRef.current = updateScale

    const handlePointerDown = (event) => {
      pointerPositions.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (!event.target.closest('[data-node-id]')) {
        resetScene()
        onEmptyTap?.()
        setSelection([])
        setResonance(null)
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
    }, [combinedNodes, links, onEmptyTap, onReset])

  useEffect(() => {
    const validIds = new Set(combinedNodes.map((node) => node.id))
    setSelection((previous) => previous.filter((id) => validIds.has(id)))
  }, [combinedNodes])

  useEffect(() => {
    if (selection.length === 2) {
      const [first, second] = selection
      const a = combinedNodes.find((node) => node.id === first)
      const b = combinedNodes.find((node) => node.id === second)
      if (a && b) {
        setResonance({ pair: selection, text: craftResonanceEcho(a, b) })
      } else {
        setResonance(null)
      }
    } else {
      setResonance(null)
    }
  }, [selection, combinedNodes])

  useEffect(() => {
    focusRef.current = focusedEmoji
    focusTagsRef.current = focusTagIds
    const { nodeAPI, linkAPI } = graphAPIRef.current
    nodeAPI?.applyFocusView({ focusedId: focusedEmoji, visibleTags: new Set(focusTagIds) })
    if (!selection.length) {
      if (focusedEmoji) {
        linkAPI?.highlightNode(focusedEmoji)
      } else {
        linkAPI?.reset()
      }
    }
  }, [focusedEmoji, focusTagIds, selection.length])

  useEffect(() => {
    resonanceStateRef.current = resonance
    if (!resonance && resonanceRef.current) {
      resonanceRef.current.group.setAttribute('opacity', '0')
    }
  }, [resonance])

  useEffect(() => {
    const { nodeAPI, linkAPI } = graphAPIRef.current
    if (!nodeAPI || !linkAPI) return undefined

    if (selection.length === 2) {
      nodeAPI.focusPair(selection)
      linkAPI.highlightPair(selection)
    } else if (selection.length === 1) {
      nodeAPI.focusNode(selection[0])
      linkAPI.highlightNode(selection[0])
    } else {
      nodeAPI.applyFocusView({ focusedId: focusedEmoji, visibleTags: new Set(focusTagIds) })
      if (focusedEmoji) {
        linkAPI.highlightNode(focusedEmoji)
      } else {
        linkAPI.reset()
      }
    }

    return undefined
  }, [selection, focusedEmoji, focusTagIds])

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
        position: 'relative',
      }}
      aria-live="polite"
    >
      {focusedEmoji && (
        <button
          type="button"
          className="graph-back"
          aria-label="Revenir à la vue globale"
          onClick={() => setFocusedEmoji(null)}
        >
          ← Retour
        </button>
      )}
    </div>
  )
}
