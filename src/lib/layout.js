const typeRadius = {
  center: 0,
  metaphor: 0.12,
  echo: 0.18,
  word: 0.26,
  tag: 0.34,
  style: 0.4,
  usage: 0.46,
  other: 0.3,
}

function seededRandom(seed = 11) {
  let value = seed % 2147483647
  if (value <= 0) value += 2147483646

  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

function hashSeed(text = '') {
  return text
    .split('')
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 2147483647, 17)
}

function placeRing(nodes, center, radiusBase, jitter, seed) {
  const random = seededRandom(seed)
  const step = (Math.PI * 2) / Math.max(nodes.length, 1)

  return nodes.map((node, index) => {
    const angle = step * index + random() * jitter
    const radius = radiusBase * (0.9 + random() * 0.2)

    return {
      ...node,
      position: {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      },
    }
  })
}

export function buildConstellationLayout(nodes = [], edges = [], viewport = { width: 360, height: 480 }) {
  const { width = 360, height = 480 } = viewport
  const center = { x: width / 2, y: Math.max(height * 0.44, height / 3) }

  if (!Array.isArray(nodes) || !nodes.length) return []

  const grouped = {
    metaphor: [],
    echo: [],
    word: [],
    tag: [],
    style: [],
    usage: [],
    other: [],
  }

  nodes.forEach((node) => {
    const bucket = grouped[node.type] ? grouped[node.type] : grouped.other
    bucket.push(node)
  })

  const centerNode = grouped.metaphor[0] || grouped.word[0] || nodes[0]
  const layout = new Map()

  if (centerNode) {
    layout.set(centerNode.id, { ...centerNode, position: { ...center } })
  }

  const radiusUnit = Math.min(width, height) * 0.28
  const rings = [
    { list: grouped.echo, type: 'echo' },
    { list: grouped.word, type: 'word' },
    { list: grouped.tag, type: 'tag' },
    { list: grouped.style, type: 'style' },
    { list: grouped.usage, type: 'usage' },
    { list: grouped.other, type: 'other' },
  ]

  rings.forEach(({ list, type }) => {
    if (!list.length) return
    const baseRadius = radiusUnit * (1 + (typeRadius[type] || typeRadius.other))
    const seeded = hashSeed(`${type}-${list.length}-${centerNode?.id || 'root'}`)
    placeRing(list, center, baseRadius, 0.8, seeded).forEach((node) => layout.set(node.id, node))
  })

  return nodes.map((node, index) => {
    const positioned = layout.get(node.id)
    if (positioned?.position) return positioned

    const fallbackSeed = hashSeed(`${node.id}-${index}`)
    const random = seededRandom(fallbackSeed)
    const angle = random() * Math.PI * 2
    const radius = radiusUnit * 0.6 * (0.9 + random() * 0.2)

    return {
      ...node,
      position: {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      },
    }
  })
}

