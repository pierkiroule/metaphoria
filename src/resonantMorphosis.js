// Resonant morphosis generator (local, no AI)
// Transforms raw text into a metaphoric resonance structure with graph nodes/links.

const stopWords = new Set([
  'et', 'ou', 'de', 'des', 'du', 'la', 'le', 'les', 'un', 'une', 'en', 'dans', 'sur', 'sous', 'avec',
  'que', 'qui', 'quoi', 'où', 'au', 'aux', 'ce', 'cet', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes',
  'son', 'sa', 'ses', 'leur', 'leurs', 'pour', 'par', 'pas', 'ne', 'plus', 'je', 'tu', 'il', 'elle', 'on', 'nous',
  'vous', 'ils', 'elles', 'y', 'a', 'd', 'l', "l'", "d'",
])

const metaphoricFields = [
  {
    id: 'air',
    label: 'Souffle / Air',
    emoji: '🫧',
    keywords: ['souffle', 'respir', 'air', 'léger', 'vide', 'pression', 'étouff', 'apnée', 'manque'],
    verbs: ['gonfler', 'retenir', 'expirer', 'flotter'],
    tags: ['légèreté', 'retenue', 'suspension', 'souffle'],
    images: ['un souffle suspendu', 'une poche d’air', 'une respiration tenue'],
  },
  {
    id: 'water',
    label: 'Eau / Flux',
    emoji: '💧',
    keywords: ['vague', 'marée', 'flux', 'flot', 'courant', 'mouillé', 'noy', 'immer', 'pluie', 'ruisseau'],
    verbs: ['couler', 'submerger', 'ruisseler', 'diluer'],
    tags: ['flux', 'marée', 'dissolution', 'percolation'],
    images: ['un ruissellement intérieur', 'une bulle pleine', 'une marée discrète'],
  },
  {
    id: 'fire',
    label: 'Feu / Intensité',
    emoji: '🔥',
    keywords: ['brûl', 'feu', 'fièvre', 'ardeur', 'incand', 'colère', 'rage', 'tension'],
    verbs: ['brûler', 'chauffer', 'étinceler', 'frapper'],
    tags: ['incandescence', 'tension', 'braise', 'scintillement'],
    images: ['une braise sous la peau', 'un filament rouge', 'une chaleur contenue'],
  },
  {
    id: 'earth',
    label: 'Terre / Appui',
    emoji: '🪨',
    keywords: ['lourd', 'lourdeur', 'roche', 'pierre', 'sol', 'terre', 'ancrage', 'bloc', 'inert', 'fatigue'],
    verbs: ['appuyer', 'porter', 'poser', 'retenir'],
    tags: ['appui', 'gravité', 'immobilité', 'ancrage'],
    images: ['un pas qui s’enfonce', 'une dalle froide', 'une gravité douce'],
  },
  {
    id: 'shadow',
    label: 'Ombre / Retrait',
    emoji: '🌘',
    keywords: ['ombre', 'noir', 'silence', 'retrait', 'caché', 'secret', 'nuit', 'discret'],
    verbs: ['retenir', 'replier', 'envelopper'],
    tags: ['repli', 'secret', 'gestation', 'clair-obscur'],
    images: ['un pli d’ombre', 'un rideau entrouvert', 'une chaleur gardée'],
  },
  {
    id: 'light',
    label: 'Lumière / Apparition',
    emoji: '✨',
    keywords: ['lumière', 'clair', 'lueur', 'illum', 'révé', 'appara', 'étincelle'],
    verbs: ['éclairer', 'révéler', 'scintiller'],
    tags: ['éclat', 'révélation', 'scintillement', 'perce'],
    images: ['une lueur basse', 'un reflet mince', 'un éclat discret'],
  },
  {
    id: 'threshold',
    label: 'Passage / Seuil',
    emoji: '🚪',
    keywords: ['seuil', 'passage', 'ouvrir', 'fermer', 'transition', 'limite'],
    verbs: ['entrer', 'sortir', 'basculer'],
    tags: ['seuil', 'passage', 'franchissement', 'portail'],
    images: ['un pas en suspens', 'une porte entrouverte', 'un sas calme'],
  },
  {
    id: 'weave',
    label: 'Tissage / Lien',
    emoji: '🕸️',
    keywords: ['lien', 'tisser', 'relier', 'fil', 'trame', 'réseau', 'noeud'],
    verbs: ['lier', 'tisser', 'connecter'],
    tags: ['liaison', 'fil', 'trame', 'nœud'],
    images: ['un fil discret', 'une trame douce', 'un réseau souple'],
  },
  {
    id: 'time',
    label: 'Temps / Rythme',
    emoji: '⏳',
    keywords: ['temps', 'rythme', 'lent', 'rapide', 'attente', 'battement', 'cycle'],
    verbs: ['ralentir', 'attendre', 'recommencer'],
    tags: ['tempo', 'attente', 'battement', 'cycle'],
    images: ['un battement sourd', 'un temps étiré', 'une reprise lente'],
  },
  {
    id: 'body',
    label: 'Corps / Sensation',
    emoji: '🤲',
    keywords: ['corps', 'peau', 'chair', 'muscle', 'os', 'respir', 'tendu', 'fatigue', 'sensation'],
    verbs: ['ressentir', 'tendre', 'relâcher'],
    tags: ['tension', 'sensation', 'contact', 'impulsion'],
    images: ['une peau qui écoute', 'un muscle en veille', 'un geste prêt'],
  },
]

const fallback = {
  sourceText: '',
  dominantMetaphoricField: 'Écho discret',
  emoji: '…',
  resonantTags: ['silence', 'pause', 'écoute'],
  metaphoricEchoes: ["L’écho reste discret. Rien n’insiste pour l’instant."],
  graphNodes: [],
  graphLinks: [],
}

function tokenize(text) {
  return text
    .split(/[^a-zA-Z0-9À-ÿ]+/)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token && !stopWords.has(token))
}

function scoreFields(tokens) {
  return metaphoricFields.map((field) => {
    const keywordScore = tokens.reduce((score, token) => {
      const matchedKeyword = field.keywords.some((keyword) => token.includes(keyword) || keyword.includes(token))
      return matchedKeyword ? score + 2 : score
    }, 0)

    const verbScore = tokens.reduce((score, token) => {
      const matchedVerb = field.verbs.some((verb) => token.includes(verb) || verb.includes(token))
      return matchedVerb ? score + 1 : score
    }, 0)

    return { field, score: keywordScore + verbScore }
  })
}

function hashSeed(tokens) {
  return tokens.join('-').split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 9973, 11)
}

function pick(list, seed, count) {
  if (!list.length || count <= 0) return []
  const results = []
  let cursor = seed
  while (results.length < count) {
    const choice = list[Math.abs(cursor) % list.length]
    if (!results.includes(choice)) results.push(choice)
    cursor += 5
  }
  return results
}

function buildTags(field, tokens, seed) {
  const frequency = tokens.reduce((map, token) => {
    map.set(token, (map.get(token) || 0) + 1)
    return map
  }, new Map())

  const dominantTokens = Array.from(frequency.entries())
    .filter(([token]) => token.length > 2)
    .sort((a, b) => b[1] - a[1])
    .map(([token]) => token)

  const combined = [...dominantTokens, ...field.tags]
  const unique = combined.filter((token, index) => combined.indexOf(token) === index)
  return pick(unique, seed, Math.min(4, unique.length))
}

function craftEchoes(field, tokens, seed) {
  const textures = [
    'comme',
    'presque',
    'doucement',
    'lentement',
    'en sourdine',
  ]

  const feelings = ['tient', 'retient', 'attend', 'cherche', 'se glisse']
  const anchors = field.images.length ? field.images : ['un geste discret']

  const lines = []
  const baseSeed = seed
  const words = pick(tokens, baseSeed + 7, 3)

  pick(anchors, baseSeed + 3, 3).forEach((image, index) => {
    const cue = words[index] || field.tags[index] || field.label.toLowerCase()
    const texture = textures[Math.abs(baseSeed + index * 11) % textures.length]
    const feel = feelings[Math.abs(baseSeed + index * 13) % feelings.length]
    lines.push(`${texture} ${image}, ${feel} ${cue}.`)
  })

  return lines.slice(0, 4)
}

function buildGraph(tokens, field, secondaryFields, tags, echoes) {
  const nodes = []
  const links = []

  const wordFrequency = tokens.reduce((map, token) => {
    map.set(token, (map.get(token) || 0) + 1)
    return map
  }, new Map())

  Array.from(wordFrequency.entries()).forEach(([token, count], index) => {
    nodes.push({ id: `word-${token}-${index}`, type: 'word', label: token, weight: 1 + count * 0.2, emoji: '•' })
  })

  tags.forEach((tag, index) => {
    nodes.push({ id: `tag-${tag}-${index}`, type: 'tag', label: tag, weight: 1.1, emoji: '✧' })
  })

  const metaphorNodes = [field, ...secondaryFields.slice(0, 2)].map((item, index) => ({
    id: `metaphor-${item.id}-${index}`,
    type: 'metaphor',
    label: item.label,
    weight: 1.6 - index * 0.15,
    emoji: item.emoji,
  }))
  nodes.push(...metaphorNodes)

  echoes.forEach((line, index) => {
    nodes.push({ id: `echo-${index}`, type: 'echo', label: line, weight: 1.2, emoji: '🫧' })
  })

  const tagNodes = nodes.filter((node) => node.type === 'tag')
  const echoNodes = nodes.filter((node) => node.type === 'echo')

  // Word -> Tag links
  nodes
    .filter((node) => node.type === 'word')
    .forEach((wordNode, index) => {
      const target = tagNodes[index % Math.max(tagNodes.length, 1)]
      if (target) links.push({ source: wordNode.id, target: target.id, weight: 1 })
    })

  // Tag -> Metaphor links
  tagNodes.forEach((tagNode) => {
    metaphorNodes.forEach((metaphor, index) => {
      const strength = 1.4 - index * 0.2
      links.push({ source: tagNode.id, target: metaphor.id, weight: strength })
    })
  })

  // Metaphor -> Echo links
  echoNodes.forEach((echoNode) => {
    links.push({ source: metaphorNodes[0].id, target: echoNode.id, weight: 1.6 })
  })

  return { nodes, links }
}

function generateResonantMorphosis(text) {
  const trimmed = (text || '').trim()
  const tokens = tokenize(trimmed)

  if (!tokens.length) return { ...fallback, sourceText: trimmed }

  const scored = scoreFields(tokens).sort((a, b) => b.score - a.score)
  const dominant = scored[0]

  if (!dominant || dominant.score === 0) return { ...fallback, sourceText: trimmed }

  const secondary = scored.filter((entry) => entry.field.id !== dominant.field.id && entry.score > 0).map((entry) => entry.field)
  const seed = hashSeed(tokens)

  const resonantTags = buildTags(dominant.field, tokens, seed + 5)
  const metaphoricEchoes = craftEchoes(dominant.field, tokens, seed + 9)

  const { nodes: graphNodes, links: graphLinks } = buildGraph(tokens, dominant.field, secondary, resonantTags, metaphoricEchoes)

  return {
    sourceText: trimmed,
    dominantMetaphoricField: dominant.field.label,
    emoji: dominant.field.emoji,
    resonantTags,
    metaphoricEchoes,
    graphNodes,
    graphLinks,
  }
}

export { generateResonantMorphosis }
