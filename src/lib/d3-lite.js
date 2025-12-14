// Minimal D3-like utilities for offline force simulations and pointer helpers.
// This is intentionally lightweight and inspired by d3-force/d3-zoom APIs.

function optionalFunc(value, defaultValue) {
  if (typeof value === 'function') return value
  return () => (value !== undefined ? value : defaultValue)
}

export function forceSimulation(initialNodes = []) {
  let nodes = initialNodes
  let alpha = 1
  let alphaMin = 0.001
  let alphaTarget = 0
  let alphaDecay = 0.02
  let velocityDecay = 0.4
  let running = false
  let frame = null
  const forces = new Map()
  const listeners = new Map()

  function updateForces() {
    forces.forEach((force) => force.initialize?.(nodes))
  }

  function step() {
    if (!running) return

    alpha += (alphaTarget - alpha) * alphaDecay
    if (alpha < alphaMin) {
      running = false
      listeners.get('end')?.({ alpha })
      return
    }

    forces.forEach((force) => force(alpha))

    for (const node of nodes) {
      if (!Number.isFinite(node.vx)) node.vx = 0
      if (!Number.isFinite(node.vy)) node.vy = 0

      node.vx *= 1 - velocityDecay
      node.vy *= 1 - velocityDecay

      if (node.fx != null) {
        node.x = node.fx
        node.vx = 0
      } else {
        node.x += node.vx
      }

      if (node.fy != null) {
        node.y = node.fy
        node.vy = 0
      } else {
        node.y += node.vy
      }
    }

    listeners.get('tick')?.({ alpha })
    frame = requestAnimationFrame(step)
  }

  const simulation = {
    restart() {
      running = true
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(step)
      return simulation
    },
    stop() {
      running = false
      cancelAnimationFrame(frame)
      return simulation
    },
    on(name, callback) {
      if (!callback) {
        listeners.delete(name)
        return simulation
      }
      listeners.set(name, callback)
      return simulation
    },
    force(name, force) {
      if (force == null) {
        forces.delete(name)
      } else {
        forces.set(name, force)
        force.initialize?.(nodes)
      }
      return simulation
    },
    nodes(value) {
      if (!arguments.length) return nodes
      nodes = value
      updateForces()
      return simulation
    },
    alpha(value) {
      if (!arguments.length) return alpha
      alpha = value
      return simulation.restart()
    },
    alphaTarget(value) {
      if (!arguments.length) return alphaTarget
      alphaTarget = value
      return simulation.restart()
    },
    alphaMin(value) {
      if (!arguments.length) return alphaMin
      alphaMin = value
      return simulation
    },
    alphaDecay(value) {
      if (!arguments.length) return alphaDecay
      alphaDecay = value
      return simulation
    },
    velocityDecay(value) {
      if (!arguments.length) return velocityDecay
      velocityDecay = value
      return simulation
    },
  }

  updateForces()
  return simulation
}

export function forceCenter(x = 0, y = 0) {
  let nodes = []
  let strength = 0.1

  function force(alpha) {
    const sx = x
    const sy = y
    for (const node of nodes) {
      node.vx += (sx - node.x) * strength * alpha
      node.vy += (sy - node.y) * strength * alpha
    }
  }

  force.initialize = (newNodes) => {
    nodes = newNodes
  }

  force.x = (value) => {
    if (!arguments.length) return x
    x = value
    return force
  }

  force.y = (value) => {
    if (!arguments.length) return y
    y = value
    return force
  }

  force.strength = (value) => {
    if (!arguments.length) return strength
    strength = value
    return force
  }

  return force
}

export function forceManyBody(strengthValue = -30) {
  let nodes = []
  let strength = optionalFunc(strengthValue, -30)

  function force(alpha) {
    const n = nodes.length
    for (let i = 0; i < n; i += 1) {
      const nodeA = nodes[i]
      for (let j = i + 1; j < n; j += 1) {
        const nodeB = nodes[j]
        const dx = nodeB.x - nodeA.x
        const dy = nodeB.y - nodeA.y
        const distSq = dx * dx + dy * dy || 1e-6
        const s = (strength(nodeA) * strength(nodeB)) / distSq
        const k = s * alpha
        nodeA.vx += dx * k
        nodeA.vy += dy * k
        nodeB.vx -= dx * k
        nodeB.vy -= dy * k
      }
    }
  }

  force.initialize = (newNodes) => {
    nodes = newNodes
  }

  force.strength = (value) => {
    if (!arguments.length) return strength
    strength = optionalFunc(value, -30)
    return force
  }

  return force
}

export function forceLink(initialLinks = []) {
  let id = (d) => d.id
  let links = initialLinks
  let distance = optionalFunc(120, 120)
  let strength = optionalFunc(0.1, 0.1)
  let nodes = []

  function force(alpha) {
    for (const link of links) {
      const source = link.source
      const target = link.target
      if (!source || !target) continue

      const dx = (target.x || 0) - (source.x || 0)
      const dy = (target.y || 0) - (source.y || 0)
      const dist = Math.sqrt(dx * dx + dy * dy) || 1e-6
      const desired = distance(link)
      const strengthValue = strength(link)
      const k = ((dist - desired) / dist) * strengthValue * alpha

      const offsetX = dx * k
      const offsetY = dy * k
      target.x -= offsetX
      target.y -= offsetY
      source.x += offsetX
      source.y += offsetY
    }
  }

  function resolveNodes() {
    links.forEach((link) => {
      if (typeof link.source !== 'object') {
        const sourceId = link.source
        link.source = nodes.find((node) => id(node) === sourceId) || link.source
      }
      if (typeof link.target !== 'object') {
        const targetId = link.target
        link.target = nodes.find((node) => id(node) === targetId) || link.target
      }
    })
  }

  force.initialize = (newNodes) => {
    nodes = newNodes
    resolveNodes()
  }

  force.id = (fn) => {
    if (!arguments.length) return id
    id = fn
    resolveNodes()
    return force
  }

  force.links = (value) => {
    if (!arguments.length) return links
    links = value
    resolveNodes()
    return force
  }

  force.distance = (value) => {
    if (!arguments.length) return distance
    distance = optionalFunc(value, 120)
    return force
  }

  force.strength = (value) => {
    if (!arguments.length) return strength
    strength = optionalFunc(value, 0.1)
    return force
  }

  return force
}

export function forceCollide(radiusValue = 1) {
  let nodes = []
  let radius = optionalFunc(radiusValue, 1)
  let strength = 0.7

  function force() {
    const n = nodes.length
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const nodeA = nodes[i]
        const nodeB = nodes[j]
        const dx = nodeB.x - nodeA.x
        const dy = nodeB.y - nodeA.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1e-6
        const minDist = radius(nodeA) + radius(nodeB)

        if (dist < minDist) {
          const diff = ((minDist - dist) / dist) * strength
          const offsetX = dx * diff * 0.5
          const offsetY = dy * diff * 0.5
          nodeA.x -= offsetX
          nodeA.y -= offsetY
          nodeB.x += offsetX
          nodeB.y += offsetY
        }
      }
    }
  }

  force.initialize = (newNodes) => {
    nodes = newNodes
  }

  force.radius = (value) => {
    if (!arguments.length) return radius
    radius = optionalFunc(value, 1)
    return force
  }

  force.strength = (value) => {
    if (!arguments.length) return strength
    strength = value
    return force
  }

  return force
}

export function pointer(event, element) {
  const rect = element?.getBoundingClientRect?.()
  if (!rect) return [event.clientX, event.clientY]
  return [event.clientX - rect.left, event.clientY - rect.top]
}
