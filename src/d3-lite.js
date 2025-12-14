// Lightweight D3-inspired helpers for environments without the full library.
// This subset supports the small selection, drag, zoom, and force behaviors used in EchoGraph.

const SVG_NS = 'http://www.w3.org/2000/svg'
const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(fn, 16)

class Selection {
  constructor(nodes) {
    this.nodes = Array.isArray(nodes) ? nodes : [nodes]
  }

  selectAll(selector) {
    const collected = this.nodes.flatMap((node) => Array.from(node.querySelectorAll(selector)))
    return new Selection(collected)
  }

  append(tag) {
    const appended = this.nodes.map((node) => {
      const element = node.namespaceURI ? node.ownerDocument.createElementNS(SVG_NS, tag) : node.ownerDocument.createElement(tag)
      node.appendChild(element)
      return element
    })
    return new Selection(appended)
  }

  attr(name, value) {
    this.nodes.forEach((node, index) => {
      const resolved = typeof value === 'function' ? value(node.__data__, index) : value
      if (resolved !== undefined) {
        node.setAttribute(name, resolved)
      }
    })
    return this
  }

  text(value) {
    this.nodes.forEach((node, index) => {
      const resolved = typeof value === 'function' ? value(node.__data__, index) : value
      node.textContent = resolved ?? ''
    })
    return this
  }

  data(dataArray) {
    const parent = this.nodes[0]
    return {
      enter: () => new EnterSelection(parent, dataArray),
    }
  }

  on(eventName, handler, options) {
    this.nodes.forEach((node) => node.addEventListener(eventName, (event) => handler(event, node.__data__), options))
    return this
  }

  call(fn, ...args) {
    fn(this, ...args)
    return this
  }

  transition() {
    return this
  }

  duration() {
    return this
  }

  remove() {
    this.nodes.forEach((node) => node.remove())
    return this
  }
}

class EnterSelection extends Selection {
  constructor(parent, dataArray) {
    const created = dataArray.map((datum) => {
      const element = parent.namespaceURI
        ? parent.ownerDocument.createElementNS(SVG_NS, 'g')
        : parent.ownerDocument.createElement('g')
      element.__data__ = datum
      parent.appendChild(element)
      return element
    })
    super(created)
  }

  append(tag) {
    this.nodes.forEach((node, index) => {
      const child = node.namespaceURI
        ? node.ownerDocument.createElementNS(SVG_NS, tag)
        : node.ownerDocument.createElement(tag)
      child.__data__ = node.__data__
      node.parentNode.replaceChild(child, node)
      this.nodes[index] = child
    })
    return this
  }
}

function select(target) {
  return new Selection(target)
}

// Force simulation (very small subset)
function forceSimulation(nodes) {
  const items = nodes.map((node, index) => ({
    ...node,
    x: node.x ?? 120 + Math.random() * 80 + index * 4,
    y: node.y ?? 120 + Math.random() * 60 + index * 3,
    vx: 0,
    vy: 0,
  }))

  const forces = new Map()
  const tickHandlers = []
  let running = true

  const applyForces = () => {
    forces.forEach((force) => force(items))
    items.forEach((node) => {
      node.vx *= 0.92
      node.vy *= 0.92
      node.x += node.vx
      node.y += node.vy
    })
  }

  const step = () => {
    if (!running) return
    applyForces()
    tickHandlers.forEach((handler) => handler())
    raf(step)
  }

  raf(step)

  const api = {
    nodes: items,
    force(name, force) {
      forces.set(name, force)
      return api
    },
    on(eventName, handler) {
      if (eventName === 'tick') tickHandlers.push(handler)
      return api
    },
    alphaTarget() {
      return api
    },
    restart() {
      if (!running) {
        running = true
        raf(step)
      }
      return api
    },
    stop() {
      running = false
    },
  }

  return api
}

function forceLink(links) {
  let idAccessor = (d) => d.id
  let distance = 80

  const resolvedLinks = links.map((link) => ({ ...link }))

  const force = (nodes) => {
    const nodeById = new Map(nodes.map((node) => [idAccessor(node), node]))
    resolvedLinks.forEach((link) => {
      const source = typeof link.source === 'object' ? link.source : nodeById.get(link.source)
      const target = typeof link.target === 'object' ? link.target : nodeById.get(link.target)
      if (!source || !target) return
      const dx = target.x - source.x
      const dy = target.y - source.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const desired = typeof distance === 'function' ? distance(link) : distance
      const strength = 0.02
      const diff = (dist - desired) * strength
      const offsetX = (dx / dist) * diff
      const offsetY = (dy / dist) * diff
      source.vx += offsetX
      source.vy += offsetY
      target.vx -= offsetX
      target.vy -= offsetY
      link.source = source
      link.target = target
    })
  }

  force.id = (fn) => {
    idAccessor = fn
    return force
  }

  force.distance = (fn) => {
    distance = fn
    return force
  }

  return force
}

function forceManyBody() {
  let strength = -120

  const force = (nodes) => {
    nodes.forEach((node, i) => {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const other = nodes[j]
        const dx = node.x - other.x
        const dy = node.y - other.y
        const distSq = dx * dx + dy * dy || 1
        const forceValue = (strength * 5) / distSq
        const fx = (dx / Math.sqrt(distSq)) * forceValue
        const fy = (dy / Math.sqrt(distSq)) * forceValue
        node.vx += fx
        node.vy += fy
        other.vx -= fx
        other.vy -= fy
      }
    })
  }

  force.strength = (value) => {
    strength = value
    return force
  }

  return force
}

function forceCenter(x, y) {
  return (nodes) => {
    nodes.forEach((node) => {
      node.vx += (x - node.x) * 0.005
      node.vy += (y - node.y) * 0.005
    })
  }
}

function forceCollide() {
  let radius = 12

  const force = (nodes) => {
    nodes.forEach((node, i) => {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const other = nodes[j]
        const dx = other.x - node.x
        const dy = other.y - node.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const minDist = (typeof radius === 'function' ? radius(node) : radius) + (typeof radius === 'function' ? radius(other) : radius)
        if (dist < minDist) {
          const overlap = (minDist - dist) / dist
          const adjustX = dx * overlap * 0.5
          const adjustY = dy * overlap * 0.5
          other.x += adjustX
          other.y += adjustY
          node.x -= adjustX
          node.y -= adjustY
        }
      }
    })
  }

  force.radius = (value) => {
    radius = value
    return force
  }

  return force
}

function max(array, accessor = (d) => d) {
  if (!Array.isArray(array) || array.length === 0) return undefined
  let value = -Infinity
  array.forEach((item) => {
    const v = accessor(item)
    if (v > value) value = v
  })
  return value
}

function scaleSqrt() {
  let domain = [0, 1]
  let range = [0, 1]

  const scale = (value) => {
    const [d0, d1] = domain
    const [r0, r1] = range
    const denom = Math.sqrt(d1 - d0 || 1)
    const t = (Math.sqrt(Math.max(value - d0, 0)) / denom) || 0
    return r0 + t * (r1 - r0)
  }

  scale.domain = (next) => {
    domain = next
    return scale
  }

  scale.range = (next) => {
    range = next
    return scale
  }

  return scale
}

function zoomIdentity() {
  return { k: 1, x: 0, y: 0 }
}

function zoom() {
  let scaleExtent = [0.6, 3]
  let zoomHandler = () => {}

  const behavior = (selection) => {
    selection.on('wheel', (event) => {
      const delta = -event.deltaY * 0.001
      const current = event.currentTarget.__zoom ?? { k: 1, x: 0, y: 0 }
      let nextScale = Math.min(scaleExtent[1], Math.max(scaleExtent[0], current.k + delta))
      event.currentTarget.__zoom = { ...current, k: nextScale }
      zoomHandler({ transform: event.currentTarget.__zoom })
    })
  }

  behavior.scaleExtent = (extent) => {
    scaleExtent = extent
    return behavior
  }

  behavior.on = (eventName, handler) => {
    if (eventName === 'zoom') zoomHandler = handler
    return behavior
  }

  behavior.transform = (selection, transform) => {
    selection.attr('data-zoom', `${transform.k},${transform.x},${transform.y}`)
    zoomHandler({ transform })
  }

  return behavior
}

function drag() {
  const handlers = { start: () => {}, drag: () => {}, end: () => {} }

  const behavior = (selection) => {
    selection.on('pointerdown', (event, datum) => {
      handlers.start(event, datum)
      const move = (moveEvent) => handlers.drag(moveEvent, datum)
      const up = (upEvent) => {
        handlers.end(upEvent, datum)
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up, { once: true })
    })
  }

  behavior.on = (name, handler) => {
    handlers[name] = handler
    return behavior
  }

  return behavior
}

function selectAll(selector) {
  return new Selection(Array.from(document.querySelectorAll(selector)))
}

export {
  drag,
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  select,
  selectAll,
  max,
  scaleSqrt,
  zoom,
  zoomIdentity,
}
